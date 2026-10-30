-- Baseline: YCE's whole schema in one file (generated 2026-10-30 from
-- production's catalog). Builds an EMPTY YCE database from nothing.
--
-- APPLIED 2026-10-30 to the demo project `yce-demo` (cllfpexbglmsgtnbsfkg).
-- NEVER run it against production (YCEv3): production already has all of
-- this, plus PantryPro's tables that this file deliberately leaves out.
--
-- What it is, and isn't:
--   - YCE only: 12 tables, the UserRole enum, 12 yce_* functions. No
--     PantryPro tables, and `users` without PantryPro's business_id.
--   - The clean shape: orders without its 22 Prisma-era camelCase columns
--     (see 20261030_orders_snake_case_columns.sql). Constraint and index
--     names match production's exactly (some are camelCase; nothing in the
--     app refers to them) so later migrations apply to both databases.
--   - Not included, because nothing uses them: tables bundles, transactions,
--     inventory_deductions; legacy functions (get_current_agency_id etc.).
--     sign_library.bundle_id stays as a plain column, without its FK.
--   - RLS on, no policies: the app uses the service role (CLAUDE.md rule 2).
--
-- Every later YCE migration must be applied to production AND yce-demo.

create type "UserRole" as enum ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER', 'SUPER_USER');

-- Tables -----------------------------------------------------------------

create table public.agencies (
  id text not null,
  name text not null,
  slug text not null,
  domain text,
  is_active boolean default true not null,
  created_at timestamp(3) without time zone default CURRENT_TIMESTAMP not null,
  updated_at timestamp(3) without time zone not null,
  description text,
  stripe_account_id text,
  stripe_account_status text,
  stripe_onboarding_url text,
  stripe_charges_enabled boolean default false not null,
  stripe_payouts_enabled boolean default false not null,
  stripe_details_submitted boolean default false not null,
  address jsonb,
  agency_code text,
  business_name text,
  city text,
  email text,
  order_counter integer default 0 not null,
  phone text,
  pricing_config jsonb default '{"lateFee": 25, "basePrice": 95, "extraDayPrice": 10}'::jsonb not null,
  settings jsonb default '{}'::jsonb not null,
  stripe_connect_status text default 'pending'::text not null,
  stripe_customer_id text,
  subdomain text,
  subscription_end_date timestamp(3) without time zone,
  subscription_start_date timestamp(3) without time zone,
  subscription_status text default 'none'::text not null,
  operating_hours jsonb default '{}'::jsonb,
  blackout_dates jsonb default '[]'::jsonb,
  booking_rules jsonb default '{"maximumRentalDays": 14, "minimumRentalDays": 1, "allowSameDayBooking": false, "minimumLeadTimeHours": 48}'::jsonb,
  braintree_environment character varying(20) default 'sandbox'::character varying,
  braintree_merchant_id character varying(255),
  braintree_public_key character varying(255),
  braintree_private_key text,
  braintree_account_status character varying(50) default 'not_connected'::character varying,
  venmo_enabled boolean default false,
  venmo_allow_desktop boolean default true,
  venmo_allow_web_login boolean default true,
  venmo_payment_method_usage character varying(20) default 'multi_use'::character varying,
  braintree_webhook_endpoint character varying(500),
  braintree_webhook_signature text,
  braintree_configuration jsonb default '{}'::jsonb,
  braintree_created_at timestamp without time zone,
  braintree_last_sync_at timestamp without time zone,
  braintree_integration_data jsonb default '{}'::jsonb,
  paypal_account_id text,
  paypal_account_status text,
  paypal_onboarding_url text,
  paypal_auth_code text,
  paypal_shared_id text,
  paypal_permissions_granted boolean default false not null,
  paypal_email_confirmed boolean default false not null,
  paypal_payments_receivable boolean default false not null,
  paypal_details_submitted boolean default false not null,
  paypal_integration_data jsonb default '{}'::jsonb,
  paypal_last_sync_at timestamp(3) without time zone,
  stripe_account_type text,
  plan text default 'essentials'::text not null,
  stripe_subscription_id text,
  subscription_price text,
  subscription_current_period_end timestamp with time zone,
  subscription_trial_end timestamp with time zone,
  subscription_cancel_at_period_end boolean default false not null,
  subscription_past_due_since timestamp with time zone,
  subscription_synced_at timestamp with time zone,
  policy_config jsonb default '{}'::jsonb not null,
  branding jsonb default '{}'::jsonb not null
);

create table public.users (
  id text not null,
  email text not null,
  first_name text,
  last_name text,
  avatar text,
  role "UserRole" default 'USER'::"UserRole" not null,
  created_at timestamp(3) without time zone default CURRENT_TIMESTAMP not null,
  updated_at timestamp(3) without time zone not null,
  email_verified timestamp(3) without time zone,
  hashed_password text,
  agency_id text,
  clerk_user_id text
);

