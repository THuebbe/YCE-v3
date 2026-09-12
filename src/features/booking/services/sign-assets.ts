/**
 * Bridges the generated sign-asset manifest to the layout calculator.
 *
 * Drop at: src/features/booking/services/sign-assets.ts
 * Assets at: public/sign-assets/
 *
 * The point: layout-calculator emits WHAT to show (character, zone, order).
 * This resolves HOW to show it (which PNG, how wide, where the baseline is).
 * Keep those two jobs separate — when real vendor photography replaces the
 * placeholders, only this file's data source changes.
 */

export interface SignAsset {
  id: string;
  type: 'letter' | 'number' | 'punctuation' | 'shape';
  character: string | null;
  style: string;
  colorway: string;
  file: string;
  widthPx: number;
  heightPx: number;
  widthIn: number;
  heightIn: number;
  baselineYPct: number;
  stakeAnchor: { xPct: number; yPct: number };
  placeholder: boolean;
}

export interface SignAssetManifest {
  schemaVersion: number;
  pxPerInch: number;
  nominalLetterHeightIn: number;
  styles: string[];
  colorways: string[];
  assetCount: number;
  assets: SignAsset[];
}

const ASSET_BASE = '/sign-assets';

const PUNCT_FILE: Record<string, string> = {
  '!': 'exclamation', '?': 'question', '&': 'ampersand',
  "'": 'apostrophe', '.': 'period', ',': 'comma', '-': 'hyphen',
};

let cache: SignAssetManifest | null = null;

export async function loadManifest(): Promise<SignAssetManifest> {
  if (cache) return cache;
  const res = await fetch(`${ASSET_BASE}/manifest.json`);
  if (!res.ok) throw new Error(`sign manifest failed: ${res.status}`);
  cache = (await res.json()) as SignAssetManifest;
  return cache;
}

/** Index by "STYLE|COLORWAY|CHAR" for O(1) lookup during layout. */
export function indexManifest(m: SignAssetManifest): Map<string, SignAsset> {
  const map = new Map<string, SignAsset>();
  for (const a of m.assets) {
    const key = a.character ?? a.id.split('-')[1]; // shapes keyed by name
    map.set(`${a.style}|${a.colorway}|${key.toUpperCase()}`, a);
  }
  return map;
}

export function resolveAsset(
  index: Map<string, SignAsset>,
  character: string,
  style: string,
  colorway: string,
): SignAsset | null {
  return index.get(`${style}|${colorway}|${character.toUpperCase()}`) ?? null;
}

export function assetUrl(a: SignAsset): string {
  return `${ASSET_BASE}/${a.file}`;
}

/**
 * Convert a physical yard width to a render scale.
 *
 * This is the fix for the feet/rem mixing in layout-calculator. Decide the
 * yard's real width once (how wide the lawn in the background photo is),
 * and every asset scales from its own widthIn. Nothing hardcodes rem.
 */
export function pxPerFoot(canvasWidthPx: number, yardWidthFt: number): number {
  return canvasWidthPx / yardWidthFt;
}

export interface PlacedAsset {
  asset: SignAsset;
  leftPx: number;
  widthPx: number;
  heightPx: number;
  /** y of the ground line, so callers position by baseline not by bottom. */
  baselineOffsetPx: number;
}

/**
 * Lay a row of characters along a ground line.
 *
 * kerningIn is negative to overlap stakes slightly, which is how real
 * displays are set — letters touch or tuck behind each other.
 */
export function layoutRow(
  index: Map<string, SignAsset>,
  characters: string[],
  style: string,
  colorways: string[],
  scalePxPerFt: number,
  kerningIn = -1.5,
): { placed: PlacedAsset[]; totalWidthFt: number } {
  const placed: PlacedAsset[] = [];
  let xIn = 0;

  characters.forEach((ch, i) => {
    if (ch === ' ') { xIn += 8; return; } // word gap, inches
    const asset = resolveAsset(index, ch, style, colorways[i % colorways.length]);
    if (!asset) return; // caller decides whether a miss is fatal

    const wPx = (asset.widthIn / 12) * scalePxPerFt;
    const hPx = (asset.heightIn / 12) * scalePxPerFt;
    placed.push({
      asset,
      leftPx: (xIn / 12) * scalePxPerFt,
      widthPx: wPx,
      heightPx: hPx,
      baselineOffsetPx: hPx * asset.baselineYPct,
    });
    xIn += asset.widthIn + kerningIn;
  });

  return { placed, totalWidthFt: xIn / 12 };
}

/**
 * Which characters an agency can't currently spell. Run this against real
 * inventory before showing a preview — the preview must never promise a
 * letter the agency doesn't physically own.
 */
export function missingCharacters(
  index: Map<string, SignAsset>,
  text: string,
  style: string,
  colorway: string,
): string[] {
  const missing = new Set<string>();
  for (const ch of text.toUpperCase()) {
    if (ch === ' ') continue;
    const key = PUNCT_FILE[ch] ? ch : ch;
    if (!resolveAsset(index, key, style, colorway)) missing.add(ch);
  }
  return [...missing];
}
