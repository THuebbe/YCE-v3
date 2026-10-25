"""Labeled placeholder PNGs for the mock signs (catalog-keys.ts) that have
no generated art, so inventory/library cards don't show broken images:
the ordinals, plus Stars/Heart (their art is per-colorway shapes). Every
other decoration, backdrop and bookend has full-color art
(tools/sign-generator/generate_decorations.py).
Writes public/sign-assets/placeholder/<asset_key>.png.
    python3 scripts/generate-mock-sign-placeholders.py
Keys must match scripts/generate-sign-seed.mjs (mock-* rows)."""
import os, re
from PIL import Image, ImageDraw, ImageFont

ORDINALS = ['ST', 'ND', 'RD', 'TH']
DECORATIONS = ['Stars', 'Heart']
# Same dev colors the configurator uses for each sign type
COLORS = {'ordinal': '#059669', 'decoration': '#7c3aed'}

slug = lambda s: re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', s.lower()))
signs = ([(f'mock-ordinal-{slug(o)}', o, 'ordinal') for o in ORDINALS]
         + [(f'mock-decoration-{slug(d)}', d, 'decoration') for d in DECORATIONS])

# Guard against drift: every sign the seed gives a placeholder image is generated here
seed = open('migrations/20261007_seed_placeholder_sign_library.sql').read()
placeholder_keys = set(re.findall(r"\('(mock-[a-z0-9-]+)'[^\n]*/sign-assets/placeholder/", seed))
assert placeholder_keys == {k for k, _, _ in signs}, f'placeholder keys differ from the seed: {placeholder_keys ^ {k for k, _, _ in signs}}'

out = 'public/sign-assets/placeholder'
os.makedirs(out, exist_ok=True)
font = ImageFont.truetype('tools/sign-generator/fonts/Anton-Regular.ttf', 44)
small = ImageFont.truetype('tools/sign-generator/fonts/Anton-Regular.ttf', 22)
for key, name, kind in signs:
    img = Image.new('RGB', (400, 300), '#f5f5f5')
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((40, 40, 360, 260), radius=24, fill=COLORS[kind])
    d.text((200, 135), name, font=font, fill='white', anchor='mm')
    d.text((200, 200), f'{kind.upper()} - PLACEHOLDER', font=small, fill='#e5e7eb', anchor='mm')
    img.save(f'{out}/{key}.png', optimize=True)
print(f'wrote {len(signs)} placeholders')