create table public.sign_library (
  id text not null,
  name text not null,
  description text,
  category text not null,
  theme text,
  size_width integer,
  size_height integer,
  dimensions jsonb,
  themes text[],
  holidays text[],
  keywords text[],
  image_url text not null,
  thumbnail_url text,
  is_platform boolean default true not null,
  created_by text,
  bundle_id text,
  bundle_position integer,
  created_at timestamp(3) without time zone default CURRENT_TIMESTAMP not null,
  updated_at timestamp(3) without time zone not null,
  rental_price integer default 0 not null,
  asset_key text,
  sign_type text,
  "character" text,
  style text,
  colorway text
);

create table public.agency_inventory (
  id text not null,
  agency_id text not null,
  sign_id text not null,
  quantity integer default 0 not null,
  available_quantity integer default 0 not null,
  allocated_quantity integer default 0 not null,
  deployed_quantity integer default 0 not null,
  created_at timestamp(3) without time zone default CURRENT_TIMESTAMP not null,
  updated_at timestamp(3) without time zone not null
);

create table public.orders (
  id text default gen_random_uuid() not null,
  agency_id text not null,
  order_number text not null,
  display_number text,
  internal_number text,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  event_date timestamp(3) without time zone not null,
  event_address text,
  delivery_time text,
  delivery_notes text,
  message text,
  message_text text,
  theme text,
  layout_style text,
  preview_url text,
  status text default 'pending'::text not null,
  subtotal numeric(10,2) not null,
  extra_days integer default 0 not null,
  extra_day_fee numeric(10,2) default 0 not null,
  late_fee numeric(10,2) default 0 not null,
  total numeric(10,2) not null,
  payment_intent_id text,
  payment_status text default 'pending'::text not null,
  payment_method text,
  documents jsonb default '[]'::jsonb not null,
  created_at timestamp(3) without time zone default CURRENT_TIMESTAMP not null,
  updated_at timestamp(3) without time zone not null,
  deployed_at timestamp(3) without time zone,
  completed_at timestamp(3) without time zone,
  cancelled_at timestamp(3) without time zone,
  cancellation_reason text,
  created_by_id text,
  event_type text,
  refund_amount numeric(10,2),
  special_instructions text,
  stripe_payment_intent_id text,
  confirmation_code text,
  hobbies jsonb default '[]'::jsonb,
  terms_accepted_at timestamp with time zone,
  terms_snapshot jsonb,
  display_image_url text,
  cancel_token text,
  fee_charge jsonb,
  display_config jsonb,
  extra_days_before integer default 0 not null,
  extra_days_after integer default 0 not null,
  hold_id text
);

create table public.order_items (
  id text not null,
  order_id text not null,
  sign_id text not null,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null
);

create table public.order_signs (
  id text not null,
  order_id text not null,
  sign_id text not null,
  quantity integer not null
);

create table public.order_activities (
  id text not null,
  order_id text not null,
  metadata jsonb,
  created_at timestamp(3) without time zone default CURRENT_TIMESTAMP not null,
  action text not null,
  notes text,
  status text not null,
  user_id text not null
);

