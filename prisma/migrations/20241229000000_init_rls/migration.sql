-- Enable Row-Level Security (RLS) for tenant isolation
-- This migration ensures that all data is automatically scoped to the correct agency/tenant

-- Enable RLS on the agencies table
ALTER TABLE "agencies" ENABLE ROW LEVEL SECURITY;

-- RLS policy for agencies - users can only see their own agency
CREATE POLICY "agencies_tenant_isolation" ON "agencies"
    FOR ALL
    USING (id = current_setting('app.current_agency_id', true)::text);

-- Enable RLS on the users table  
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- RLS policy for users - users can only see users from their agency
CREATE POLICY "users_tenant_isolation" ON "users"
    FOR ALL
    USING ("agencyId" = current_setting('app.current_agency_id', true)::text);

-- Create a function to set the current agency context
CREATE OR REPLACE FUNCTION set_current_agency_id(agency_id text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_agency_id', agency_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get the current agency context
CREATE OR REPLACE FUNCTION get_current_agency_id()
RETURNS text AS $$
BEGIN
    RETURN current_setting('app.current_agency_id', true);
END;
$$ LANGUAGE plpgsql;

-- Create a function to clear the current agency context
CREATE OR REPLACE FUNCTION clear_current_agency_id()
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_agency_id', '', true);
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION set_current_agency_id(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_current_agency_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION clear_current_agency_id() TO PUBLIC;

-- Create indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS "users_agency_id_idx" ON "users" ("agencyId");

-- Add comments for documentation
COMMENT ON POLICY "agencies_tenant_isolation" ON "agencies" IS 'Ensures agencies can only access their own data';
COMMENT ON POLICY "users_tenant_isolation" ON "users" IS 'Ensures users can only access users from their own agency';
COMMENT ON FUNCTION set_current_agency_id(text) IS 'Sets the current agency context for RLS';
COMMENT ON FUNCTION get_current_agency_id() IS 'Gets the current agency context for RLS';
COMMENT ON FUNCTION clear_current_agency_id() IS 'Clears the current agency context for RLS';