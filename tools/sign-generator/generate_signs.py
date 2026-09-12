#!/usr/bin/env python3
"""
YardCard Elite - placeholder sign asset generator.

Renders a full yard-card character set as transparent PNGs that imitate
die-cut coroplast lettering (colored face + white border + dark keyline +
soft ground shadow), and writes a manifest.json describing each asset.

These are PLACEHOLDERS. The manifest schema is the real deliverable - real
vendor photography drops into the same schema without touching app code.

Usage:
    python generate_signs.py --out ./public/sign-assets
"""

import argparse
import json
import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------------------------
# Physical model. Real yard card letters are ~24" tall coroplast on a stake.
# Everything downstream (spacing, scaling, overlap) should reason in INCHES,
# not pixels. Pixels are a rendering detail.
# ---------------------------------------------------------------------------
PX_PER_INCH = 20
LETTER_HEIGHT_IN = 24.0
CAP_PX = int(LETTER_HEIGHT_IN * PX_PER_INCH)   # 480

KEYLINE_PX = 22      # dark outer edge
BORDER_PX = 14       # white border inside the keyline
SHADOW_OFFSET = 10
SHADOW_BLUR = 9
PAD = 60             # canvas breathing room for strokes/shadow

FONTS = {
    "classic":  "fonts/LuckiestGuy-Regular.ttf",   # playful, closest to party letters
    "block":    "fonts/AlfaSlabOne-Regular.ttf",   # heavy slab
    "tall":     "fonts/Anton-Regular.ttf",         # condensed modern
    "rounded":  "fonts/Chewy-Regular.ttf",         # soft/bubbly
}

# face, border, keyline
PALETTES = {
    "red":    ((214, 40, 40), (255, 255, 255), (38, 38, 38)),
    "blue":   ((29, 111, 191), (255, 255, 255), (38, 38, 38)),
    "pink":   ((232, 90, 150), (255, 255, 255), (38, 38, 38)),
    "gold":   ((240, 179, 35), (255, 255, 255), (38, 38, 38)),
    "green":  ((46, 150, 90), (255, 255, 255), (38, 38, 38)),
    "purple": ((124, 76, 176), (255, 255, 255), (38, 38, 38)),
    "black":  ((38, 38, 38), (255, 255, 255), (38, 38, 38)),
}

LETTERS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
DIGITS = list("0123456789")
PUNCT = {
    "exclamation": "!", "question": "?", "ampersand": "&",
    "apostrophe": "'", "period": ".", "comma": ",", "hyphen": "-",
}


def load_font(path, cap_target):
    """Binary-search a pixel size so cap height lands on cap_target."""
    lo, hi = 10, 2000
    best = ImageFont.truetype(path, 100)
    for _ in range(24):
        mid = (lo + hi) // 2
        f = ImageFont.truetype(path, mid)
        bbox = f.getbbox("H")
        h = bbox[3] - bbox[1]
        if h > cap_target:
            hi = mid - 1
        else:
            best, lo = f, mid + 1
    return best


from PIL import ImageChops

def dilate(mask, r):
    """Circular dilation by stamping - far faster than MaxFilter/stroke_width."""
    if r <= 0:
        return mask
    out = mask.copy()
    steps = max(16, int(r * 1.6))
    for i in range(steps):
        a = 2 * math.pi * i / steps
        dx, dy = int(round(r * math.cos(a))), int(round(r * math.sin(a)))
        sh = ImageChops.offset(mask, dx, dy)
        out = ImageChops.lighter(out, sh)
    return out


_MASK_CACHE = {}

def glyph_masks(ch, font, style):
    """Return (face, border, keyline) L-masks + baseline, cached per char+style."""
    key = (ch, style)
    if key in _MASK_CACHE:
        return _MASK_CACHE[key]
    probe = ImageDraw.Draw(Image.new("L", (10, 10)))
    bb = probe.textbbox((0, 0), ch, font=font)
    w = bb[2] - bb[0] + PAD * 2
    h = bb[3] - bb[1] + PAD * 2
    ox, oy = PAD - bb[0], PAD - bb[1]
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).text((ox, oy), ch, font=font, fill=255)
    b = dilate(m, BORDER_PX)
    k = dilate(b, KEYLINE_PX)
    asc, _ = font.getmetrics()
    res = (m, b, k, oy + asc)
    _MASK_CACHE[key] = res
    return res


def render_glyph(ch, font, face, border, keyline, style="x"):
    m, b, k, baseline_y = glyph_masks(ch, font, style)
    w, h = m.size
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 150), (0, 0), k)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(SHADOW_BLUR)),
                        (SHADOW_OFFSET, SHADOW_OFFSET))
    for mask, col in ((k, keyline), (b, border), (m, face)):
        img.paste(col + (255,), (0, 0), mask)
    crop = img.getbbox()
    return img.crop(crop), baseline_y - crop[1]