create table public.booking_checkouts (
  id text default (gen_random_uuid())::text not null,
  agency_id text not null,
  hold_id text not null,
  session_id text not null,
  stripe_account_id text not null,
  payment_intent_id text,
  amount_cents integer not null,
  application_fee_cents integer default 0 not null,
  status text default 'created'::text not null,
  order_id text,
  payload jsonb not null,
  error text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.inventory_holds (
  id text not null,
  agency_id text not null,
  order_id text,
  session_id text,
  expires_at timestamp(3) without time zone,
  created_at timestamp(3) without time zone default CURRENT_TIMESTAMP not null,
  is_active boolean default true not null,
  hold_type text default 'temporary'::text not null,
  rental_start date,
  rental_end date,
  released_at timestamp without time zone,
  release_reason text,
  client_key text
);

create table public.inventory_hold_items (
  id text not null,
  hold_id text not null,
  sign_id text not null,
  quantity integer not null,
  unit_price integer not null
);

create table public.sign_check_ins (
  id text not null,
  order_id text not null,
  sign_id text not null,
  condition text not null,
  notes text,
  damage_photos text[] default ARRAY[]::text[],
  checked_in_by_id text not null,
  created_at timestamp(3) without time zone default CURRENT_TIMESTAMP not null,
  quantity integer default 1 not null
);

-- Keys and checks --------------------------------------------------------

alter table public.agencies add constraint agencies_pkey primary key (id);
alter table public.agency_inventory add constraint agency_inventory_pkey primary key (id);
alter table public.booking_checkouts add constraint booking_checkouts_pkey primary key (id);
alter table public.inventory_hold_items add constraint inventory_hold_items_pkey primary key (id);
alter table public.inventory_holds add constraint inventory_holds_pkey primary key (id);
alter table public.order_activities add constraint order_activities_pkey primary key (id);
alter table public.order_items add constraint order_items_pkey primary key (id);
alter table public.order_signs add constraint order_signs_pkey primary key (id);
alter table public.orders add constraint orders_pkey primary key (id);
alter table public.sign_check_ins add constraint sign_check_ins_pkey primary key (id);
alter table public.sign_library add constraint sign_library_pkey primary key (id);
alter table public.users add constraint users_pkey primary key (id);

alter table public.booking_checkouts add constraint booking_checkouts_payment_intent_id_key unique (payment_intent_id);
alter table public.users add constraint "users_email_agencyId_key" unique (email, agency_id);

alter table public.agencies add constraint agencies_braintree_account_status_check check (((braintree_account_status)::text = ANY ((ARRAY['not_connected'::character varying, 'pending'::character varying, 'active'::character varying, 'suspended'::character varying, 'needs_attention'::character varying])::text[])));
alter table public.agencies add constraint agencies_braintree_environment_check check (((braintree_environment)::text = ANY ((ARRAY['sandbox'::character varying, 'production'::character varying])::text[])));
alter table public.agencies add constraint agencies_plan_check check ((plan = ANY (ARRAY['essentials'::text, 'elite'::text])));
alter table public.agencies add constraint agencies_stripe_account_type_check check ((stripe_account_type = ANY (ARRAY['express'::text, 'standard'::text])));
alter table public.agencies add constraint agencies_venmo_payment_method_usage_check check (((venmo_payment_method_usage)::text = ANY ((ARRAY['single_use'::character varying, 'multi_use'::character varying])::text[])));
alter table public.booking_checkouts add constraint booking_checkouts_amount_cents_check check ((amount_cents > 0));
alter table public.booking_checkouts add constraint booking_checkouts_application_fee_cents_check check ((application_fee_cents >= 0));
alter table public.booking_checkouts add constraint booking_checkouts_status_check check ((status = ANY (ARRAY['created'::text, 'charged'::text, 'finalizing'::text, 'completed'::text, 'refunded'::text, 'failed'::text])));
alter table public.inventory_holds add constraint inventory_holds_hold_type_check check ((hold_type = ANY (ARRAY['temporary'::text, 'order'::text])));
alter table public.orders add constraint orders_extra_days_before_check check (extra_days_before >= 0 and extra_days_before <= 7);
alter table public.orders add constraint orders_extra_days_after_check check (extra_days_after >= 0 and extra_days_after <= 7);

-- Foreign keys -----------------------------------------------------------

alter table public.agency_inventory add constraint "agency_inventory_agencyId_fkey" foreign key (agency_id) references public.agencies(id) on update cascade on delete restrict;
alter table public.agency_inventory add constraint "agency_inventory_signId_fkey" foreign key (sign_id) references public.sign_library(id) on update cascade on delete restrict;
alter table public.booking_checkouts add constraint booking_checkouts_agency_id_fkey foreign key (agency_id) references public.agencies(id);
alter table public.booking_checkouts add constraint booking_checkouts_order_id_fkey foreign key (order_id) references public.orders(id);
alter table public.inventory_hold_items add constraint "inventory_hold_items_holdId_fkey" foreign key (hold_id) references public.inventory_holds(id) on update cascade on delete cascade;
alter table public.inventory_hold_items add constraint "inventory_hold_items_signId_fkey" foreign key (sign_id) references public.sign_library(id) on update cascade on delete restrict;
alter table public.order_activities add constraint "order_activities_orderId_fkey" foreign key (order_id) references public.orders(id) on update cascade on delete cascade;
alter table public.order_activities add constraint "order_activities_userId_fkey" foreign key (user_id) references public.users(id) on update cascade on delete restrict;
alter table public.order_items add constraint "order_items_orderId_fkey" foreign key (order_id) references public.orders(id) on update cascade on delete cascade;
alter table public.order_items add constraint "order_items_signId_fkey" foreign key (sign_id) references public.sign_library(id) on update cascade on delete restrict;
alter table public.order_signs add constraint "order_signs_orderId_fkey" foreign key (order_id) references public.orders(id) on update cascade on delete cascade;
alter table public.order_signs add constraint "order_signs_signId_fkey" foreign key (sign_id) references public.sign_library(id) on update cascade on delete restrict;
alter table public.orders add constraint "orders_agencyId_fkey" foreign key (agency_id) references public.agencies(id) on update cascade on delete restrict;
alter table public.orders add constraint "orders_createdById_fkey" foreign key (created_by_id) references public.users(id) on update cascade on delete set null;
alter table public.sign_check_ins add constraint "sign_check_ins_checkedInById_fkey" foreign key (checked_in_by_id) references public.users(id) on update cascade on delete restrict;
alter table public.sign_check_ins add constraint "sign_check_ins_orderId_fkey" foreign key (order_id) references public.orders(id) on update cascade on delete cascade;
alter table public.sign_check_ins add constraint "sign_check_ins_signId_fkey" foreign key (sign_id) references public.sign_library(id) on update cascade on delete restrict;
alter table public.users add constraint "users_agencyId_fkey" foreign key (agency_id) references public.agencies(id) on update cascade on delete cascade;

-- Indexes ----------------------------------------------------------------

create unique index "agencies_agencyCode_key" on public.agencies using btree (agency_code);
create unique index agencies_domain_key on public.agencies using btree (domain);
create index agencies_paypal_account_id_idx on public.agencies using btree (paypal_account_id);
create index agencies_paypal_last_sync_idx on public.agencies using btree (paypal_last_sync_at);
create index agencies_paypal_permissions_idx on public.agencies using btree (paypal_permissions_granted);
create index agencies_paypal_receivable_idx on public.agencies using btree (paypal_payments_receivable);
create unique index agencies_slug_key on public.agencies using btree (slug);
create unique index "agencies_stripeAccountId_key" on public.agencies using btree (stripe_account_id);
create unique index agencies_stripe_customer_id_key on public.agencies using btree (stripe_customer_id) where (stripe_customer_id is not null);
create unique index agencies_stripe_subscription_id_key on public.agencies using btree (stripe_subscription_id) where (stripe_subscription_id is not null);
create unique index agencies_subdomain_key on public.agencies using btree (subdomain);
create index idx_agencies_braintree_account_status on public.agencies using btree (braintree_account_status);
create index idx_agencies_braintree_merchant_id on public.agencies using btree (braintree_merchant_id) where (braintree_merchant_id is not null);
create index idx_agencies_braintree_sync on public.agencies using btree (braintree_last_sync_at) where (braintree_merchant_id is not null);
create index idx_agencies_venmo_enabled on public.agencies using btree (venmo_enabled) where (venmo_enabled = true);
create index "agency_inventory_agencyId_idx" on public.agency_inventory using btree (agency_id);
create unique index "agency_inventory_agencyId_signId_key" on public.agency_inventory using btree (agency_id, sign_id);
create index booking_checkouts_agency_idx on public.booking_checkouts using btree (agency_id, created_at desc);
create index "inventory_hold_items_holdId_idx" on public.inventory_hold_items using btree (hold_id);
create index "inventory_hold_items_signId_idx" on public.inventory_hold_items using btree (sign_id);
create index "inventory_holds_agencyId_expiresAt_idx" on public.inventory_holds using btree (agency_id, expires_at);
create index inventory_holds_agency_active_idx on public.inventory_holds using btree (agency_id, is_active, hold_type);
create index inventory_holds_client_key_idx on public.inventory_holds using btree (client_key, created_at) where (client_key is not null);
create index "inventory_holds_orderId_idx" on public.inventory_holds using btree (order_id);
create index "inventory_holds_sessionId_idx" on public.inventory_holds using btree (session_id);
create index "order_activities_orderId_idx" on public.order_activities using btree (order_id);
create index "order_items_orderId_idx" on public.order_items using btree (order_id);
create index "order_items_signId_idx" on public.order_items using btree (sign_id);
create index "order_signs_orderId_idx" on public.order_signs using btree (order_id);
create index "order_signs_signId_idx" on public.order_signs using btree (sign_id);
create index "orders_agencyId_eventDate_idx" on public.orders using btree (agency_id, event_date);
create unique index "orders_agencyId_orderNumber_key" on public.orders using btree (agency_id, order_number);
create index "orders_agencyId_status_idx" on public.orders using btree (agency_id, status);
create index orders_confirmation_code_idx on public.orders using btree (confirmation_code);
create index orders_created_at_idx on public.orders using btree (created_at);
create index "orders_customerEmail_idx" on public.orders using btree (customer_email);
-- Production names these orders_hold_id_snake_idx / orders_payment_intent_id_snake_idx
-- until its drop file renames them to these
create index orders_hold_id_idx on public.orders using btree (hold_id);
create index orders_payment_intent_id_idx on public.orders using btree (payment_intent_id);
create unique index "orders_internalNumber_key" on public.orders using btree (internal_number);
create index "sign_check_ins_orderId_idx" on public.sign_check_ins using btree (order_id);
create index "sign_check_ins_signId_idx" on public.sign_check_ins using btree (sign_id);
create unique index sign_library_asset_key_key on public.sign_library using btree (asset_key);
create index "sign_library_bundleId_idx" on public.sign_library using btree (bundle_id);
create index sign_library_category_idx on public.sign_library using btree (category);
create index "sign_library_isPlatform_createdBy_idx" on public.sign_library using btree (is_platform, created_by);
create index sign_library_themes_idx on public.sign_library using btree (themes);
create unique index "users_clerkUserId_key" on public.users using btree (clerk_user_id);
create unique index users_email_key on public.users using btree (email);

-- Functions (verbatim from production) -----------------------------------

CREATE OR REPLACE FUNCTION public.yce_sign_availability(p_agency_id text, p_start date, p_end date, p_exclude_hold_id text DEFAULT NULL::text)
 RETURNS TABLE(sign_id text, owned integer, blocked integer, available integer)
 LANGUAGE sql
 STABLE
AS $function$
  WITH blocking AS (
    SELECT hi.sign_id, SUM(hi.quantity)::integer AS qty
    FROM inventory_holds h
    JOIN inventory_hold_items hi ON hi.hold_id = h.id
    WHERE h.agency_id = p_agency_id
      AND h.is_active
      AND (p_exclude_hold_id IS NULL OR h.id <> p_exclude_hold_id)
      AND (
        (h.hold_type = 'temporary'
          AND h.expires_at > now()::timestamp
          AND h.rental_start <= p_end
          AND h.rental_end >= p_start)
        OR
        (h.hold_type = 'order' AND h.rental_start <= p_end)
      )
    GROUP BY hi.sign_id
  )
  SELECT ai.sign_id,
         ai.quantity,
         COALESCE(b.qty, 0),
         GREATEST(ai.quantity - COALESCE(b.qty, 0), 0)
  FROM agency_inventory ai
  LEFT JOIN blocking b ON b.sign_id = ai.sign_id
  WHERE ai.agency_id = p_agency_id;
$function$;

CREATE OR REPLACE FUNCTION public.yce_hold_shortages(p_agency_id text, p_start date, p_end date, p_items jsonb, p_exclude_hold_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  WITH req AS (
    SELECT r.sign_id, SUM(r.quantity)::integer AS requested
    FROM jsonb_to_recordset(p_items) AS r(sign_id text, quantity integer)
    GROUP BY r.sign_id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'sign_id', req.sign_id,
           'requested', req.requested,
           'available', COALESCE(av.available, 0))), '[]'::jsonb)
  FROM req
  LEFT JOIN yce_sign_availability(p_agency_id, p_start, p_end, p_exclude_hold_id) av
    ON av.sign_id = req.sign_id
  WHERE req.requested > COALESCE(av.available, 0);
