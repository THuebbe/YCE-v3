-- Fix column name mismatch: tenantId -> agencyId
-- Run this in Supabase SQL Editor

-- Check if tenantId column exists and agencyId doesn't
DO $$ 
BEGIN 
    -- If tenantId exists but agencyId doesn't, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tenantId') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'agencyId') THEN
        
        -- Rename the column
        ALTER TABLE "users" RENAME COLUMN "tenantId" TO "agencyId";
        
        -- Update the foreign key constraint name if it exists
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_tenantId_fkey') THEN
            ALTER TABLE "users" RENAME CONSTRAINT "users_tenantId_fkey" TO "users_agencyId_fkey";
        END IF;
        
        -- Update the unique constraint if it exists
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_email_tenantId_key') THEN
            ALTER TABLE "users" RENAME CONSTRAINT "users_email_tenantId_key" TO "users_email_agencyId_key";
        END IF;
        
        RAISE NOTICE 'Renamed tenantId column to agencyId';
    ELSE
        RAISE NOTICE 'Column renaming not needed or already done';
    END IF;
END $$;

-- Verify the current schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;