-- Clean up duplicate tenantId/agencyId columns
-- Run this in Supabase SQL Editor

-- First, let's see what we're working with
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('tenantId', 'agencyId')
ORDER BY column_name;

-- Check if we have data in both columns
SELECT 
    COUNT(*) as total_users,
    COUNT("tenantId") as users_with_tenantId,
    COUNT("agencyId") as users_with_agencyId
FROM users;

-- Option 1: If agencyId is empty and tenantId has data, copy tenantId to agencyId and drop tenantId
DO $$ 
DECLARE
    tenant_count INTEGER;
    agency_count INTEGER;
BEGIN 
    -- Count non-null values in each column
    SELECT COUNT("tenantId"), COUNT("agencyId") INTO tenant_count, agency_count FROM users;
    
    RAISE NOTICE 'tenantId has % non-null values', tenant_count;
    RAISE NOTICE 'agencyId has % non-null values', agency_count;
    
    -- If tenantId has data and agencyId is mostly empty, copy and cleanup
    IF tenant_count > agency_count THEN
        RAISE NOTICE 'Copying data from tenantId to agencyId and cleaning up...';
        
        -- Copy data from tenantId to agencyId where agencyId is null
        UPDATE users 
        SET "agencyId" = "tenantId" 
        WHERE "tenantId" IS NOT NULL AND "agencyId" IS NULL;
        
        -- Drop foreign key constraints that reference tenantId
        ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_tenantId_fkey";
        
        -- Drop unique constraint with tenantId
        ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_email_tenantId_key";
        
        -- Drop the tenantId column
        ALTER TABLE users DROP COLUMN IF EXISTS "tenantId";
        
        -- Make agencyId NOT NULL if it isn't already
        ALTER TABLE users ALTER COLUMN "agencyId" SET NOT NULL;
        
        -- Add foreign key constraint for agencyId
        ALTER TABLE users ADD CONSTRAINT "users_agencyId_fkey" 
        FOREIGN KEY ("agencyId") REFERENCES agencies(id) ON DELETE CASCADE;
        
        -- Add unique constraint for email + agencyId
        ALTER TABLE users ADD CONSTRAINT "users_email_agencyId_key" 
        UNIQUE (email, "agencyId");
        
        RAISE NOTICE 'Cleanup completed successfully';
        
    -- If agencyId has data and tenantId is mostly empty, copy and cleanup the other way
    ELSIF agency_count > tenant_count THEN
        RAISE NOTICE 'Copying data from agencyId to tenantId and cleaning up...';
        
        -- Copy data from agencyId to tenantId where tenantId is null
        UPDATE users 
        SET "tenantId" = "agencyId" 
        WHERE "agencyId" IS NOT NULL AND "tenantId" IS NULL;
        
        -- Drop foreign key constraints that reference agencyId
        ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_agencyId_fkey";
        
        -- Drop unique constraint with agencyId
        ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_email_agencyId_key";
        
        -- Drop the agencyId column
        ALTER TABLE users DROP COLUMN IF EXISTS "agencyId";
        
        -- Make tenantId NOT NULL if it isn't already
        ALTER TABLE users ALTER COLUMN "tenantId" SET NOT NULL;
        
        -- Add foreign key constraint for tenantId
        ALTER TABLE users ADD CONSTRAINT "users_tenantId_fkey" 
        FOREIGN KEY ("tenantId") REFERENCES agencies(id) ON DELETE CASCADE;
        
        -- Add unique constraint for email + tenantId
        ALTER TABLE users ADD CONSTRAINT "users_email_tenantId_key" 
        UNIQUE (email, "tenantId");
        
        RAISE NOTICE 'Cleanup completed successfully';
        
    ELSE
        RAISE NOTICE 'Both columns have equal data or both are empty. Manual intervention needed.';
    END IF;
END $$;

-- Verify the final result
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('tenantId', 'agencyId')
ORDER BY column_name;