$function$;

CREATE OR REPLACE FUNCTION public.yce_order_sign_lines(p_order_id text)
 RETURNS TABLE(sign_id text, quantity integer)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT os.sign_id, SUM(os.quantity)::integer FROM order_signs os
  WHERE os.order_id = p_order_id GROUP BY os.sign_id
  UNION ALL
  SELECT oi.sign_id, SUM(oi.quantity)::integer FROM order_items oi
  WHERE oi.order_id = p_order_id
    AND NOT EXISTS (SELECT 1 FROM order_signs x WHERE x.order_id = p_order_id)
  GROUP BY oi.sign_id;
$function$;

CREATE OR REPLACE FUNCTION public.yce_availability_snapshot(p_agency_id text, p_from date, p_to date, p_session_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  SELECT jsonb_build_object(
    'signs', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id, 'key', s.asset_key, 'type', s.sign_type,
        'character', s."character", 'style', s.style, 'colorway', s.colorway,
        'quantity', ai.quantity))
      FROM agency_inventory ai
      JOIN sign_library s ON s.id = ai.sign_id
      WHERE ai.agency_id = p_agency_id AND ai.quantity > 0 AND s.asset_key IS NOT NULL
    ), '[]'::jsonb),
    'holds', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'kind', h.hold_type,
        'start', h.rental_start, 'end', h.rental_end,
        'mine', p_session_id IS NOT NULL AND h.session_id = p_session_id,
        'items', (SELECT COALESCE(jsonb_agg(jsonb_build_object('signId', hi.sign_id, 'quantity', hi.quantity)), '[]'::jsonb)
                  FROM inventory_hold_items hi WHERE hi.hold_id = h.id)))
      FROM inventory_holds h
      WHERE h.agency_id = p_agency_id
        AND h.is_active
        AND (
          (h.hold_type = 'temporary' AND h.expires_at > now()::timestamp
            AND h.rental_start <= p_to AND h.rental_end >= p_from)
          OR (h.hold_type = 'order' AND h.rental_start <= p_to)
        )
    ), '[]'::jsonb)
  );
