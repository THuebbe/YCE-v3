-- Row level security on the last 26 public tables (APPLIED 2026-10-30 via the Supabase MCP,
-- as two migrations: rls_remaining_tables and vendor_invoice_summary_security_invoker).
--
-- These are PantryPro's tables (YCEv3 is still shared with it) plus the unprefixed
-- businesses / business_notes / activity_log. With RLS off, anyone holding the public
-- anon key could read and change them through the Supabase REST API, including
-- vendor_payment_info. The anon key isn't a secret by design, even though YCE never
-- ships it to browsers.
--
-- No policies are added: anon and authenticated get nothing. Both apps reach these
-- tables only from their servers with the service-role key, which bypasses RLS, so
-- neither changes behaviour (checked for PantryPro on 2026-10-22 with the users fix).
-- YCE production booking pages checked after applying.
--
-- vendor_invoice_summary was a SECURITY DEFINER view: it read vendor_invoices with its
-- owner's rights, so anon could read invoices through it despite RLS on the table.
-- security_invoker makes it read with the caller's rights instead.
--
-- Undo for one table: alter table public.<name> disable row level security;
-- Undo for the view:   alter view public.vendor_invoice_summary set (security_invoker = false);

alter table public.activity_log              enable row level security;
alter table public.business_notes            enable row level security;
alter table public.businesses                enable row level security;
alter table public.ingredient_library        enable row level security;
alter table public.ingredient_vendor_mapping enable row level security;
alter table public.menu_items                enable row level security;
alter table public.payment_terms             enable row level security;
alter table public.pos_transactions          enable row level security;
alter table public.purchase_order_items      enable row level security;
alter table public.purchase_orders           enable row level security;
alter table public.quiz_submissions          enable row level security;
alter table public.receiving_log             enable row level security;
alter table public.recipe_ingredients        enable row level security;
alter table public.restaurant_inventory      enable row level security;
alter table public.restaurant_order_items    enable row level security;
alter table public.restaurant_orders         enable row level security;
alter table public.restaurants               enable row level security;
alter table public.vendor_addresses          enable row level security;
alter table public.vendor_contacts           enable row level security;
alter table public.vendor_documents          enable row level security;
alter table public.vendor_payment_info       enable row level security;
alter table public.vendor_payment_info_audit enable row level security;
alter table public.vendor_purchasing_data    enable row level security;
alter table public.vendor_scorecards         enable row level security;
alter table public.vendors                   enable row level security;
alter table public.waste_log                 enable row level security;

alter view public.vendor_invoice_summary set (security_invoker = true);
