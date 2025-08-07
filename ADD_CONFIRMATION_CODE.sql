-- Add missing confirmationCode column to orders table
-- This fixes the immediate "confirmationCode column not found" error

-- Add the confirmationCode column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "confirmationCode" TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS orders_confirmation_code_idx ON orders("confirmationCode");

-- Add comment for documentation
COMMENT ON COLUMN orders."confirmationCode" IS 'Customer-facing confirmation code for order lookup';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'confirmationCode';