-- Migration: Rename PayPal integration columns on agencies to snake_case
-- Date: 2026-09-12
-- Purpose: The 20250109 PayPal migration added these columns in camelCase,
-- inconsistent with the sibling Braintree/Venmo migration from the same batch
-- (which correctly used snake_case) and with every app-code reference to
-- PayPal fields (src/features/payments/paypal-actions.ts,
-- src/app/api/webhooks/paypal/route.ts,
-- src/app/api/agency/[agencyId]/payment-methods/route.ts), all of which
-- consistently use snake_case and have done since they were written. This
-- mismatch is what throws `column agencies.paypal_account_id does not exist`
-- and 500s the booking wizard's payment step.
--
-- Renaming preserves data (there is none live yet -- PayPal onboarding was
-- never reachable) and requires no app-code changes, since all 11 renamed
-- columns match the full set of paypal_* names referenced across the four
-- files above, verified by grep before writing this migration.
--
-- agencies is YCE-only. It has no relationship to PantryPro's
-- businesses/restaurants hierarchy (only users.business_id bridges that),
-- so this migration has zero blast radius on PantryPro.

BEGIN;

ALTER TABLE agencies RENAME COLUMN "paypalAccountId" TO paypal_account_id;
ALTER TABLE agencies RENAME COLUMN "paypalAccountStatus" TO paypal_account_status;
ALTER TABLE agencies RENAME COLUMN "paypalOnboardingUrl" TO paypal_onboarding_url;
ALTER TABLE agencies RENAME COLUMN "paypalAuthCode" TO paypal_auth_code;
ALTER TABLE agencies RENAME COLUMN "paypalSharedId" TO paypal_shared_id;
ALTER TABLE agencies RENAME COLUMN "paypalPermissionsGranted" TO paypal_permissions_granted;
ALTER TABLE agencies RENAME COLUMN "paypalEmailConfirmed" TO paypal_email_confirmed;
ALTER TABLE agencies RENAME COLUMN "paypalPaymentsReceivable" TO paypal_payments_receivable;
ALTER TABLE agencies RENAME COLUMN "paypalDetailsSubmitted" TO paypal_details_submitted;
ALTER TABLE agencies RENAME COLUMN "paypalIntegrationData" TO paypal_integration_data;
ALTER TABLE agencies RENAME COLUMN "paypalLastSyncAt" TO paypal_last_sync_at;

COMMIT;
