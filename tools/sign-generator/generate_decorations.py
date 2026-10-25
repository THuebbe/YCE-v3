#!/usr/bin/env python3
"""
Decoration, backdrop and bookend art for the yard scene, in the same
die-cut coroplast look as the letters (generate_signs.py): the art, then a
white border, a dark keyline and a soft ground shadow around the whole
piece. Every piece is one solid board, since it stands on one set of stakes:
narrow slits are bridged and enclosed gaps filled. Art made of separate bits
(confetti) draws its own backing shape in the SVG.

    node tools/sign-generator/rasterize_svgs.mjs tools/sign-generator/build/raw
    python3 tools/sign-generator/generate_decorations.py --raw tools/sign-generator/build/raw --out public/sign-assets

Writes public/sign-assets/art/<kind>/<slug>.png and replaces the manifest's
art entries (style "art", colorway = kind, character = slug). These are
full-color pieces: the color pickers only apply to letters and numbers.
Which pieces the configurator places for which filter lives in
layout-calculator.ts (ART_KEYS and the catalogs).
"""
import argparse
import json
import os
from PIL import Image, ImageDraw, ImageFilter, ImageOps

from generate_signs import PX_PER_INCH, BORDER_PX, KEYLINE_PX, SHADOW_OFFSET, SHADOW_BLUR, dilate

KEYLINE = (38, 38, 38)
BORDER = (255, 255, 255)
PAD = 60
# Gaps narrower than about twice this (px) are bridged before the border goes on:
# a die-cutter doesn't follow the slit between two streamers or balloon strings
CLOSE_PX = 18

# kind -> board height in inches, and the pieces (SVG names in decorations/)
ART = {
    "decoration": (20, [
        "soccer-ball", "basketball", "baseball", "football", "volleyball", "trophy", "medal",
        "ballet-slippers", "disco-ball", "tutu",
        "music-notes", "guitar", "microphone",
        "art-palette", "paintbrush", "crayons",
        "open-book", "book-stack",
        "gaming-controller", "pixel-heart",
        "crown", "castle", "wand",
        "shield", "mask", "cape", "lightning-bolt",
        "rainbow", "flowers", "butterfly",
        "paw-print", "dinosaur", "bunny",
        "christmas-tree", "pumpkin", "ghost", "snowflake", "easter-egg", "american-flag", "fireworks",
        "balloon", "gift", "bow", "birthday-cake", "party-popper", "party-hat", "smiley",
        "graduation-cap", "diploma",
    ]),
    "backdrop": (26, ["confetti", "streamers", "balloon-cluster", "pinwheel-spinner", "star-spinner", "flower-spinner"]),
    "bookend": (36, ["balloon-bouquet"]),
}
# Bookends stand at both ends: the right one is the left one mirrored
MIRRORED = {"bookend": "{slug}-right"}


def fill_holes(mask):
    """Gaps the outside can't reach (inside a ribbon loop, say) become part of the board."""
    outside = mask.copy()
    ImageDraw.floodfill(outside, (0, 0), 128)
    return outside.point(lambda v: 0 if v == 128 else 255)


def close_gaps(mask, r):
    """Morphological closing: grow by r, then shrink by r, both with a round
    brush (shrinking = growing the background; a square MinFilter would cut
    square notches into concave corners)."""
    grown = dilate(mask, r)
    return ImageOps.invert(dilate(ImageOps.invert(grown), r))


def die_cut(art, height_px):
    """Scale the raw art to height_px and wrap it in border + keyline + shadow.
    Returns the image and the y of the board's bottom edge (where it meets the ground)."""
    art = art.resize((max(1, round(art.width * height_px / art.height)), height_px), Image.LANCZOS)
    w, h = art.width + PAD * 2, art.height + PAD * 2
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.alpha_composite(art, (PAD, PAD))
    m = fill_holes(close_gaps(canvas.getchannel("A").point(lambda a: 255 if a > 40 else 0), CLOSE_PX))
    b = dilate(m, BORDER_PX)
    k = dilate(b, KEYLINE_PX)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 150), (0, 0), k)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(SHADOW_BLUR)), (SHADOW_OFFSET, SHADOW_OFFSET))
    img.paste(KEYLINE + (255,), (0, 0), k)
    img.paste(BORDER + (255,), (0, 0), b)
    img.alpha_composite(canvas)
    crop = img.getbbox()
    return img.crop(crop), k.getbbox()[3] - crop[1]


def entry(kind, slug, img, baseline):
    return {
        "id": f"art-{kind}-{slug}", "type": kind, "character": slug, "style": "art", "colorway": kind,
        "file": f"art/{kind}/{slug}.png",
        "widthPx": img.width, "heightPx": img.height,
        "widthIn": round(img.width / PX_PER_INCH, 2), "heightIn": round(img.height / PX_PER_INCH, 2),
        "baselineYPct": round(baseline / img.height, 4),
        "stakeAnchor": {"xPct": 0.5, "yPct": round(baseline / img.height, 4)},
        "placeholder": True,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", required=True)
    ap.add_argument("--out", required=True, help="public/sign-assets (writes art/ and updates manifest.json)")
    args = ap.parse_args()

    entries = []
    for kind, (height_in, slugs) in ART.items():
        os.makedirs(os.path.join(args.out, "art", kind), exist_ok=True)
        for slug in slugs:
            img, baseline = die_cut(Image.open(os.path.join(args.raw, f"{slug}.png")).convert("RGBA"), int(height_in * PX_PER_INCH))
            pieces = [(slug, img)]
            if kind in MIRRORED:
                pieces.append((MIRRORED[kind].format(slug=slug), ImageOps.mirror(img)))
            for name, im in pieces:
                im.save(os.path.join(args.out, "art", kind, f"{name}.png"), optimize=True)
                entries.append(entry(kind, name, im, baseline))
                print(f"{kind}/{name}", im.size)

    path = os.path.join(args.out, "manifest.json")
    with open(path) as f:
        manifest = json.load(f)
    manifest["assets"] = [a for a in manifest["assets"] if a.get("style") != "art"] + entries
    manifest["assetCount"] = len(manifest["assets"])
    with open(path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"{len(entries)} art pieces, manifest now {manifest['assetCount']} assets")


if __name__ == "__main__":
    main()
