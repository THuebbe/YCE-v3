// Simple test to check if RLS functions exist and work
const { PrismaClient } = require('@prisma/client')

async function testRLSFunctions() {
  console.log('🔒 Testing RLS Functions')
  console.log('========================\n')
  
  const prisma = new PrismaClient()
  
  try {
    // Test if basic functions exist
    console.log('1. Testing basic functions...')
    
    // Test set_current_agency_id function
    try {
      await prisma.$executeRaw`SELECT set_current_agency_id('test-agency')`
      console.log('✅ set_current_agency_id function works')
    } catch (error) {
      console.log('❌ set_current_agency_id function missing:', error.message)
    }
    
    // Test get_current_agency_id function
    try {
      const result = await prisma.$queryRaw`SELECT get_current_agency_id() as agency_id`
      console.log('✅ get_current_agency_id function works:', result[0]?.agency_id)
    } catch (error) {
      console.log('❌ get_current_agency_id function missing:', error.message)
    }
    
    // Test advanced functions
    console.log('\n2. Testing advanced functions...')
    
    // Test get_agency_users function
    try {
      const users = await prisma.$queryRaw`SELECT * FROM get_agency_users()`
      console.log('✅ get_agency_users function works, returned:', users.length, 'users')
    } catch (error) {
      console.log('❌ get_agency_users function missing:', error.message)
    }
    
    // Test get_current_agency function
    try {
      const agency = await prisma.$queryRaw`SELECT * FROM get_current_agency()`
      console.log('✅ get_current_agency function works, returned:', agency.length, 'agencies')
    } catch (error) {
      console.log('❌ get_current_agency function missing:', error.message)
    }
    
    // Clear context
    await prisma.$executeRaw`SELECT clear_current_agency_id()`
    
    console.log('\n🎉 RLS function test completed!')
    
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

testRLSFunctions().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Test script failed:', error)
  process.exit(1)
})