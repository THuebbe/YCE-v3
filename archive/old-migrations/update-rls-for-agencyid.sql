-- Update RLS policies to use agencyId column
-- Run this in Supabase SQL Editor

-- Drop the existing RLS policy for users (it might reference the wrong column)
DROP POLICY IF EXISTS "users_tenant_isolation" ON "users";

-- Create the correct RLS policy for users using agencyId
CREATE POLICY "users_agency_isolation" ON "users"
    FOR ALL
    USING ("agencyId" = current_setting('app.current_agency_id', true)::text);

-- Verify the policies are correctly set
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('agencies', 'users');