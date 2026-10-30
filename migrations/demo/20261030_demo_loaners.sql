-- DEMO DATABASE ONLY (yce-demo). Loaner pool, invites and leads (DEMO.md
-- "Loaners, not copies"). APPLIED 2026-10-30. Idempotent.
--
-- Five loaner agencies, copies of the template (Lucky Lawn Signs) with their
-- own ids and slugs. The app fills in each loaner's Clerk user, Stripe
-- sandbox account and subscription when it is first prepared, and resets
-- the loaner from the template each time it is lent.

create table if not exists public.demo_loaners (
  id integer primary key check (id between 1 and 99),
  agency_id text not null unique references public.agencies(id),
  clerk_user_id text unique,                 -- replaced on every reset
  status text not null default 'free' check (status in ('free', 'lent')),
  invite_id text,                            -- the invite it is lent on
  lent_email text,
  lent_at timestamptz,
  expires_at timestamptz,
  reset_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.demo_invites (
  id text primary key default gen_random_uuid()::text,
  token_hash text not null unique,           -- sha256 of the link token; the token itself is never stored
  email text,                                -- optional, pre-fills the form
  note text,                                 -- who it's for, the owner's own words
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  code_hash text,                            -- sha256 of the emailed access code
  code_email text,                           -- where the code went; the prospect
  code_sent_at timestamptz,
  code_attempts integer not null default 0,
  used_at timestamptz,                       -- first sign-in with the code: the demo starts
  loaner_id integer references public.demo_loaners(id)
);

create table if not exists public.demo_leads (
  email text primary key,
  consent_text text not null,
  first_demo_at timestamptz not null default now(),
  last_demo_at timestamptz not null default now(),
  demo_count integer not null default 1
);

alter table public.demo_loaners enable row level security;
alter table public.demo_invites enable row level security;
alter table public.demo_leads enable row level security;

-- The five loaner agencies: the template's settings under new ids and slugs
insert into public.agencies (
  id, name, slug, is_active, updated_at, plan, email, phone, city, address, description,
  pricing_config, booking_rules, operating_hours, policy_config, settings, branding, blackout_dates
)
select 'demo_loaner_' || n, t.name, 'lucky-lawn-' || n, true, now()::timestamp, t.plan, t.email, t.phone,
       t.city, t.address, t.description, t.pricing_config, t.booking_rules, t.operating_hours,
       t.policy_config, t.settings, t.branding, t.blackout_dates
from public.agencies t, generate_series(1, 5) as n
where t.id = 'demo_template_lucky_lawn'
on conflict (id) do nothing;

insert into public.agency_inventory (id, agency_id, sign_id, quantity, available_quantity,
  allocated_quantity, deployed_quantity, updated_at)
select 'inv_' || md5('demo_loaner_' || n || ':' || i.sign_id), 'demo_loaner_' || n, i.sign_id,
       i.quantity, i.quantity, 0, 0, now()::timestamp
from public.agency_inventory i, generate_series(1, 5) as n
where i.agency_id = 'demo_template_lucky_lawn'
on conflict (agency_id, sign_id) do nothing;

insert into public.demo_loaners (id, agency_id)
select n, 'demo_loaner_' || n from generate_series(1, 5) as n
on conflict (id) do nothing;
