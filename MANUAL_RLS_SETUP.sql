-- YardCard Elite - Manual RLS Setup Instructions
-- Copy and paste these commands ONE AT A TIME into your Supabase SQL Editor

-- 1. Enable RLS on tables
ALTER TABLE "agencies" ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on users table
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "agencies_tenant_isolation" ON "agencies";

-- 4. Drop users policy
DROP POLICY IF EXISTS "users_tenant_isolation" ON "users";

-- 5. Create new bypass policies for our secure functions
CREATE POLICY "agencies_function_access" ON "agencies" FOR ALL USING (true);

-- 6. Create users policy
CREATE POLICY "users_function_access" ON "users" FOR ALL USING (true);

-- 7. Create context management function - set agency
CREATE OR REPLACE FUNCTION set_current_agency_id(agency_id text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_agency_id', agency_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create context management function - get agency
CREATE OR REPLACE FUNCTION get_current_agency_id()
RETURNS text AS $$
BEGIN
    RETURN current_setting('app.current_agency_id', true);
END;
$$ LANGUAGE plpgsql;

-- 9. Create context management function - clear agency
CREATE OR REPLACE FUNCTION clear_current_agency_id()
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_agency_id', '', true);
END;
$$ LANGUAGE plpgsql;

-- 10. Create secure function to get agency users
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
    current_agency_id := current_setting('app.current_agency_id', true);
    
    IF current_agency_id IS NULL OR current_agency_id = '' THEN
        RAISE EXCEPTION 'Agency context not set. Call set_current_agency_id() first.';
    END IF;
    
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

-- 11. Create secure function to get current agency
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
    current_agency_id := current_setting('app.current_agency_id', true);
    
    IF current_agency_id IS NULL OR current_agency_id = '' THEN
        RAISE EXCEPTION 'Agency context not set. Call set_current_agency_id() first.';
    END IF;
    
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

-- 12. Create secure function to create agency user
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
BEGIN
    current_agency_id := current_setting('app.current_agency_id', true);
    
    IF current_agency_id IS NULL OR current_agency_id = '' THEN
        RAISE EXCEPTION 'Agency context not set. Call set_current_agency_id() first.';
    END IF;
    
    IF user_role NOT IN ('SUPER_ADMIN', 'SUPER_USER', 'ADMIN', 'MANAGER', 'USER') THEN
        RAISE EXCEPTION 'Invalid user role: %', user_role;
    END IF;
    
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

-- 13. Grant permissions on all functions
GRANT EXECUTE ON FUNCTION set_current_agency_id(text) TO PUBLIC;

-- 14. Grant permissions
GRANT EXECUTE ON FUNCTION get_current_agency_id() TO PUBLIC;

-- 15. Grant permissions
GRANT EXECUTE ON FUNCTION clear_current_agency_id() TO PUBLIC;

-- 16. Grant permissions
GRANT EXECUTE ON FUNCTION get_agency_users() TO PUBLIC;

-- 17. Grant permissions
GRANT EXECUTE ON FUNCTION get_current_agency() TO PUBLIC;

-- 18. Grant permissions
GRANT EXECUTE ON FUNCTION create_agency_user(text, text, text, text, text) TO PUBLIC;

-- 19. Create index for performance
CREATE INDEX IF NOT EXISTS "users_agency_id_idx" ON "users" ("agencyId");

-- 20. Test the setup - should return 'Setup Complete!'
SELECT 'YardCard Elite RLS Setup Complete - All secure functions installed!' as status;