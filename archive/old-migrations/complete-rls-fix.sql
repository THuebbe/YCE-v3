-- Complete RLS fix with debugging
-- Run this in Supabase SQL Editor

-- 1. First, let's check what's actually set
SELECT current_setting('app.current_agency_id', true) as "Current Setting";

-- 2. Set the agency context again and verify
SELECT set_current_agency_id('test-agency-1');
SELECT current_setting('app.current_agency_id', true) as "After Setting";

-- 3. Disable RLS temporarily to see all data
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "agencies" DISABLE ROW LEVEL SECURITY;

-- 4. Check all test data exists
SELECT 'All Users:' as info, id, email, "agencyId" FROM users WHERE email LIKE '%@agency%.test'
UNION ALL
SELECT 'All Agencies:', id, name, slug FROM agencies WHERE slug LIKE 'test-rls-%';

-- 5. Re-enable RLS
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agencies" ENABLE ROW LEVEL SECURITY;

-- 6. Drop and recreate policies with explicit permissions
DROP POLICY IF EXISTS "users_agency_isolation" ON "users";
DROP POLICY IF EXISTS "agencies_agency_isolation" ON "agencies";

-- 7. Create policies for specific roles (not just ALL)
CREATE POLICY "users_agency_isolation" ON "users"
    FOR SELECT
    TO postgres, authenticated, anon
    USING ("agencyId" = current_setting('app.current_agency_id', true)::text);

CREATE POLICY "users_agency_isolation_modify" ON "users"
    FOR INSERT
    TO postgres, authenticated, anon
    WITH CHECK ("agencyId" = current_setting('app.current_agency_id', true)::text);

CREATE POLICY "users_agency_isolation_update" ON "users"
    FOR UPDATE
    TO postgres, authenticated, anon
    USING ("agencyId" = current_setting('app.current_agency_id', true)::text)
    WITH CHECK ("agencyId" = current_setting('app.current_agency_id', true)::text);

CREATE POLICY "users_agency_isolation_delete" ON "users"
    FOR DELETE
    TO postgres, authenticated, anon
    USING ("agencyId" = current_setting('app.current_agency_id', true)::text);

CREATE POLICY "agencies_agency_isolation" ON "agencies"
    FOR SELECT
    TO postgres, authenticated, anon
    USING (id = current_setting('app.current_agency_id', true)::text);

CREATE POLICY "agencies_agency_isolation_modify" ON "agencies"
    FOR ALL
    TO postgres, authenticated, anon
    USING (id = current_setting('app.current_agency_id', true)::text)
    WITH CHECK (id = current_setting('app.current_agency_id', true)::text);

-- 8. Test the fixed policies
SELECT set_current_agency_id('test-agency-1');

-- These should now show only test-agency-1 data
SELECT 'Filtered Users:' as info, count(*) as count FROM users WHERE email LIKE '%@agency%.test';
SELECT 'Filtered Agencies:' as info, count(*) as count FROM agencies WHERE slug LIKE 'test-rls-%';

-- 9. Switch context and test again
SELECT set_current_agency_id('test-agency-2');
SELECT 'Agency 2 Users:' as info, count(*) as count FROM users WHERE email LIKE '%@agency%.test';
SELECT 'Agency 2 Agencies:' as info, count(*) as count FROM agencies WHERE slug LIKE 'test-rls-%';

-- 10. Verify the actual data being returned
SELECT set_current_agency_id('test-agency-1');
SELECT 'Agency 1 Data:' as info, id, email, "agencyId" FROM users WHERE email LIKE '%@agency%.test';

SELECT set_current_agency_id('test-agency-2');
SELECT 'Agency 2 Data:' as info, id, email, "agencyId" FROM users WHERE email LIKE '%@agency%.test';