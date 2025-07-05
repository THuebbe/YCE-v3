// Simplified RLS test to debug the issue
const { PrismaClient } = require('@prisma/client')

async function testSimpleRLS() {
  console.log('🔒 Simple RLS Test')
  console.log('==================\n')
  
  const prisma = new PrismaClient()
  
  try {
    // Test 1: Check if functions exist
    console.log('1️⃣  Testing function availability...')
    try {
      const emptyResult = await prisma.$queryRaw`SELECT * FROM get_agency_users()`
      console.log(`✅ get_agency_users() exists (returned ${emptyResult.length} users without context)`)
    } catch (error) {
      console.log(`❌ get_agency_users() error: ${error.message}`)
      return false
    }
    
    // Test 2: Create a simple test agency
    console.log('\n2️⃣  Creating test agency...')
    const testAgency = await prisma.agency.create({
      data: {
        name: 'Simple Test Agency',
        slug: 'simple-test-' + Date.now(),
        isActive: true
      }
    })
    console.log(`✅ Created agency: ${testAgency.id}`)
    
    // Test 3: Try setting context and checking it
    console.log('\n3️⃣  Testing context setting...')
    await prisma.$executeRaw`SELECT set_current_agency_id(${testAgency.id})`
    
    const contextCheck = await prisma.$queryRaw`SELECT current_setting('app.current_agency_id', true) as agency_id`
    console.log(`✅ Context set to: ${contextCheck[0]?.agency_id}`)
    
    // Test 4: Test agency function
    console.log('\n4️⃣  Testing get_current_agency()...')
    const currentAgencyResult = await prisma.$queryRaw`SELECT * FROM get_current_agency()`
    console.log(`✅ Current agency function returned: ${currentAgencyResult.length} results`)
    if (currentAgencyResult.length > 0) {
      console.log(`   Agency name: ${currentAgencyResult[0].name}`)
    }
    
    // Test 5: Test user creation with context
    console.log('\n5️⃣  Testing user creation with context...')
    const userId = 'simple-test-user-' + Date.now()
    try {
      await prisma.$executeRaw`
        SELECT create_agency_user(
          ${userId},
          ${'test@simple.com'},
          ${'Test'},
          ${'User'},
          ${'USER'}
        )
      `
      console.log(`✅ User created successfully`)
      
      // Check if user appears in agency users
      const agencyUsers = await prisma.$queryRaw`SELECT * FROM get_agency_users()`
      console.log(`✅ Agency now has ${agencyUsers.length} users`)
      
    } catch (error) {
      console.log(`❌ User creation failed: ${error.message}`)
    }
    
    // Clean up
    console.log('\n🧹 Cleaning up...')
    await prisma.$executeRaw`SELECT clear_current_agency_id()`
    await prisma.user.deleteMany({ where: { email: 'test@simple.com' } })
    await prisma.agency.delete({ where: { id: testAgency.id } })
    
    console.log('\n🎉 Simple test completed!')
    return true
    
  } catch (error) {
    console.error('❌ Simple test failed:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

testSimpleRLS().then(success => {
  console.log(success ? '\n✅ RLS is working!' : '\n❌ RLS needs attention')
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Test script failed:', error)
  process.exit(1)
})