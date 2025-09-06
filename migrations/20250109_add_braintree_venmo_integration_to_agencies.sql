-- Add Braintree/Venmo integration fields to agencies table
-- Migration: 20250109_add_braintree_venmo_integration_to_agencies

BEGIN;

-- Add Braintree merchant account fields
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS braintree_environment VARCHAR(20) CHECK (braintree_environment IN ('sandbox', 'production')) DEFAULT 'sandbox';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS braintree_merchant_id VARCHAR(255) NULL;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS braintree_public_key VARCHAR(255) NULL;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS braintree_private_key TEXT NULL;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS braintree_account_status VARCHAR(50) DEFAULT 'not_connected' CHECK (braintree_account_status IN ('not_connected', 'pending', 'active', 'suspended', 'needs_attention'));

-- Add Venmo-specific settings
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS venmo_enabled BOOLEAN DEFAULT false;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS venmo_allow_desktop BOOLEAN DEFAULT true;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS venmo_allow_web_login BOOLEAN DEFAULT true;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS venmo_payment_method_usage VARCHAR(20) DEFAULT 'multi_use' CHECK (venmo_payment_method_usage IN ('single_use', 'multi_use'));

-- Add Braintree webhook and configuration fields
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS braintree_webhook_endpoint VARCHAR(500) NULL;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS braintree_webhook_signature TEXT NULL;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS braintree_configuration JSONB DEFAULT '{}';

-- Add tracking fields
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS braintree_created_at TIMESTAMP NULL;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS braintree_last_sync_at TIMESTAMP NULL;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS braintree_integration_data JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agencies_braintree_merchant_id ON agencies(braintree_merchant_id) WHERE braintree_merchant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agencies_braintree_account_status ON agencies(braintree_account_status);
CREATE INDEX IF NOT EXISTS idx_agencies_venmo_enabled ON agencies(venmo_enabled) WHERE venmo_enabled = true;
CREATE INDEX IF NOT EXISTS idx_agencies_braintree_sync ON agencies(braintree_last_sync_at) WHERE braintree_merchant_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN agencies.braintree_environment IS 'Braintree environment: sandbox or production';
COMMENT ON COLUMN agencies.braintree_merchant_id IS 'Braintree merchant account ID';
COMMENT ON COLUMN agencies.braintree_public_key IS 'Braintree public key for client-side SDK';
COMMENT ON COLUMN agencies.braintree_private_key IS 'Encrypted Braintree private key for server-side API calls';
COMMENT ON COLUMN agencies.braintree_account_status IS 'Status of Braintree merchant account';
COMMENT ON COLUMN agencies.venmo_enabled IS 'Whether Venmo payments are enabled for this agency';
COMMENT ON COLUMN agencies.venmo_allow_desktop IS 'Allow Venmo payments on desktop via QR code';
COMMENT ON COLUMN agencies.venmo_allow_web_login IS 'Allow Venmo web login flow when mobile app not available';
COMMENT ON COLUMN agencies.venmo_payment_method_usage IS 'Venmo payment usage: single_use or multi_use (vaulting)';
COMMENT ON COLUMN agencies.braintree_webhook_endpoint IS 'Braintree webhook notification URL';
COMMENT ON COLUMN agencies.braintree_configuration IS 'Additional Braintree configuration settings';
COMMENT ON COLUMN agencies.braintree_integration_data IS 'Braintree integration metadata and API responses';

COMMIT;