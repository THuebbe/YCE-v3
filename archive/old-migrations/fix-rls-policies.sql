-- Complete RLS fix for agencyId column
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on both tables (in case it's not enabled)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agencies" ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "users_tenant_isolation" ON "users";
DROP POLICY IF EXISTS "users_agency_isolation" ON "users";
DROP POLICY IF EXISTS "agencies_tenant_isolation" ON "agencies";

-- 3. Create correct policies using agencyId
CREATE POLICY "users_agency_isolation" ON "users"
    FOR ALL
    USING ("agencyId" = current_setting('app.current_agency_id', true)::text);

CREATE POLICY "agencies_agency_isolation" ON "agencies"
    FOR ALL  
    USING (id = current_setting('app.current_agency_id', true)::text);

-- 4. Test the setup
SELECT set_current_agency_id('test-agency-1');

-- This should show only users from test-agency-1
SELECT 
    id, 
    email, 
    "agencyId",
    'Should be test-agency-1' as expected
FROM users 
WHERE email LIKE '%@agency%.test';

-- This should show only test-agency-1
SELECT 
    id,
    name,
    slug,
    'Should be test-agency-1' as expected  
FROM agencies
WHERE slug LIKE 'test-rls-%';