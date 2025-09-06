-- Migration: Add PayPal Partner Referrals integration fields to agencies table
-- Date: 2025-01-09
-- Purpose: Enable PayPal integration alongside existing Stripe Connect functionality

-- Add PayPal Partner Referrals API fields
DO $$
BEGIN
    -- Core PayPal account identification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'paypalAccountId') THEN
        ALTER TABLE "agencies" ADD COLUMN "paypalAccountId" TEXT;
        CREATE INDEX IF NOT EXISTS "agencies_paypal_account_id_idx" ON "agencies"("paypalAccountId");
    END IF;
    
    -- PayPal onboarding status (different from Stripe's single status field)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'paypalAccountStatus') THEN
        ALTER TABLE "agencies" ADD COLUMN "paypalAccountStatus" TEXT;
    END IF;
    
    -- PayPal Partner Referrals onboarding URL (equivalent to Stripe's account link)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'paypalOnboardingUrl') THEN
        ALTER TABLE "agencies" ADD COLUMN "paypalOnboardingUrl" TEXT;
    END IF;
    
    -- PayPal OAuth flow tokens (specific to Partner Referrals API)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'paypalAuthCode') THEN
        ALTER TABLE "agencies" ADD COLUMN "paypalAuthCode" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'paypalSharedId') THEN
        ALTER TABLE "agencies" ADD COLUMN "paypalSharedId" TEXT;
    END IF;
END $$;

-- Add PayPal capability status fields (PayPal uses multiple boolean flags instead of single status)
DO $$
BEGIN
    -- Permissions granted by seller to platform
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'paypalPermissionsGranted') THEN
        ALTER TABLE "agencies" ADD COLUMN "paypalPermissionsGranted" BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    
    -- Email confirmation status (required for PayPal account verification)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'paypalEmailConfirmed') THEN
        ALTER TABLE "agencies" ADD COLUMN "paypalEmailConfirmed" BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    
    -- Ability to receive payments (similar to Stripe's chargesEnabled)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'paypalPaymentsReceivable') THEN
        ALTER TABLE "agencies" ADD COLUMN "paypalPaymentsReceivable" BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    
    -- Track if seller completed full onboarding flow
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'paypalDetailsSubmitted') THEN
        ALTER TABLE "agencies" ADD COLUMN "paypalDetailsSubmitted" BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Add PayPal integration metadata
DO $$
BEGIN
    -- Store additional PayPal-specific data (permissions, capabilities, etc.)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'paypalIntegrationData') THEN
        ALTER TABLE "agencies" ADD COLUMN "paypalIntegrationData" JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Track when PayPal account was last synced (for status polling fallback)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'paypalLastSyncAt') THEN
        ALTER TABLE "agencies" ADD COLUMN "paypalLastSyncAt" TIMESTAMP(3);
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "agencies_paypal_permissions_idx" ON "agencies"("paypalPermissionsGranted");
CREATE INDEX IF NOT EXISTS "agencies_paypal_receivable_idx" ON "agencies"("paypalPaymentsReceivable");
CREATE INDEX IF NOT EXISTS "agencies_paypal_last_sync_idx" ON "agencies"("paypalLastSyncAt");

-- Update RLS policies if they exist (maintain agency isolation)
DO $$
BEGIN
    -- Only update RLS if policies exist for agencies table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agencies') THEN
        -- PayPal fields should follow same isolation rules as Stripe fields
        -- The existing agency RLS policies will automatically cover these new columns
        -- No additional policies needed since they're just new columns on existing table
        NULL; -- Placeholder for potential future PayPal-specific policies
    END IF;
END $$;

-- Add helpful comments for documentation
COMMENT ON COLUMN "agencies"."paypalAccountId" IS 'PayPal merchant account ID from Partner Referrals API';
COMMENT ON COLUMN "agencies"."paypalAccountStatus" IS 'Current PayPal account integration status';
COMMENT ON COLUMN "agencies"."paypalOnboardingUrl" IS 'PayPal Partner Referrals action_url for seller onboarding';
COMMENT ON COLUMN "agencies"."paypalAuthCode" IS 'OAuth authorization code from PayPal onboarding flow';
COMMENT ON COLUMN "agencies"."paypalSharedId" IS 'Shared identifier from PayPal Partner Referrals API';
COMMENT ON COLUMN "agencies"."paypalPermissionsGranted" IS 'Whether seller granted platform permissions to their PayPal account';
COMMENT ON COLUMN "agencies"."paypalEmailConfirmed" IS 'Whether seller confirmed their email address with PayPal';
COMMENT ON COLUMN "agencies"."paypalPaymentsReceivable" IS 'Whether seller account can receive payments (equivalent to Stripe chargesEnabled)';
COMMENT ON COLUMN "agencies"."paypalDetailsSubmitted" IS 'Whether seller completed PayPal account setup requirements';
COMMENT ON COLUMN "agencies"."paypalIntegrationData" IS 'Additional PayPal integration metadata (permissions, capabilities, etc.)';
COMMENT ON COLUMN "agencies"."paypalLastSyncAt" IS 'Timestamp of last successful PayPal account status sync';