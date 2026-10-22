// `pnpm lint:colors`: the color-token migration list for the whole app.
// Same rule as eslint.config.mjs, as warnings, everywhere. The count should
// only go down; DESIGN.md explains the migration.
import base, { COLOR_EXEMPT, colorRules } from './eslint.config.mjs';

export default [
  ...base,
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: COLOR_EXEMPT,
    rules: {
      'no-restricted-syntax': ['warn', ...colorRules()],
    },
  },
];
