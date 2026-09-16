---
name: wrapup
description: Close out a work session by updating STATE.md (and, when this session's changes made it factually wrong, ARCHITECTURE.md) with what actually changed. Use when the user says they're stopping, wrapping up, done for now, or invokes /wrapup. Also use when the user asks to update or refresh STATE.md.
---

# Session Wrapup

Update `STATE.md` in the repo root so the next session starts oriented
instead of doing archaeology. This project went dormant for 12 months
and cost a full day to re-enter. This file is the fix.

`ARCHITECTURE.md` gets touched too, but only under the narrower rule in
"ARCHITECTURE.md — correct, don't chronicle" below. It is a reference
doc, not a second log — most wrapups should not touch it at all.

## Steps

1. Read `STATE.md`.
2. Run `git status --short` and `git diff --stat` to see what actually
   changed this session. Do not rely on conversation memory alone.
3. Rewrite ONLY the sections that changed. Preserve everything else
   verbatim — this is an edit, not a regeneration.
4. Update the `Last verified:` date at the top.
5. Check whether this session's diff touches any file or behavior that
   `ARCHITECTURE.md` makes a specific claim about — its "files that
   matter" table is the fast check, but any named section counts. If so,
   re-read those specific sections and apply the ARCHITECTURE.md rule
   below. If nothing in the diff touches an architectural claim, leave
   the file untouched — don't go looking for reasons to edit it.

## Rules — these are the point of the file

- **Move items between sections rather than deleting them.** If
  something moved from VERIFIED BROKEN to VERIFIED WORKING, move it and
  say how it was fixed. History is what makes re-entry cheap.
- **Only write VERIFIED WORKING for things actually observed running.**
  Compiling is not working. A passing type-check is not working. If it
  wasn't seen in a browser or a test run, it goes under NOT VERIFIED.
- **Anything inferred goes in NOT VERIFIED, with how to check it.**
  A confident wrong claim in this file costs more than an admitted gap.
- **Record dead ends.** "Tried X, it didn't work because Y" prevents
  the next session repeating it. This is as valuable as recording wins.
- Keep it under ~150 lines. A file nobody rereads is worse than none.

## ARCHITECTURE.md — correct, don't chronicle

A stale architecture doc is worse than no doc — it's confidently wrong
instead of admittedly absent. This rule exists because it already
happened once: a 2026-09-14 session rebuilt Zone 3/4 decoration
selection, but the "Zone 3/4 decorations" section in ARCHITECTURE.md
kept describing the old behavior for two more sessions before someone
caught it by hand.

- **If this session's changes make an existing ARCHITECTURE.md claim
  factually false, fix that section directly** — same edit-in-place
  discipline as STATE.md, not a note to revisit later. A wrong claim
  sitting in a "stable" reference doc is a bug in the doc; fix it like
  one.
- **Only flag instead of fixing when it's genuinely ambiguous** which
  version is correct, or the fix requires a decision only the user can
  make — not merely because the write-up would take a few sentences.
- **Never add a "here's what happened this session" entry.**
  ARCHITECTURE.md only changes for (a) correcting something now false, or
  (b) recording a genuine, durable design decision made this session
  (e.g. a new subsystem's intended shape). Session narration belongs in
  STATE.md; if you're tempted to write "Fixed 2026-09-16: ..." in
  ARCHITECTURE.md, that sentence belongs in STATE.md instead, with at
  most a pointer left in ARCHITECTURE.md.
- **A large new design worth documenting is not wrapup's job to draft
  from scratch.** Wrapup corrects and records; it doesn't replace a real
  design conversation. If a session produced one, write it up as part of
  that conversation (or immediately after) rather than reconstructing it
  from `git diff` at wrapup time.

## Finally

Tell the user in one or two sentences what changed in STATE.md (and,
if applicable, what was corrected in ARCHITECTURE.md and why) and name
anything you moved into NOT VERIFIED that they should check themselves.
Do not commit unless asked.
