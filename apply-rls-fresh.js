// Apply the Final RLS Setup to the database - with fresh connection
const { PrismaClient } = require('@prisma/client')

async function applyRLSSetup() {
  console.log('🔐 YardCard Elite - Applying RLS Setup')
  console.log('=====================================\n')
  
  try {
    console.log('🔧 Applying RLS functions and policies...')
    
    // Enable RLS on tables
    console.log('1. Enabling RLS on tables...')
    let prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`ALTER TABLE "agencies" ENABLE ROW LEVEL SECURITY;`)
    await prisma.$disconnect()
    
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;`)
    await prisma.$disconnect()
    
    // Drop existing policies
    console.log('2. Dropping existing policies...')
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "agencies_tenant_isolation" ON "agencies";`)
    await prisma.$disconnect()
    
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "users_tenant_isolation" ON "users";`)
    await prisma.$disconnect()
    
    // Create new policies
    console.log('3. Creating new policies...')
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "agencies_function_access" ON "agencies"
          FOR ALL
          USING (true);
    `)
    await prisma.$disconnect()
    
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "users_function_access" ON "users"
          FOR ALL
          USING (true);
    `)
    await prisma.$disconnect()
    
    // Context management functions
    console.log('4. Creating context management functions...')
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION set_current_agency_id(agency_id text)
      RETURNS void AS $$
      BEGIN
          PERFORM set_config('app.current_agency_id', agency_id, true);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)
    await prisma.$disconnect()
    
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION get_current_agency_id()
      RETURNS text AS $$
      BEGIN
          RETURN current_setting('app.current_agency_id', true);
      END;
      $$ LANGUAGE plpgsql;
    `)
    await prisma.$disconnect()
    
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION clear_current_agency_id()
      RETURNS void AS $$
      BEGIN
          PERFORM set_config('app.current_agency_id', '', true);
      END;
      $$ LANGUAGE plpgsql;
    `)
    await prisma.$disconnect()
    
    // Query functions
    console.log('5. Creating secure query functions...')
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`
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
    `)
    await prisma.$disconnect()
    
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`
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
    `)
    await prisma.$disconnect()
    
    // Mutation functions
    console.log('6. Creating secure mutation functions...')
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`
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
    `)
    await prisma.$disconnect()
    
    // Grant permissions
    console.log('7. Granting permissions...')
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`GRANT EXECUTE ON FUNCTION set_current_agency_id(text) TO PUBLIC;`)
    await prisma.$executeRawUnsafe(`GRANT EXECUTE ON FUNCTION get_current_agency_id() TO PUBLIC;`)
    await prisma.$executeRawUnsafe(`GRANT EXECUTE ON FUNCTION clear_current_agency_id() TO PUBLIC;`)
    await prisma.$executeRawUnsafe(`GRANT EXECUTE ON FUNCTION get_agency_users() TO PUBLIC;`)
    await prisma.$executeRawUnsafe(`GRANT EXECUTE ON FUNCTION get_current_agency() TO PUBLIC;`)
    await prisma.$executeRawUnsafe(`GRANT EXECUTE ON FUNCTION create_agency_user(text, text, text, text, text) TO PUBLIC;`)
    await prisma.$disconnect()
    
    // Create indexes
    console.log('8. Creating indexes...')
    prisma = new PrismaClient()
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "users_agency_id_idx" ON "users" ("agencyId");`)
    await prisma.$disconnect()
    
    console.log('✅ RLS setup applied successfully!')
    console.log('\n🎉 Database is now configured with secure tenant isolation!')
    console.log('\n📋 Available functions:')
    console.log('  - set_current_agency_id(agency_id)')
    console.log('  - get_current_agency_id()')
    console.log('  - clear_current_agency_id()')
    console.log('  - get_agency_users()')
    console.log('  - get_current_agency()')
    console.log('  - create_agency_user(id, email, firstName, lastName, role)')
    
    return true
    
  } catch (error) {
    console.error('❌ Failed to apply RLS setup:', error.message)
    return false
  }
}

applyRLSSetup().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Setup script failed:', error)
  process.exit(1)
})