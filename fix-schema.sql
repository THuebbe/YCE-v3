-- Add missing columns to match Prisma schema

-- Add description column to agencies table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agencies' AND column_name = 'description') THEN
        ALTER TABLE agencies ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add SUPER_USER to UserRole enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUPER_USER' AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'UserRole'
    )) THEN
        ALTER TYPE "UserRole" ADD VALUE 'SUPER_USER';
    END IF;
END $$;

-- Verify the changes
SELECT 'agencies.description column exists' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'agencies' AND column_name = 'description');

SELECT enumlabel as user_roles FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
ORDER BY enumlabel;