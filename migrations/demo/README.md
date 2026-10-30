# Demo-database-only migrations

These run ONLY against the demo project `yce-demo` (cllfpexbglmsgtnbsfkg),
never production (YCEv3). Order:

1. `../20261030_baseline_yce_schema.sql` - the schema (applied 2026-10-30)
2. `../20261007_seed_placeholder_sign_library.sql` - its sign_library part
   (the agency_inventory part matches no agency here). Applied 2026-10-30.
3. `20261030_demo_template_agency.sql` - Lucky Lawn Signs, the template every
   loaner is reset from (applied 2026-10-30)
4. `20261030_demo_loaners.sql` - demo_loaners / demo_invites / demo_leads and
   the five loaner agencies lucky-lawn-1..5 (applied 2026-10-30)

Every later YCE migration in `../` must be applied here too (DEMO.md).
