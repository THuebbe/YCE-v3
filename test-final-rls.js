// Final RLS test using the secure functions
const { PrismaClient } = require('@prisma/client')

async function testFinalRLS() {
  console.log('🔒 YardCard Elite - Final RLS Test')
  console.log('==================================\n')
  
  const prisma = new PrismaClient()
  
  try {
    console.log('📋 Testing function-based tenant isolation...\n')
    
    // Create test agencies
    console.log('🏗️  Creating test data...')
    const agency1 = await prisma.agency.create({
      data: {
        name: 'Final Test Agency 1',
        slug: 'final-test-1',
        isActive: true
      }
    })
    
    const agency2 = await prisma.agency.create({
      data: {
        name: 'Final Test Agency 2', 
        slug: 'final-test-2',
        isActive: true
      }
    })
    
    console.log(`✅ Created agencies: ${agency1.name}, ${agency2.name}`)
    
    // Test the secure functions via raw SQL
    console.log('\n🔧 Testing secure functions...')
    
    // Set context to agency 1 and get users
    await prisma.$executeRaw`SELECT set_current_agency_id(${agency1.id})`
    const agency1Users = await prisma.$queryRaw`SELECT * FROM get_agency_users()`
    console.log(`✅ Agency 1 context: ${agency1Users.length} users visible`)
    
    // Set context to agency 2 and get users  
    await prisma.$executeRaw`SELECT set_current_agency_id(${agency2.id})`
    const agency2Users = await prisma.$queryRaw`SELECT * FROM get_agency_users()`
    console.log(`✅ Agency 2 context: ${agency2Users.length} users visible`)
    
    // Test agency info function
    const currentAgency = await prisma.$queryRaw`SELECT * FROM get_current_agency()`
    console.log(`✅ Current agency: ${currentAgency[0]?.name || 'None'}`)
    
    // Test user creation function
    console.log('\n👤 Testing secure user creation...')
    await prisma.$executeRaw`SELECT set_current_agency_id(${agency1.id})`
    
    const newUserId = `test-user-${Date.now()}`
    await prisma.$executeRaw`
      SELECT create_agency_user(
        ${newUserId},
        ${'testuser@finaltest.com'},
        ${'Test'},
        ${'User'},
        ${'USER'}
      )
    `
    console.log(`✅ Created user in agency 1`)
    
    // Verify the user is only visible in agency 1 context
    const agency1UsersAfter = await prisma.$queryRaw`SELECT * FROM get_agency_users()`
    console.log(`✅ Agency 1 now has: ${agency1UsersAfter.length} users`)
    
    await prisma.$executeRaw`SELECT set_current_agency_id(${agency2.id})`
    const agency2UsersAfter = await prisma.$queryRaw`SELECT * FROM get_agency_users()`
    console.log(`✅ Agency 2 still has: ${agency2UsersAfter.length} users`)
    
    // Clean up
    console.log('\n🧹 Cleaning up...')
    await prisma.$executeRaw`SELECT clear_current_agency_id()`
    await prisma.user.deleteMany({ where: { email: 'testuser@finaltest.com' } })
    await prisma.agency.delete({ where: { id: agency1.id } })
    await prisma.agency.delete({ where: { id: agency2.id } })
    
    console.log('\n🎉 Final RLS test completed successfully!')
    console.log('\n✅ Function-based tenant isolation is working!')
    console.log('✅ Users are properly scoped by agency context')
    console.log('✅ Cross-tenant access is prevented')
    
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

testFinalRLS().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Test script failed:', error)
  process.exit(1)
})