$function$;

CREATE OR REPLACE FUNCTION public.yce_cancel_order(p_order_id text, p_agency_id text, p_user_id text, p_reason text DEFAULT NULL::text, p_refund_type text DEFAULT 'none'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_status text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('yce_inventory:' || p_agency_id, 0));

  SELECT status INTO v_status FROM orders
  WHERE id = p_order_id AND agency_id = p_agency_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'order_not_found');
  END IF;
  IF v_status NOT IN ('pending', 'processing') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_cancellable', 'status', v_status);
  END IF;

  UPDATE inventory_holds
  SET is_active = false, released_at = now()::timestamp, release_reason = 'cancelled'
  WHERE order_id = p_order_id AND hold_type = 'order' AND is_active;

  UPDATE orders
  SET status = 'cancelled', cancelled_at = now()::timestamp,
      cancellation_reason = NULLIF(p_reason, ''), updated_at = now()::timestamp
  WHERE id = p_order_id;

  INSERT INTO order_activities (id, order_id, action, status, user_id, notes, metadata, created_at)
  VALUES (gen_random_uuid()::text, p_order_id, 'cancel', 'cancelled', p_user_id,
          NULLIF(p_reason, ''), jsonb_build_object('refund_requested', p_refund_type,
            'refund_processed', false), now()::timestamp);

  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.yce_check_in_order(p_order_id text, p_agency_id text, p_user_id text, p_lines jsonb, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_status text;
  v_mismatch jsonb;
  v_lost integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('yce_inventory:' || p_agency_id, 0));

  SELECT status INTO v_status FROM orders
  WHERE id = p_order_id AND agency_id = p_agency_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'order_not_found');
  END IF;
  IF v_status <> 'deployed' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_deployed', 'status', v_status);
  END IF;

  WITH want AS (SELECT * FROM yce_order_sign_lines(p_order_id)),
  got AS (
    SELECT l.sign_id, SUM(COALESCE(l.good,0) + COALESCE(l.damaged,0) + COALESCE(l.missing,0))::integer AS n
    FROM jsonb_to_recordset(p_lines) AS l(sign_id text, good integer, damaged integer, missing integer)
    GROUP BY l.sign_id
  )
  SELECT jsonb_agg(jsonb_build_object('sign_id', COALESCE(w.sign_id, g.sign_id),
                                      'expected', COALESCE(w.quantity, 0), 'counted', COALESCE(g.n, 0)))
  INTO v_mismatch
  FROM want w FULL JOIN got g ON g.sign_id = w.sign_id
  WHERE COALESCE(w.quantity, 0) <> COALESCE(g.n, 0);
  IF v_mismatch IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'count_mismatch', 'lines', v_mismatch);
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_to_recordset(p_lines) AS l(good integer, damaged integer, missing integer)
             WHERE LEAST(COALESCE(l.good,0), COALESCE(l.damaged,0), COALESCE(l.missing,0)) < 0) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_request');
  END IF;

  INSERT INTO sign_check_ins (id, order_id, sign_id, condition, quantity, notes, checked_in_by_id, created_at)
  SELECT gen_random_uuid()::text, p_order_id, l.sign_id, c.condition, c.n, NULLIF(l.notes, ''), p_user_id, now()::timestamp
  FROM jsonb_to_recordset(p_lines) AS l(sign_id text, good integer, damaged integer, missing integer, notes text)
  CROSS JOIN LATERAL (VALUES ('good', COALESCE(l.good,0)), ('damaged', COALESCE(l.damaged,0)),
                             ('missing', COALESCE(l.missing,0))) AS c(condition, n)
  WHERE c.n > 0;

  UPDATE agency_inventory ai
  SET quantity = GREATEST(ai.quantity - x.lost, 0),
      available_quantity = GREATEST(ai.available_quantity - x.lost, 0),
      updated_at = now()::timestamp
  FROM (SELECT l.sign_id, SUM(COALESCE(l.damaged,0) + COALESCE(l.missing,0))::integer AS lost
        FROM jsonb_to_recordset(p_lines) AS l(sign_id text, damaged integer, missing integer)
        GROUP BY l.sign_id) x
  WHERE ai.agency_id = p_agency_id AND ai.sign_id = x.sign_id AND x.lost > 0;

  SELECT COALESCE(SUM(COALESCE(l.damaged,0) + COALESCE(l.missing,0)), 0) INTO v_lost
  FROM jsonb_to_recordset(p_lines) AS l(damaged integer, missing integer);

  UPDATE inventory_holds
  SET is_active = false, released_at = now()::timestamp, release_reason = 'checked_in'
  WHERE order_id = p_order_id AND hold_type = 'order' AND is_active;

  UPDATE orders SET status = 'completed', completed_at = now()::timestamp, updated_at = now()::timestamp
  WHERE id = p_order_id;

  INSERT INTO order_activities (id, order_id, action, status, user_id, notes, metadata, created_at)
  VALUES (gen_random_uuid()::text, p_order_id, 'checkInSigns', 'completed', p_user_id,
          NULLIF(p_notes, ''), jsonb_build_object('lines', p_lines, 'removed_from_stock', v_lost),
          now()::timestamp);

  RETURN jsonb_build_object('ok', true, 'removed_from_stock', v_lost);
