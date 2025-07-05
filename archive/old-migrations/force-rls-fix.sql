-- Force RLS to work properly
-- Run this in Supabase SQL Editor

-- 1. Check the current role and its permissions
SELECT 
    current_user as "Current User",
    session_user as "Session User", 
    current_setting('is_superuser', true) as "Is Superuser",
    has_database_privilege(current_user, current_database(), 'CREATE') as "Can Create";

-- 2. Check if RLS is actually enabled and policies exist
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled",
    (SELECT count(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as "Policy Count"
FROM pg_tables 
WHERE tablename IN ('users', 'agencies');

-- 3. Force disable and re-enable RLS with proper setup
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "agencies" DISABLE ROW LEVEL SECURITY;

-- 4. Drop ALL existing policies completely
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON users';
    END LOOP;
    
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'agencies'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON agencies';
    END LOOP;
END $$;

-- 5. Re-enable RLS
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agencies" ENABLE ROW LEVEL SECURITY;

-- 6. Force RLS to apply to table owner (important!)
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
ALTER TABLE "agencies" FORCE ROW LEVEL SECURITY;

-- 7. Create simple, explicit policies
CREATE POLICY "rls_users_by_agency" ON "users"
    FOR ALL
    USING ("agencyId" = current_setting('app.current_agency_id', true)::text);

CREATE POLICY "rls_agencies_by_id" ON "agencies"  
    FOR ALL
    USING (id = current_setting('app.current_agency_id', true)::text);

-- 8. Test immediately after policy creation
SELECT set_current_agency_id('test-agency-1');
SELECT 'Test 1 - Should be 2:' as test, count(*) as user_count FROM users WHERE email LIKE '%@agency%.test';

SELECT set_current_agency_id('test-agency-2');
SELECT 'Test 2 - Should be 2:' as test, count(*) as user_count FROM users WHERE email LIKE '%@agency%.test';

-- 9. Show exactly what each context sees
SELECT set_current_agency_id('test-agency-1');
SELECT 'Agency 1 sees:' as context, email, "agencyId" FROM users WHERE email LIKE '%@agency%.test';

SELECT set_current_agency_id('test-agency-2');
SELECT 'Agency 2 sees:' as context, email, "agencyId" FROM users WHERE email LIKE '%@agency%.test';

-- 10. Final verification - check policy enforcement
SELECT 
    tablename,
    policyname,
    cmd,
    qual as "Policy Condition"
FROM pg_policies 
WHERE tablename IN ('users', 'agencies');