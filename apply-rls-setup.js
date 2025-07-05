// Apply the Final RLS Setup to the database
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function applyRLSSetup() {
  console.log('🔐 YardCard Elite - Applying RLS Setup')
  console.log('=====================================\n')
  
  const prisma = new PrismaClient()
  
  try {
    // Read the SQL setup file
    const setupPath = path.join(__dirname, 'FINAL_RLS_SETUP.sql')
    const setupSQL = fs.readFileSync(setupPath, 'utf8')
    
    console.log('📄 Reading RLS setup file...')
    console.log('🔧 Applying RLS functions and policies...')
    
    // Execute the setup SQL
    await prisma.$executeRawUnsafe(setupSQL)
    
    console.log('✅ RLS setup applied successfully!')
    console.log('\n🎉 Database is now configured with secure tenant isolation!')
    console.log('\n📋 Available functions:')
    console.log('  - set_current_agency_id(agency_id)')
    console.log('  - get_current_agency_id()')
    console.log('  - clear_current_agency_id()')
    console.log('  - get_agency_users()')
    console.log('  - get_current_agency()')
    console.log('  - create_agency_user(id, email, firstName, lastName, role)')
    console.log('  - update_agency_user(id, firstName, lastName, role)')
    console.log('  - delete_agency_user(id)')
    
    return true
    
  } catch (error) {
    console.error('❌ Failed to apply RLS setup:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

applyRLSSetup().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Setup script failed:', error)
  process.exit(1)
})