END;
$function$;

CREATE OR REPLACE FUNCTION public.yce_convert_hold_to_order(p_hold_id text, p_agency_id text, p_session_id text, p_order_id text, p_rental_start date, p_rental_end date)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_hold inventory_holds%ROWTYPE;
  v_items jsonb;
  v_shortages jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('yce_inventory:' || p_agency_id, 0));

  SELECT * INTO v_hold FROM inventory_holds
  WHERE id = p_hold_id AND agency_id = p_agency_id AND session_id = p_session_id
    AND hold_type = 'temporary'
    AND (is_active OR release_reason = 'expired')
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'hold_not_found');
  END IF;

  IF v_hold.rental_start <> p_rental_start OR v_hold.rental_end <> p_rental_end THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'dates_changed');
  END IF;

  IF NOT v_hold.is_active OR v_hold.expires_at <= now()::timestamp THEN
    SELECT jsonb_agg(jsonb_build_object('sign_id', sign_id, 'quantity', quantity))
    INTO v_items FROM inventory_hold_items WHERE hold_id = p_hold_id;
    v_shortages := yce_hold_shortages(p_agency_id, p_rental_start, p_rental_end,
                                      COALESCE(v_items, '[]'::jsonb), p_hold_id);
    IF jsonb_array_length(v_shortages) > 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_stock', 'shortages', v_shortages);
    END IF;
  END IF;

  UPDATE inventory_holds
  SET hold_type = 'order', order_id = p_order_id, expires_at = NULL,
      is_active = true, released_at = NULL, release_reason = NULL
  WHERE id = p_hold_id;

  INSERT INTO order_signs (id, order_id, sign_id, quantity)
  SELECT gen_random_uuid()::text, p_order_id, sign_id, quantity
  FROM inventory_hold_items WHERE hold_id = p_hold_id;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.yce_create_booking_hold(p_agency_id text, p_session_id text, p_rental_start date, p_rental_end date, p_items jsonb, p_replace_hold_id text DEFAULT NULL::text, p_client_key text DEFAULT NULL::text, p_ttl_minutes integer DEFAULT 60)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_shortages jsonb;
  v_hold_id text := gen_random_uuid()::text;
  v_expires timestamp := (now() + make_interval(mins => p_ttl_minutes))::timestamp;
