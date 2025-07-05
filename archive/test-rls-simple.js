// Simple RLS test in JavaScript
const { PrismaClient } = require('@prisma/client')

async function testRLS() {
  console.log('🔒 YardCard Elite - Row-Level Security Test')
  console.log('==========================================\n')
  
  const prisma = new PrismaClient()
  
  try {
    console.log('🏗️  Setting up test data...')
    
    // Clean up any existing test data
    await prisma.$executeRaw`DELETE FROM "users" WHERE email LIKE '%@testcompany.com'`
    await prisma.$executeRaw`DELETE FROM "agencies" WHERE slug LIKE 'test-%'`
    
    // Create test agencies
    const agency1 = await prisma.agency.create({
      data: {
        name: 'Test Company 1',
        slug: 'test-company-1',
        isActive: true
      }
    })
    console.log(`✅ Created agency 1: ${agency1.name} (${agency1.id})`)
    
    const agency2 = await prisma.agency.create({
      data: {
        name: 'Test Company 2', 
        slug: 'test-company-2',
        isActive: true
      }
    })
    console.log(`✅ Created agency 2: ${agency2.name} (${agency2.id})`)
    
    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'user1@testcompany.com',
        firstName: 'User',
        lastName: 'One',
        agencyId: agency1.id,
        role: 'USER'
      }
    })
    
    const user2 = await prisma.user.create({
      data: {
        email: 'user2@testcompany.com',
        firstName: 'User', 
        lastName: 'Two',
        agencyId: agency2.id,
        role: 'USER'
      }
    })
    
    console.log(`✅ Created test users`)
    
    console.log('\n🔒 Testing RLS Policies...')
    
    // Test 1: Set context to agency 1 and query users
    console.log('\n📋 Test 1: User isolation by agency context')
    
    await prisma.$executeRaw`SELECT set_current_agency_id(${agency1.id})`
    const agency1Users = await prisma.user.findMany()
    console.log(`Agency 1 context sees ${agency1Users.length} users`)
    
    const correctUsers1 = agency1Users.filter(u => u.agencyId === agency1.id)
    const leakedUsers1 = agency1Users.filter(u => u.agencyId !== agency1.id)
    
    console.log(`✅ Correct users from agency 1: ${correctUsers1.length}`)
    console.log(`${leakedUsers1.length > 0 ? '❌' : '✅'} Leaked users from other agencies: ${leakedUsers1.length}`)
    
    if (leakedUsers1.length > 0) {
      console.error('🚨 RLS VIOLATION: Users from other agencies are visible!')
      return false
    }
    
    // Test 2: Set context to agency 2 and query users
    await prisma.$executeRaw`SELECT set_current_agency_id(${agency2.id})`
    const agency2Users = await prisma.user.findMany()
    console.log(`Agency 2 context sees ${agency2Users.length} users`)
    
    const correctUsers2 = agency2Users.filter(u => u.agencyId === agency2.id)
    const leakedUsers2 = agency2Users.filter(u => u.agencyId !== agency2.id)
    
    console.log(`✅ Correct users from agency 2: ${correctUsers2.length}`)
    console.log(`${leakedUsers2.length > 0 ? '❌' : '✅'} Leaked users from other agencies: ${leakedUsers2.length}`)
    
    if (leakedUsers2.length > 0) {
      console.error('🚨 RLS VIOLATION: Users from other agencies are visible!')
      return false
    }
    
    // Test 3: Test agency isolation
    console.log('\n📋 Test 2: Agency isolation')
    
    await prisma.$executeRaw`SELECT set_current_agency_id(${agency1.id})`
    const visibleAgencies1 = await prisma.agency.findMany()
    console.log(`Agency 1 context sees ${visibleAgencies1.length} agencies`)
    
    if (visibleAgencies1.length !== 1 || visibleAgencies1[0].id !== agency1.id) {
      console.error('🚨 RLS VIOLATION: Agency isolation failed!')
      return false
    }
    
    await prisma.$executeRaw`SELECT set_current_agency_id(${agency2.id})`
    const visibleAgencies2 = await prisma.agency.findMany()
    console.log(`Agency 2 context sees ${visibleAgencies2.length} agencies`)
    
    if (visibleAgencies2.length !== 1 || visibleAgencies2[0].id !== agency2.id) {
      console.error('🚨 RLS VIOLATION: Agency isolation failed!')
      return false
    }
    
    console.log('✅ Agency isolation working correctly')
    
    // Test 4: Test cross-tenant operation prevention
    console.log('\n📋 Test 3: Cross-tenant operation prevention')
    
    try {
      // Set context to agency 1
      await prisma.$executeRaw`SELECT set_current_agency_id(${agency1.id})`
      
      // Try to update user from agency 2 (should fail)
      await prisma.user.update({
        where: { id: user2.id },
        data: { firstName: 'HACKED' }
      })
      
      console.error('🚨 RLS VIOLATION: Cross-tenant update succeeded!')
      return false
    } catch (error) {
      console.log('✅ Cross-tenant update correctly blocked')
    }
    
    console.log('\n🎉 All RLS tests passed! Row-Level Security is working correctly.')
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    await prisma.$executeRaw`SELECT clear_current_agency_id()`
    await prisma.$executeRaw`DELETE FROM "users" WHERE email LIKE '%@testcompany.com'`
    await prisma.$executeRaw`DELETE FROM "agencies" WHERE slug LIKE 'test-%'`
    console.log('✅ Test data cleaned up')
    
    return true
    
  } catch (error) {
    console.error('❌ RLS Test Error:', error)
    
    // Clean up on error
    try {
      await prisma.$executeRaw`SELECT clear_current_agency_id()`
      await prisma.$executeRaw`DELETE FROM "users" WHERE email LIKE '%@testcompany.com'`
      await prisma.$executeRaw`DELETE FROM "agencies" WHERE slug LIKE 'test-%'`
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError)
    }
    
    return false
  } finally {
    await prisma.$disconnect()
  }
}

testRLS().then(success => {
  if (success) {
    console.log('\n🔐 RLS Implementation: SECURE ✅')
    process.exit(0)
  } else {
    console.log('\n⚠️  RLS Implementation: NEEDS ATTENTION ❌')
    process.exit(1)
  }
}).catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})