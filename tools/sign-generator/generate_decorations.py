#!/usr/bin/env python3
"""
Decoration, backdrop and bookend art for the yard scene, in the same
die-cut coroplast look as the letters (generate_signs.py): the art, then a
white border, a dark keyline and a soft ground shadow around the whole
piece. Art made of separate bits (confetti) draws its own backing shape in
the SVG, so the die-cut is one board like a real sign.

    node tools/sign-generator/rasterize_svgs.mjs tools/sign-generator/build/raw
    python3 tools/sign-generator/generate_decorations.py --raw tools/sign-generator/build/raw --out public/sign-assets

Sizes are real inches (PX_PER_INCH as the letters): see SIZES_IN.
"""
import argparse
import json
import os
from PIL import Image, ImageDraw, ImageFilter

from generate_signs import PX_PER_INCH, BORDER_PX, KEYLINE_PX, SHADOW_OFFSET, SHADOW_BLUR, dilate

KEYLINE = (38, 38, 38)
BORDER = (255, 255, 255)
PAD = 60


def fill_holes(mask):
    """Decoration signs are solid boards: gaps the outside can't reach (between ribbons, say) are filled."""
    outside = mask.copy()
    ImageDraw.floodfill(outside, (0, 0), 128)
    return outside.point(lambda v: 0 if v == 128 else 255)


def die_cut(art, height_px):
    """Scale the raw art to height_px, then wrap it in border + keyline + shadow."""
    art = art.resize((max(1, round(art.width * height_px / art.height)), height_px), Image.LANCZOS)
    w, h = art.width + PAD * 2, art.height + PAD * 2
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.alpha_composite(art, (PAD, PAD))
    m = fill_holes(canvas.getchannel("A").point(lambda a: 255 if a > 40 else 0))
    b = dilate(m, BORDER_PX)
    k = dilate(b, KEYLINE_PX)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 150), (0, 0), k)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(SHADOW_BLUR)), (SHADOW_OFFSET, SHADOW_OFFSET))
    img.paste(KEYLINE + (255,), (0, 0), k)
    img.paste(BORDER + (255,), (0, 0), b)
    img.alpha_composite(canvas)
    return img.crop(img.getbbox())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--height-in", type=float, default=20.0)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    for f in sorted(os.listdir(args.raw)):
        if not f.endswith(".png"):
            continue
        img = die_cut(Image.open(os.path.join(args.raw, f)).convert("RGBA"), int(args.height_in * PX_PER_INCH))
        img.save(os.path.join(args.out, f), optimize=True)
        print(f, img.size)


if __name__ == "__main__":
    main()