BEGIN
  IF p_session_id IS NULL OR p_rental_start IS NULL OR p_rental_end IS NULL
     OR p_rental_end < p_rental_start
     OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_request');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('yce_inventory:' || p_agency_id, 0));

  -- This session's own live holds are being replaced, so they don't count.
  IF p_client_key IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM inventory_holds
        WHERE client_key = p_client_key
          AND created_at > (now() - interval '10 minutes')::timestamp) >= 30
    OR (SELECT COUNT(*) FROM inventory_holds
        WHERE client_key = p_client_key AND agency_id = p_agency_id
          AND hold_type = 'temporary' AND is_active
          AND expires_at > now()::timestamp
          AND session_id IS DISTINCT FROM p_session_id) >= 3 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited');
    END IF;
  END IF;

  BEGIN
    UPDATE inventory_holds
    SET is_active = false, released_at = now()::timestamp, release_reason = 'replaced'
    WHERE agency_id = p_agency_id AND session_id = p_session_id
      AND hold_type = 'temporary' AND is_active;

    v_shortages := yce_hold_shortages(p_agency_id, p_rental_start, p_rental_end, p_items);
    IF jsonb_array_length(v_shortages) > 0 THEN
      RAISE EXCEPTION 'yce_insufficient_stock' USING ERRCODE = 'P0001';
    END IF;
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    -- Rolls back the release above; v_shortages keeps its value.
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_stock', 'shortages', v_shortages);
  END;

  INSERT INTO inventory_holds (id, agency_id, session_id, hold_type, rental_start,
                               rental_end, expires_at, is_active, client_key)
  VALUES (v_hold_id, p_agency_id, p_session_id, 'temporary', p_rental_start,
          p_rental_end, v_expires, true, p_client_key);

  INSERT INTO inventory_hold_items (id, hold_id, sign_id, quantity, unit_price)
  SELECT gen_random_uuid()::text, v_hold_id, r.sign_id, SUM(r.quantity)::integer, 0
  FROM jsonb_to_recordset(p_items) AS r(sign_id text, quantity integer)
  GROUP BY r.sign_id;

  RETURN jsonb_build_object('ok', true, 'hold_id', v_hold_id, 'expires_at', v_expires);
