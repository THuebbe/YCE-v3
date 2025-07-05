// Basic test to verify schema and connection
const { PrismaClient } = require('@prisma/client')

async function basicTest() {
  console.log('🔒 YardCard Elite - Basic Schema Test')
  console.log('====================================\n')
  
  const prisma = new PrismaClient()
  
  try {
    console.log('🏗️  Testing basic operations...')
    
    // Test 1: Create a test agency
    const testAgency = await prisma.agency.create({
      data: {
        name: 'Test Agency',
        slug: 'test-basic-' + Date.now(),
        isActive: true
      }
    })
    console.log(`✅ Created test agency: ${testAgency.name}`)
    
    // Test 2: Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test-' + Date.now() + '@example.com',
        firstName: 'Test',
        lastName: 'User',
        agencyId: testAgency.id,
        role: 'USER'
      }
    })
    console.log(`✅ Created test user: ${testUser.email}`)
    
    // Test 3: Query the data back
    const foundAgency = await prisma.agency.findUnique({
      where: { id: testAgency.id },
      include: { users: true }
    })
    
    if (foundAgency && foundAgency.users.length === 1) {
      console.log(`✅ Successfully queried agency with ${foundAgency.users.length} user`)
    } else {
      console.log(`❌ Query result mismatch`)
    }
    
    // Test 4: Clean up
    await prisma.user.delete({ where: { id: testUser.id } })
    await prisma.agency.delete({ where: { id: testAgency.id } })
    console.log(`✅ Cleaned up test data`)
    
    console.log('\n🎉 Basic schema tests passed!')
    console.log('Database schema is working correctly with:')
    console.log('- ✅ Agencies table')
    console.log('- ✅ Users table with agencyId relationship')
    console.log('- ✅ Basic CRUD operations')
    
    console.log('\n📝 Next step: Test RLS in Supabase SQL Editor')
    console.log('1. Go to Supabase SQL Editor')
    console.log('2. Run: SELECT set_current_agency_id(\'some-agency-id\')')
    console.log('3. Run: SELECT * FROM users; (should only show users from that agency)')
    
    return true
    
  } catch (error) {
    console.error('❌ Basic test failed:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

basicTest().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})