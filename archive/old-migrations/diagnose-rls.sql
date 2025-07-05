-- Diagnose RLS issues
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is actually enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('users', 'agencies');

-- 2. Check current RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as "Policy Definition"
FROM pg_policies 
WHERE tablename IN ('users', 'agencies');

-- 3. Test the RLS functions
SELECT get_current_agency_id() as "Current Agency ID";

-- 4. Test setting agency context
SELECT set_current_agency_id('test-agency-1');
SELECT get_current_agency_id() as "After Setting Agency 1";

-- 5. Check what the policy sees
SELECT current_setting('app.current_agency_id', true) as "Raw Setting Value";

-- 6. Test the policy condition manually
SELECT 
    id,
    email,
    "agencyId",
    ("agencyId" = current_setting('app.current_agency_id', true)::text) as "Policy Match"
FROM users 
WHERE email LIKE '%@agency%.test';

-- 7. Check if there are any superuser bypasses
SELECT current_user, usesuper FROM pg_user WHERE usename = current_user;