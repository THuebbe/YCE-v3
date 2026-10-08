/**
 * Inventory keys: the link between what the layout calculator places and the
 * `sign_library.asset_key` row an agency stocks in `agency_inventory`.
 *
 * Asset-backed signs (letters, numbers, punctuation, heart/star shapes) use
 * the manifest asset id as their key. Signs with no generated art yet
 * (ordinals, most decorations, backdrops, bookends) use the `mock-*` keys
 * below. Both kinds are seeded by `scripts/generate-sign-seed.mjs`, so the
 * placeholder library is real inventory, just generously stocked (PRODUCT.md
 * "Placeholder data rule"). Swapping in the real library is a data change.
 *
 * Kept dependency-free on purpose: the seed generator imports this file
 * directly with Node's type stripping.
 */

export function slugifyKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const ordinalKey = (ordinal: string) => `mock-ordinal-${slugifyKey(ordinal)}`;
export const decorationKey = (name: string) => `mock-decoration-${slugifyKey(name)}`;
export const backdropKey = (name: string) => `mock-backdrop-${slugifyKey(name)}`;
export const bookendKey = (name: string) => `mock-bookend-${slugifyKey(name)}`;

export const MOCK_ORDINALS = ['ST', 'ND', 'RD', 'TH'];

/**
 * Every decoration name `layout-calculator.ts` can place (its hobby catalog
 * plus its theme pools). Stars/Heart have real art in every colorway and use
 * their shape asset key; they are listed here too as the fallback when a
 * style/colorway has no shape asset.
 */
export const MOCK_DECORATIONS = [
  'Baseball', 'Soccer Ball', 'Basketball', 'Gaming Controller', 'Music Notes',
  'Art Palette', 'Crown', 'Castle', 'Superhero Shield', 'Stars', 'Rainbow',
  'Flowers', 'Heart', 'Wand', 'Shield', 'Cape', 'Mask', 'Balloon', 'Gift', 'Bow',
];

export const MOCK_BACKDROPS = ['Balloon Cluster', 'Confetti', 'Streamers'];

export const MOCK_BOOKENDS = ['Left Bookend', 'Right Bookend'];
