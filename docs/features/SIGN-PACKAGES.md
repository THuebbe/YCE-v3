# Sign packages

Status: **IDEA (was "bundles", recorded 2026-10-22; owner decisions 2026-11-02)**. Not at launch.

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

## Owner decisions (2026-11-02)
- **Platform-made only, never agency-built.** Packages come from the
  supplier's manifest (Victory Signs): when it arrives, its sports pack and
  the others become packages, built from the manifest, not in the app.
- **Shape:** each package has an id, name, category, and its items, each a
  sign plus how many of it the package holds (e.g. sports pack: 2 soccer
  balls, 2 footballs, ...). One click on "Add package" puts every item into
  the agency's stock at those quantities.
- **Why it matters:** first stocking is the slow step of agency setup. The
  owner's own agency was seeded by hand on 2026-11-02 (gold and red letters,
  numbers, punctuation and all decorations, 20 each:
  `migrations/20261102_seed_yardcard_elite_test_stock.sql`) rather than
  clicking ~140 signs in one at a time.
- Nothing is built until the manifest arrives.

