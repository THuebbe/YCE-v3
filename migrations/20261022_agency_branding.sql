-- Agency white label (DESIGN.md "White label", decided 2026-10-22):
-- the booking page wears the agency's brand color, optional accent color
-- and logo. Read by src/features/agency/branding.ts (parseBranding), which
-- validates every field, so bad values fall back to the YardCard Elite
-- defaults instead of breaking a booking page.
--
--   { "brandColor": "#6B2D8C", "accentColor": "#FFB703", "logoUrl": "https://..." }
--
-- Its own column, not agencies.settings: the legacy /api/agency/settings
-- PUT replaces that whole JSON blob on every save.
-- Additive only. Empty object = no branding (Golden Hour defaults).

alter table public.agencies
  add column if not exists branding jsonb not null default '{}'::jsonb;

comment on column public.agencies.branding is
  'White label for the booking page: brandColor, accentColor (#RRGGBB), logoUrl (https). See src/features/agency/branding.ts';
