-- Ultimate RLS fix - handle Supabase postgres user privileges
-- Run this in Supabase SQL Editor

-- 1. First, let's see what's happening with the current setting
SELECT set_current_agency_id('test-agency-1');
SELECT current_setting('app.current_agency_id', true) as "Setting Value";

-- 2. Test the policy condition manually
SELECT 
    email,
    "agencyId",
    current_setting('app.current_agency_id', true)::text as "Expected Agency",
    ("agencyId" = current_setting('app.current_agency_id', true)::text) as "Should Match",
    CASE 
        WHEN "agencyId" = current_setting('app.current_agency_id', true)::text THEN 'VISIBLE'
        ELSE 'HIDDEN'
    END as "RLS Result"
FROM users 
WHERE email LIKE '%@agency%.test';

-- 3. Check if the issue is with the session-level setting
-- Try using a transaction-level setting instead
BEGIN;
SET LOCAL app.current_agency_id = 'test-agency-1';
SELECT current_setting('app.current_agency_id', true) as "Local Setting";

-- Test query with local setting
SELECT 
    'With Local Setting:' as test,
    count(*) as count
FROM users 
WHERE email LIKE '%@agency%.test';

ROLLBACK;

-- 4. The issue might be that we need to create a more explicit approach
-- Let's create a function that enforces the filtering
CREATE OR REPLACE FUNCTION rls_filter_users()
RETURNS SETOF users AS $$
DECLARE
    agency_id text;
BEGIN
    agency_id := current_setting('app.current_agency_id', true);
    
    IF agency_id IS NULL OR agency_id = '' THEN
        -- No agency set, return empty
        RETURN;
    END IF;
    
    RETURN QUERY 
    SELECT * FROM users 
    WHERE "agencyId" = agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Test the function approach
SELECT set_current_agency_id('test-agency-1');
SELECT 'Function Test 1:' as test, count(*) FROM rls_filter_users() WHERE email LIKE '%@agency%.test';

SELECT set_current_agency_id('test-agency-2');
SELECT 'Function Test 2:' as test, count(*) FROM rls_filter_users() WHERE email LIKE '%@agency%.test';

-- 6. Alternative: Check if we can create a limited user
-- First see what roles exist
SELECT rolname, rolsuper, rolcanlogin FROM pg_roles WHERE rolname LIKE '%service%' OR rolname LIKE '%anon%' OR rolname LIKE '%auth%';

-- 7. Final diagnosis - check if there's something bypassing RLS
SELECT 
    'Current User Info:' as info,
    current_user as user_name,
    session_user as session_user,
    pg_has_role(current_user, 'rds_superuser', 'member') as is_rds_superuser,
    pg_has_role(current_user, 'postgres', 'member') as is_postgres_member;

-- 8. Try a different approach - recreate policies with explicit logic
DROP POLICY IF EXISTS "rls_users_by_agency" ON "users";
DROP POLICY IF EXISTS "rls_agencies_by_id" ON "agencies";

-- Create policies that explicitly check for empty/null settings
CREATE POLICY "rls_users_strict" ON "users"
    FOR ALL
    USING (
        CASE 
            WHEN current_setting('app.current_agency_id', true) IS NULL 
                OR current_setting('app.current_agency_id', true) = '' 
            THEN false
            ELSE "agencyId" = current_setting('app.current_agency_id', true)::text
        END
    );

CREATE POLICY "rls_agencies_strict" ON "agencies"
    FOR ALL
    USING (
        CASE 
            WHEN current_setting('app.current_agency_id', true) IS NULL 
                OR current_setting('app.current_agency_id', true) = '' 
            THEN false
            ELSE id = current_setting('app.current_agency_id', true)::text
        END
    );

-- 9. Test the strict policies
SELECT clear_current_agency_id();
SELECT 'No Agency Set:' as test, count(*) as count FROM users WHERE email LIKE '%@agency%.test';

SELECT set_current_agency_id('test-agency-1');
SELECT 'Strict Test 1:' as test, count(*) as count FROM users WHERE email LIKE '%@agency%.test';

SELECT set_current_agency_id('test-agency-2');
SELECT 'Strict Test 2:' as test, count(*) as count FROM users WHERE email LIKE '%@agency%.test';