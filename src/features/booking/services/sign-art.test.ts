// Every extra the configurator can place has its art. Run: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { indexManifest, resolveArt, type SignAssetManifest } from './sign-assets';
import { MOCK_BACKDROPS, MOCK_BOOKENDS, MOCK_DECORATIONS, artSlug } from './catalog-keys';

const manifest = JSON.parse(readFileSync('public/sign-assets/manifest.json', 'utf8')) as SignAssetManifest;
const index = indexManifest(manifest);
// Stars and Heart come in the letter colorways as shapes, not as art
const SHAPES = new Set(['Stars', 'Heart']);

test('every decoration, backdrop and bookend has art in the manifest, and the file exists', () => {
  const missing: string[] = [];
  const check = (kind: 'decoration' | 'backdrop' | 'bookend', names: string[]) => {
    for (const name of names) {
      if (SHAPES.has(name)) continue;
      const art = resolveArt(index, kind, artSlug(name));
      if (!art || !existsSync(`public/sign-assets/${art.file}`)) missing.push(`${kind}: ${name}`);
    }
  };
  check('decoration', MOCK_DECORATIONS);
  check('backdrop', MOCK_BACKDROPS);
  check('bookend', MOCK_BOOKENDS);
  assert.deepEqual(missing, []);
});

test('art stands on the ground like the letters: a real size and a baseline near the bottom', () => {
  for (const a of manifest.assets.filter(a => a.style === 'art')) {
    assert.ok(a.heightIn > 10 && a.heightIn < 50, `${a.id} is ${a.heightIn}in`);
    assert.ok(a.baselineYPct > 0.8 && a.baselineYPct <= 1, `${a.id} baseline ${a.baselineYPct}`);
  }
});
