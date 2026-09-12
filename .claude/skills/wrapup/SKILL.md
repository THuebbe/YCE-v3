---
name: wrapup
description: Close out a work session by updating STATE.md with what actually changed. Use when the user says they're stopping, wrapping up, done for now, or invokes /wrapup. Also use when the user asks to update or refresh STATE.md.
---

# Session Wrapup

Update `STATE.md` in the repo root so the next session starts oriented
instead of doing archaeology. This project went dormant for 12 months
and cost a full day to re-enter. This file is the fix.

## Steps

1. Read `STATE.md`.
2. Run `git status --short` and `git diff --stat` to see what actually
   changed this session. Do not rely on conversation memory alone.
3. Rewrite ONLY the sections that changed. Preserve everything else
   verbatim — this is an edit, not a regeneration.
4. Update the `Last verified:` date at the top.

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
- **Note anything discovered that contradicts CLAUDE.md or
  ARCHITECTURE.md** and flag it for the user — those files are supposed
  to be stable, so a contradiction means one of them is now wrong.
- Keep it under ~150 lines. A file nobody rereads is worse than none.

## Finally

Tell the user in one or two sentences what changed in STATE.md and name
anything you moved into NOT VERIFIED that they should check themselves.
Do not commit unless asked.