def heart(size, face, border, keyline):
    """Procedural heart - fonts don't carry one reliably."""
    S = size * 4
    m = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(m)
    pts = []
    for i in range(721):
        t = math.radians(i * 0.5)
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t)
              - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((S / 2 + x * S / 38, S / 2 + y * S / 38))
    d.polygon(pts, fill=255)

    def grow(mask, px):
        return dilate(mask, px)

    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    b = grow(m, BORDER_PX); k = grow(b, KEYLINE_PX)
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 150), (0, 0), k)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(SHADOW_BLUR)),
                        (SHADOW_OFFSET, SHADOW_OFFSET))
    for mask, col in ((k, keyline), (b, border), (m, face)):
        img.paste(col + (255,), (0, 0), mask)
    img = img.crop(img.getbbox())
    return img.resize((int(img.width * size / img.height), size), Image.LANCZOS)


def star(size, face, border, keyline):
    S = size * 4
    m = Image.new("L", (S, S), 0)
    pts = []
    for i in range(10):
        a = math.radians(-90 + i * 36)
        r = S * 0.45 if i % 2 == 0 else S * 0.19
        pts.append((S / 2 + r * math.cos(a), S / 2 + r * math.sin(a)))
    ImageDraw.Draw(m).polygon(pts, fill=255)

    def grow(mask, px):
        return dilate(mask, px)

    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    b = grow(m, BORDER_PX); k = grow(b, KEYLINE_PX)
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 150), (0, 0), k)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(SHADOW_BLUR)),
                        (SHADOW_OFFSET, SHADOW_OFFSET))
    for mask, col in ((k, keyline), (b, border), (m, face)):
        img.paste(col + (255,), (0, 0), mask)
    img = img.crop(img.getbbox())
    return img.resize((int(img.width * size / img.height), size), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="sign-assets")
    ap.add_argument("--styles", default="classic")
    ap.add_argument("--palettes", default="red,blue,pink,gold,green,purple,black")
    args = ap.parse_args()

    styles = [s.strip() for s in args.styles.split(",")]
    palettes = [p.strip() for p in args.palettes.split(",")]
    os.makedirs(args.out, exist_ok=True)

    assets = []
    for style in styles:
        font = load_font(FONTS[style], CAP_PX)
        for pal in palettes:
            face, border, keyline = PALETTES[pal]
            d = os.path.join(args.out, style, pal)
            os.makedirs(d, exist_ok=True)

            items = ([(c, c, "letter", f"letter-{c.lower()}") for c in LETTERS]
                     + [(c, c, "number", f"number-{c}") for c in DIGITS]
                     + [(v, n, "punctuation", f"punct-{n}") for n, v in PUNCT.items()])

            for ch, name, kind, slug in items:
                img, base_y = render_glyph(ch, font, face, border, keyline, style)
                fn = f"{name}.png"
                img.save(os.path.join(d, fn), optimize=True)
                assets.append({
                    "id": f"{slug}-{style}-{pal}",
                    "type": kind,
                    "character": ch,
                    "style": style,
                    "colorway": pal,
                    "file": f"{style}/{pal}/{fn}",
                    "widthPx": img.width, "heightPx": img.height,
                    "widthIn": round(img.width / PX_PER_INCH, 2),
                    "heightIn": round(img.height / PX_PER_INCH, 2),
                    "baselineYPct": round(base_y / img.height, 4),
                    "stakeAnchor": {"xPct": 0.5, "yPct": round(base_y / img.height, 4)},
                    "placeholder": True,
                })

            for nm, fn_gen in (("heart", heart), ("star", star)):
                img = fn_gen(CAP_PX, face, border, keyline)
                img.save(os.path.join(d, f"{nm}.png"), optimize=True)
                assets.append({
                    "id": f"shape-{nm}-{style}-{pal}",
                    "type": "shape", "character": None,
                    "style": style, "colorway": pal,
                    "file": f"{style}/{pal}/{nm}.png",
                    "widthPx": img.width, "heightPx": img.height,
                    "widthIn": round(img.width / PX_PER_INCH, 2),
                    "heightIn": round(img.height / PX_PER_INCH, 2),
                    "baselineYPct": 0.97,
                    "stakeAnchor": {"xPct": 0.5, "yPct": 0.97},
                    "placeholder": True,
                })

    manifest = {
        "schemaVersion": 1,
        "generatedBy": "generate_signs.py",
        "placeholderSet": True,
        "pxPerInch": PX_PER_INCH,
        "nominalLetterHeightIn": LETTER_HEIGHT_IN,
        "styles": styles,
        "colorways": palettes,
        "assetCount": len(assets),
        "assets": assets,
    }
    with open(os.path.join(args.out, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"{len(assets)} assets -> {args.out}")


if __name__ == "__main__":
    main()
