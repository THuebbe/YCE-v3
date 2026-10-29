# Sign packages

Status: **IDEA (was "bundles", recorded 2026-10-22)**. Not at launch.

A supplier's package, e.g. Victory Store's sports pack (2 soccer balls,
2 footballs, basketballs, baseballs...).

- Its purpose is receiving stock: add the package once and every sign in it,
  in its quantities, goes into the agency's inventory.
- Maybe later booking uses packages to find related signs (football goes with
  baseball), but individual signs already cover that.
- Needs its own tables: platform-curated packages with package items (sign +
  quantity), never edits to shared `sign_library` rows.
- The old agency-made bundle creator was removed 2026-10-22: no quantities,
  one bundle per sign, no agency scoping, and an unauthenticated server action
  that rewrote shared library rows. The empty `bundles` table and
  `sign_library.bundle_id/bundle_position` columns are unused until then.
- Pairs with FASTER-STOCKING.md.