END;
$function$;

CREATE OR REPLACE FUNCTION public.yce_expire_temporary_holds()
 RETURNS integer
 LANGUAGE sql
AS $function$
  WITH expired AS (
    UPDATE inventory_holds
    SET is_active = false, released_at = now()::timestamp, release_reason = 'expired'
    WHERE hold_type = 'temporary' AND is_active AND expires_at <= now()::timestamp
    RETURNING 1
  )
  SELECT COUNT(*)::integer FROM expired;
$function$;

CREATE OR REPLACE FUNCTION public.yce_owned_styles(p_agency_id text)
 RETURNS TABLE(style text, colorway text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT DISTINCT s.style, s.colorway
  FROM agency_inventory ai
  JOIN sign_library s ON s.id = ai.sign_id
  WHERE ai.agency_id = p_agency_id AND ai.quantity > 0
    AND s.style IS NOT NULL AND s.colorway IS NOT NULL
  ORDER BY 1, 2;
$function$;

CREATE OR REPLACE FUNCTION public.yce_release_order_hold(p_order_id text, p_reason text DEFAULT 'released_manually'::text)
 RETURNS integer
 LANGUAGE sql
AS $function$
  WITH released AS (
    UPDATE inventory_holds
    SET is_active = false, released_at = now()::timestamp, release_reason = p_reason
    WHERE order_id = p_order_id AND hold_type = 'order' AND is_active
    RETURNING 1
  )
  SELECT COUNT(*)::integer FROM released;
$function$;

CREATE OR REPLACE FUNCTION public.yce_replace_order_signs(p_order_id text, p_agency_id text, p_user_id text, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
declare
  v_status text;
  v_hold inventory_holds%rowtype;
  v_shortages jsonb;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_request');
  end if;
  perform pg_advisory_xact_lock(hashtextextended('yce_inventory:' || p_agency_id, 0));

  select status into v_status from orders where id = p_order_id and agency_id = p_agency_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'order_not_found'); end if;
  if v_status not in ('pending', 'processing') then
    return jsonb_build_object('ok', false, 'reason', 'not_editable', 'status', v_status);
  end if;

  select * into v_hold from inventory_holds
  where order_id = p_order_id and agency_id = p_agency_id and hold_type = 'order' and is_active
  for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'hold_not_found'); end if;

  v_shortages := yce_hold_shortages(p_agency_id, v_hold.rental_start, v_hold.rental_end, p_items, v_hold.id);
  if jsonb_array_length(v_shortages) > 0 then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_stock', 'shortages', v_shortages);
  end if;

  delete from inventory_hold_items where hold_id = v_hold.id;
  insert into inventory_hold_items (id, hold_id, sign_id, quantity, unit_price)
  select gen_random_uuid()::text, v_hold.id, r.sign_id, sum(r.quantity)::integer, 0
  from jsonb_to_recordset(p_items) as r(sign_id text, quantity integer)
  group by r.sign_id;

  delete from order_signs where order_id = p_order_id;
  insert into order_signs (id, order_id, sign_id, quantity)
  select gen_random_uuid()::text, p_order_id, sign_id, quantity
  from inventory_hold_items where hold_id = v_hold.id;

  insert into order_activities (id, order_id, action, status, user_id, notes, metadata, created_at)
  values (gen_random_uuid()::text, p_order_id, 'editSigns', v_status, p_user_id, 'Display edited', '{}'::jsonb, now()::timestamp);

  return jsonb_build_object('ok', true);
end;
$function$;

CREATE OR REPLACE FUNCTION public.yce_touch_booking_hold(p_hold_id text, p_agency_id text, p_session_id text, p_ttl_minutes integer DEFAULT 60)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_expires timestamp := (now() + make_interval(mins => p_ttl_minutes))::timestamp;
BEGIN
  UPDATE inventory_holds SET expires_at = v_expires
  WHERE id = p_hold_id AND agency_id = p_agency_id AND session_id = p_session_id
    AND hold_type = 'temporary' AND is_active AND expires_at > now()::timestamp;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'hold_expired_or_missing');
  END IF;
  RETURN jsonb_build_object('ok', true, 'expires_at', v_expires);
END;
$function$;

-- Row level security: on, no policies (only the service role reads) ------

alter table public.agencies enable row level security;
alter table public.users enable row level security;
alter table public.sign_library enable row level security;
alter table public.agency_inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_signs enable row level security;
alter table public.order_activities enable row level security;
alter table public.booking_checkouts enable row level security;
alter table public.inventory_holds enable row level security;
alter table public.inventory_hold_items enable row level security;
alter table public.sign_check_ins enable row level security;
