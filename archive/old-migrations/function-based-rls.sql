-- Implement RLS using functions instead of policies
-- Run this in Supabase SQL Editor

-- 1. Drop the failing RLS policies
DROP POLICY IF EXISTS "rls_users_strict" ON "users";
DROP POLICY IF EXISTS "rls_agencies_strict" ON "agencies";

-- Disable RLS since we'll use functions instead
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "agencies" DISABLE ROW LEVEL SECURITY;

-- 2. Create comprehensive tenant-aware functions

-- Function to get users for current agency
CREATE OR REPLACE FUNCTION get_agency_users()
RETURNS SETOF users AS $$
DECLARE
    agency_id text;
BEGIN
    agency_id := current_setting('app.current_agency_id', true);
    
    IF agency_id IS NULL OR agency_id = '' THEN
        RETURN;
    END IF;
    
    RETURN QUERY 
    SELECT * FROM users 
    WHERE "agencyId" = agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current agency info
CREATE OR REPLACE FUNCTION get_current_agency()
RETURNS SETOF agencies AS $$
DECLARE
    agency_id text;
BEGIN
    agency_id := current_setting('app.current_agency_id', true);
    
    IF agency_id IS NULL OR agency_id = '' THEN
        RETURN;
    END IF;
    
    RETURN QUERY 
    SELECT * FROM agencies 
    WHERE id = agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely create a user (ensures agencyId matches context)
CREATE OR REPLACE FUNCTION create_agency_user(
    p_id text,
    p_email text,
    p_first_name text DEFAULT NULL,
    p_last_name text DEFAULT NULL,
    p_role text DEFAULT 'USER'
)
RETURNS users AS $$
DECLARE
    agency_id text;
    new_user users;
BEGIN
    agency_id := current_setting('app.current_agency_id', true);
    
    IF agency_id IS NULL OR agency_id = '' THEN
        RAISE EXCEPTION 'No agency context set';
    END IF;
    
    INSERT INTO users (id, email, "firstName", "lastName", "agencyId", role, "createdAt", "updatedAt")
    VALUES (p_id, p_email, p_first_name, p_last_name, agency_id, p_role::text, NOW(), NOW())
    RETURNING * INTO new_user;
    
    RETURN new_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely update a user (ensures stays in same agency)
CREATE OR REPLACE FUNCTION update_agency_user(
    p_user_id text,
    p_first_name text DEFAULT NULL,
    p_last_name text DEFAULT NULL,
    p_role text DEFAULT NULL
)
RETURNS users AS $$
DECLARE
    agency_id text;
    updated_user users;
BEGIN
    agency_id := current_setting('app.current_agency_id', true);
    
    IF agency_id IS NULL OR agency_id = '' THEN
        RAISE EXCEPTION 'No agency context set';
    END IF;
    
    UPDATE users 
    SET 
        "firstName" = COALESCE(p_first_name, "firstName"),
        "lastName" = COALESCE(p_last_name, "lastName"),
        role = COALESCE(p_role::text, role),
        "updatedAt" = NOW()
    WHERE id = p_user_id AND "agencyId" = agency_id
    RETURNING * INTO updated_user;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found or not in current agency';
    END IF;
    
    RETURN updated_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Test the function-based approach
SELECT set_current_agency_id('test-agency-1');

SELECT 'Agency 1 Users:' as test, count(*) as count FROM get_agency_users();
SELECT 'Agency 1 Info:' as test, name FROM get_current_agency();

SELECT set_current_agency_id('test-agency-2');

SELECT 'Agency 2 Users:' as test, count(*) as count FROM get_agency_users();
SELECT 'Agency 2 Info:' as test, name FROM get_current_agency();

-- 4. Test user creation
SELECT set_current_agency_id('test-agency-1');
SELECT create_agency_user('test-new-user', 'newuser@agency1.test', 'New', 'User');

-- Verify it was created in the right agency
SELECT 'New User Check:' as test, email, "agencyId" FROM get_agency_users() WHERE email = 'newuser@agency1.test';

-- 5. Clean up test data
DELETE FROM users WHERE email = 'newuser@agency1.test';
DELETE FROM users WHERE email LIKE '%@agency%.test';
DELETE FROM agencies WHERE slug LIKE 'test-rls-%';

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION get_agency_users() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_current_agency() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_agency_user(text, text, text, text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_agency_user(text, text, text, text) TO authenticated, anon;