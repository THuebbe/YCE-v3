// Rasterizes decorations/*.svg to transparent PNGs (raw art, no border yet)
// with the project's Playwright Chromium. generate_decorations.py adds the
// die-cut border, keyline and shadow so they match the letters.
//   node tools/sign-generator/rasterize_svgs.mjs <out-dir> [height-px]
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ?? join(here, 'build/raw');
const height = Number(process.argv[3] ?? 1200);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
for (const file of readdirSync(join(here, 'decorations')).filter(f => f.endsWith('.svg'))) {
  const svg = readFileSync(join(here, 'decorations', file), 'utf8');
  const [, , vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const width = Math.round(height * vw / vh);
  await page.setViewportSize({ width, height });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${width}px;height:${height}px}</style>${svg}`);
  await page.locator('svg').screenshot({ path: join(out, file.replace(/\.svg$/, '.png')), omitBackground: true });
}
await browser.close();
console.log('rasterized to', out);
