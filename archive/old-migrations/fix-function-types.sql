-- Fix the function type casting issues
-- Run this in Supabase SQL Editor

-- 1. Drop the problematic functions
DROP FUNCTION IF EXISTS create_agency_user(text, text, text, text, text);
DROP FUNCTION IF EXISTS update_agency_user(text, text, text, text);

-- 2. Recreate with correct type casting
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
    VALUES (p_id, p_email, p_first_name, p_last_name, agency_id, p_role::"UserRole", NOW(), NOW())
    RETURNING * INTO new_user;
    
    RETURN new_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate update function with correct casting
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
        role = COALESCE(p_role::"UserRole", role),
        "updatedAt" = NOW()
    WHERE id = p_user_id AND "agencyId" = agency_id
    RETURNING * INTO updated_user;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found or not in current agency';
    END IF;
    
    RETURN updated_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Test the fixed functions
SELECT set_current_agency_id('test-agency-1');

SELECT 'Agency 1 Users:' as test, count(*) as count FROM get_agency_users();
SELECT 'Agency 1 Info:' as test, name FROM get_current_agency();

SELECT set_current_agency_id('test-agency-2');

SELECT 'Agency 2 Users:' as test, count(*) as count FROM get_agency_users();
SELECT 'Agency 2 Info:' as test, name FROM get_current_agency();

-- 5. Test user creation with correct type casting
SELECT set_current_agency_id('test-agency-1');
SELECT create_agency_user('test-new-user', 'newuser@agency1.test', 'New', 'User', 'USER');

-- Verify it was created in the right agency
SELECT 'New User Check:' as test, email, "agencyId", role FROM get_agency_users() WHERE email = 'newuser@agency1.test';

-- 6. Grant permissions for the fixed functions
GRANT EXECUTE ON FUNCTION create_agency_user(text, text, text, text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_agency_user(text, text, text, text) TO authenticated, anon;

-- 7. Clean up test data
DELETE FROM users WHERE email = 'newuser@agency1.test';
DELETE FROM users WHERE email LIKE '%@agency%.test';
DELETE FROM agencies WHERE slug LIKE 'test-rls-%';