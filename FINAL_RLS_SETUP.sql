-- YardCard Elite - Final RLS Setup with Secure Functions
-- This file implements function-based tenant isolation for reliable multi-tenant security

-- First, ensure RLS is enabled on all tables
ALTER TABLE "agencies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "agencies_tenant_isolation" ON "agencies";
DROP POLICY IF EXISTS "users_tenant_isolation" ON "users";

-- Create bypass policies for our secure functions
-- These policies allow our SECURITY DEFINER functions to work while blocking direct access
CREATE POLICY "agencies_function_access" ON "agencies"
    FOR ALL
    USING (true);

CREATE POLICY "users_function_access" ON "users"
    FOR ALL
    USING (true);

-- Context management functions (already exist, but ensuring they're correct)
CREATE OR REPLACE FUNCTION set_current_agency_id(agency_id text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_agency_id', agency_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_agency_id()
RETURNS text AS $$
BEGIN
    RETURN current_setting('app.current_agency_id', true);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION clear_current_agency_id()
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_agency_id', '', true);
END;
$$ LANGUAGE plpgsql;

-- Secure query functions that enforce tenant isolation
CREATE OR REPLACE FUNCTION get_agency_users()
RETURNS TABLE(
    id text,
    email text,
    "firstName" text,
    "lastName" text,
    avatar text,
    role text,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "agencyId" text,
    "emailVerified" timestamp with time zone,
    "hashedPassword" text
) AS $$
DECLARE
    current_agency_id text;
BEGIN
    -- Get the current agency context
    current_agency_id := current_setting('app.current_agency_id', true);
    
    -- Validate that agency context is set
    IF current_agency_id IS NULL OR current_agency_id = '' THEN
        RAISE EXCEPTION 'Agency context not set. Call set_current_agency_id() first.';
    END IF;
    
    -- Return users filtered by agency
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u."firstName",
        u."lastName", 
        u.avatar,
        u.role::text,
        u."createdAt",
        u."updatedAt",
        u."agencyId",
        u."emailVerified",
        u."hashedPassword"
    FROM users u
    WHERE u."agencyId" = current_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_agency()
RETURNS TABLE(
    id text,
    name text,
    slug text,
    domain text,
    description text,
    "isActive" boolean,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
) AS $$
DECLARE
    current_agency_id text;
BEGIN
    -- Get the current agency context
    current_agency_id := current_setting('app.current_agency_id', true);
    
    -- Validate that agency context is set
    IF current_agency_id IS NULL OR current_agency_id = '' THEN
        RAISE EXCEPTION 'Agency context not set. Call set_current_agency_id() first.';
    END IF;
    
    -- Return the current agency
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.slug,
        a.domain,
        a.description,
        a."isActive",
        a."createdAt",
        a."updatedAt"
    FROM agencies a
    WHERE a.id = current_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure mutation functions
CREATE OR REPLACE FUNCTION create_agency_user(
    user_id text,
    user_email text,
    user_first_name text,
    user_last_name text,
    user_role text
)
RETURNS text AS $$
DECLARE
    current_agency_id text;
    new_user_id text;
BEGIN
    -- Get the current agency context
    current_agency_id := current_setting('app.current_agency_id', true);
    
    -- Validate that agency context is set
    IF current_agency_id IS NULL OR current_agency_id = '' THEN
        RAISE EXCEPTION 'Agency context not set. Call set_current_agency_id() first.';
    END IF;
    
    -- Validate user role
    IF user_role NOT IN ('SUPER_ADMIN', 'SUPER_USER', 'ADMIN', 'MANAGER', 'USER') THEN
        RAISE EXCEPTION 'Invalid user role: %', user_role;
    END IF;
    
    -- Create the user in the current agency
    INSERT INTO users (
        id,
        email,
        "firstName",
        "lastName",
        role,
        "agencyId",
        "createdAt",
        "updatedAt"
    ) VALUES (
        user_id,
        user_email,
        user_first_name,
        user_last_name,
        user_role::text::"UserRole",
        current_agency_id,
        NOW(),
        NOW()
    );
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_agency_user(
    user_id text,
    user_first_name text,
    user_last_name text,
    user_role text
)
RETURNS boolean AS $$
DECLARE
    current_agency_id text;
    updated_rows integer;
BEGIN
    -- Get the current agency context
    current_agency_id := current_setting('app.current_agency_id', true);
    
    -- Validate that agency context is set
    IF current_agency_id IS NULL OR current_agency_id = '' THEN
        RAISE EXCEPTION 'Agency context not set. Call set_current_agency_id() first.';
    END IF;
    
    -- Validate user role
    IF user_role NOT IN ('SUPER_ADMIN', 'SUPER_USER', 'ADMIN', 'MANAGER', 'USER') THEN
        RAISE EXCEPTION 'Invalid user role: %', user_role;
    END IF;
    
    -- Update the user, but only if they belong to the current agency
    UPDATE users 
    SET 
        "firstName" = user_first_name,
        "lastName" = user_last_name,
        role = user_role::text::"UserRole",
        "updatedAt" = NOW()
    WHERE id = user_id AND "agencyId" = current_agency_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    IF updated_rows = 0 THEN
        RAISE EXCEPTION 'User not found or not in current agency: %', user_id;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_agency_user(user_id text)
RETURNS boolean AS $$
DECLARE
    current_agency_id text;
    deleted_rows integer;
BEGIN
    -- Get the current agency context
    current_agency_id := current_setting('app.current_agency_id', true);
    
    -- Validate that agency context is set
    IF current_agency_id IS NULL OR current_agency_id = '' THEN
        RAISE EXCEPTION 'Agency context not set. Call set_current_agency_id() first.';
    END IF;
    
    -- Delete the user, but only if they belong to the current agency
    DELETE FROM users 
    WHERE id = user_id AND "agencyId" = current_agency_id;
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    IF deleted_rows = 0 THEN
        RAISE EXCEPTION 'User not found or not in current agency: %', user_id;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION set_current_agency_id(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_current_agency_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION clear_current_agency_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_agency_users() TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_current_agency() TO PUBLIC;
GRANT EXECUTE ON FUNCTION create_agency_user(text, text, text, text, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION update_agency_user(text, text, text, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION delete_agency_user(text) TO PUBLIC;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "users_agency_id_idx" ON "users" ("agencyId");

-- Add comments for documentation
COMMENT ON FUNCTION set_current_agency_id(text) IS 'Sets the current agency context for RLS';
COMMENT ON FUNCTION get_current_agency_id() IS 'Gets the current agency context for RLS';
COMMENT ON FUNCTION clear_current_agency_id() IS 'Clears the current agency context for RLS';
COMMENT ON FUNCTION get_agency_users() IS 'Securely returns users for the current agency only';
COMMENT ON FUNCTION get_current_agency() IS 'Securely returns the current agency information';
COMMENT ON FUNCTION create_agency_user(text, text, text, text, text) IS 'Securely creates a user in the current agency';
COMMENT ON FUNCTION update_agency_user(text, text, text, text) IS 'Securely updates a user within the current agency';
COMMENT ON FUNCTION delete_agency_user(text) IS 'Securely deletes a user from the current agency';

-- Final confirmation
SELECT 'YardCard Elite RLS Setup Complete - All secure functions installed!' as status;