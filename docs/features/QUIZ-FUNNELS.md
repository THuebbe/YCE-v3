# Funnel landing pages with a quiz

Status: **IDEA (decided 2026-10-22)**. Not at launch.

Not the main marketing page (that leads with the live yard demo and
self-serve signup). Later, for visitors not ready to sign up.

- Examples: "Is a yard sign business right for you?", or a checkup that
  recommends Essentials or Elite.
- Build on a TypeScript port of PantryPro's `scoring.js`, with its fixes:
  - unanswered questions inflate the score;
  - lead fields hardcoded to q11-q14;
  - two insight systems;
  - unused minImpact/priority;
  - invented stats in the copy.
- Its own leads table with RLS on. Never reuse the shared `quiz_submissions` table.
