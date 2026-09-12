-- Migration: Add missing booking flow columns to orders table
-- Date: 2025-08-06
-- Purpose: Fix booking flow step 5 errors by adding all required columns

-- Add confirmation code column (the primary missing column causing errors)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'confirmationCode') THEN
        ALTER TABLE "orders" ADD COLUMN "confirmationCode" TEXT;
        CREATE INDEX IF NOT EXISTS "orders_confirmation_code_idx" ON "orders"("confirmationCode");
    END IF;
END $$;

-- Add event details columns
DO $$
BEGIN
    -- Delivery address components
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deliveryStreet') THEN
        ALTER TABLE "orders" ADD COLUMN "deliveryStreet" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deliveryCity') THEN
        ALTER TABLE "orders" ADD COLUMN "deliveryCity" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deliveryState') THEN
        ALTER TABLE "orders" ADD COLUMN "deliveryState" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deliveryZipCode') THEN
        ALTER TABLE "orders" ADD COLUMN "deliveryZipCode" TEXT;
    END IF;
    
    -- Time window and delivery notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'timeWindow') THEN
        ALTER TABLE "orders" ADD COLUMN "timeWindow" TEXT CHECK ("timeWindow" IN ('morning', 'afternoon', 'evening'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deliveryNotes') THEN
        ALTER TABLE "orders" ADD COLUMN "deliveryNotes" TEXT;
    END IF;
END $$;

-- Add display customization columns
DO $$
BEGIN
    -- Event message and recipient details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'eventMessage') THEN
        ALTER TABLE "orders" ADD COLUMN "eventMessage" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customMessage') THEN
        ALTER TABLE "orders" ADD COLUMN "customMessage" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'recipientName') THEN
        ALTER TABLE "orders" ADD COLUMN "recipientName" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'eventNumber') THEN
        ALTER TABLE "orders" ADD COLUMN "eventNumber" INTEGER;
    END IF;
    
    -- Style preferences
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'messageStyle') THEN
        ALTER TABLE "orders" ADD COLUMN "messageStyle" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'nameStyle') THEN
        ALTER TABLE "orders" ADD COLUMN "nameStyle" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'characterTheme') THEN
        ALTER TABLE "orders" ADD COLUMN "characterTheme" TEXT;
    END IF;
    
    -- Hobbies (stored as JSON array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'hobbies') THEN
        ALTER TABLE "orders" ADD COLUMN "hobbies" JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Extra days configuration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'extraDaysBefore') THEN
        ALTER TABLE "orders" ADD COLUMN "extraDaysBefore" INTEGER DEFAULT 0 CHECK ("extraDaysBefore" >= 0 AND "extraDaysBefore" <= 7);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'extraDaysAfter') THEN
        ALTER TABLE "orders" ADD COLUMN "extraDaysAfter" INTEGER DEFAULT 0 CHECK ("extraDaysAfter" >= 0 AND "extraDaysAfter" <= 7);
    END IF;
END $$;

-- Add payment information columns
DO $$
BEGIN
    -- Payment method and billing details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paymentMethod') THEN
        ALTER TABLE "orders" ADD COLUMN "paymentMethod" TEXT CHECK ("paymentMethod" IN ('card', 'apple_pay', 'paypal', 'venmo'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paymentMethodId') THEN
        ALTER TABLE "orders" ADD COLUMN "paymentMethodId" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'billingZipCode') THEN
        ALTER TABLE "orders" ADD COLUMN "billingZipCode" TEXT;
    END IF;
    
    -- Hold ID for inventory management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'holdId') THEN
        ALTER TABLE "orders" ADD COLUMN "holdId" TEXT;
        CREATE INDEX IF NOT EXISTS "orders_hold_id_idx" ON "orders"("holdId");
    END IF;
    
    -- Payment intent ID for Stripe integration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paymentIntentId') THEN
        ALTER TABLE "orders" ADD COLUMN "paymentIntentId" TEXT;
        CREATE INDEX IF NOT EXISTS "orders_payment_intent_id_idx" ON "orders"("paymentIntentId");
    END IF;
END $$;

-- NOTE: createdAt/updatedAt (camelCase) were dropped from this migration.
-- The orders table already has created_at/updated_at (snake_case), which is
-- what every application code path actually reads and writes (verified against
-- src/features/orders/*, src/app/api/orders/create/route.ts,
-- src/lib/db/supabase-client.ts). Adding parallel camelCase columns would just
-- be unused duplication.

-- Add index for performance (created_at is the real column app code sorts by;
-- this index did not previously exist)
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders"("created_at");

-- NOTE: indexes on (agencyId, status), (eventDate), and (customerEmail) were
-- dropped from this migration. Those column names don't exist on this table
-- (app code uses agency_id, event_date, customer_email) and equivalent
-- indexes already exist: orders_agencyId_status_idx (agency_id, status),
-- orders_agencyId_eventDate_idx (agency_id, event_date), and
-- orders_customerEmail_idx (customer_email) -- historically camelCase-named
-- but built on the correct snake_case columns.

-- Update RLS policies if they exist (currently a no-op: no policies exist yet
-- on orders and RLS is off project-wide, see CLAUDE.md; column name corrected
-- to the real agency_id in case a policy is added later)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders') THEN
        DROP POLICY IF EXISTS "orders_isolation" ON "orders";
        CREATE POLICY "orders_isolation" ON "orders"
        FOR ALL
        USING (agency_id = get_current_agency_id());
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN "orders"."confirmationCode" IS 'Customer-facing confirmation code for order lookup';
COMMENT ON COLUMN "orders"."deliveryStreet" IS 'Street address for yard display delivery';
COMMENT ON COLUMN "orders"."deliveryCity" IS 'City for yard display delivery';
COMMENT ON COLUMN "orders"."deliveryState" IS 'State for yard display delivery';
COMMENT ON COLUMN "orders"."deliveryZipCode" IS 'ZIP code for yard display delivery';
COMMENT ON COLUMN "orders"."timeWindow" IS 'Preferred delivery time window';
COMMENT ON COLUMN "orders"."eventMessage" IS 'Main message to display on yard signs';
COMMENT ON COLUMN "orders"."recipientName" IS 'Name of the event recipient';
COMMENT ON COLUMN "orders"."eventNumber" IS 'Special number for the event (e.g., age, anniversary year)';
COMMENT ON COLUMN "orders"."hobbies" IS 'Customer hobbies/interests for themed decorations (JSON array)';
COMMENT ON COLUMN "orders"."extraDaysBefore" IS 'Number of extra days to display before event (0-7)';
COMMENT ON COLUMN "orders"."extraDaysAfter" IS 'Number of extra days to display after event (0-7)';
COMMENT ON COLUMN "orders"."holdId" IS 'Inventory hold ID for sign allocation';
COMMENT ON COLUMN "orders"."paymentIntentId" IS 'Stripe Payment Intent ID for transaction tracking';