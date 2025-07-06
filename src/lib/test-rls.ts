// Test script for Row-Level Security (RLS) policies
// This script validates that tenant isolation is working correctly

import { getTenantPrismaClient, prisma } from './db/prisma'

// Test data for validation
const TEST_AGENCIES = [
  { name: 'Green Thumb Lawn Care', slug: 'greenthumb' },
  { name: 'Lawn Masters Pro', slug: 'lawnmasters' }
]

const TEST_USERS = [
  { email: 'john@greenthumb.com', firstName: 'John', lastName: 'Doe' },
  { email: 'jane@greenthumb.com', firstName: 'Jane', lastName: 'Smith' },
  { email: 'bob@lawnmasters.com', firstName: 'Bob', lastName: 'Wilson' },
  { email: 'alice@lawnmasters.com', firstName: 'Alice', lastName: 'Johnson' }
]

export async function setupTestData() {
  console.log('🏗️  Setting up test data...')
  
  // Clear existing test data
  await prisma.$executeRaw`DELETE FROM "users" WHERE email LIKE '%@greenthumb.com' OR email LIKE '%@lawnmasters.com'`
  await prisma.$executeRaw`DELETE FROM "agencies" WHERE slug IN ('greenthumb', 'lawnmasters')`
  
  // Create test agencies
  const agencies = []
  for (const agencyData of TEST_AGENCIES) {
    const agency = await prisma.agency.create({
      data: {
        ...agencyData,
        isActive: true
      }
    })
    agencies.push(agency)
    console.log(`✅ Created agency: ${agency.name} (${agency.id})`)
  }
  
  // Create test users for each agency
  for (let i = 0; i < agencies.length; i++) {
    const agency = agencies[i]
    const usersForAgency = TEST_USERS.slice(i * 2, (i + 1) * 2)
    
    // Set agency context and use secure function
    const agencyClient = getTenantPrismaClient(agency.id)
    
    for (const userData of usersForAgency) {
      const user = await agencyClient.createAgencyUser({
        id: `test-${userData.email.split('@')[0]}-${agency.id}`,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'USER'
      })
      console.log(`✅ Created user: ${userData.email} for ${agency.name}`)
    }
  }
  
  return agencies
}

export async function testRLSPolicies() {
  console.log('\n🔒 Testing RLS Policies...')
  
  const agencies = await setupTestData()
  const [agency1, agency2] = agencies
  
  // Test 1: Verify tenant isolation for users
  console.log('\n📋 Test 1: User Tenant Isolation')
  
  const client1 = getTenantPrismaClient(agency1.id)
  const client2 = getTenantPrismaClient(agency2.id)
  
  // Client 1 should only see users from agency 1 using secure functions
  const users1 = await client1.getAgencyUsers()
  console.log(`Agency 1 (${agency1.name}) sees ${users1.length} users`)
  
  const agency1Users = users1.filter(u => u.agencyId === agency1.id)
  const agency2UsersSeenByClient1 = users1.filter(u => u.agencyId === agency2.id)
  
  console.log(`✅ Correct users: ${agency1Users.length}`)
  console.log(`❌ Leaked users: ${agency2UsersSeenByClient1.length}`)
  
  if (agency2UsersSeenByClient1.length > 0) {
    console.error('🚨 RLS VIOLATION: Client 1 can see users from other agencies!')
    return false
  }
  
  // Client 2 should only see users from agency 2 using secure functions
  const users2 = await client2.getAgencyUsers()
  console.log(`Agency 2 (${agency2.name}) sees ${users2.length} users`)
  
  const agency2Users = users2.filter(u => u.agencyId === agency2.id)
  const agency1UsersSeenByClient2 = users2.filter(u => u.agencyId === agency1.id)
  
  console.log(`✅ Correct users: ${agency2Users.length}`)
  console.log(`❌ Leaked users: ${agency1UsersSeenByClient2.length}`)
  
  if (agency1UsersSeenByClient2.length > 0) {
    console.error('🚨 RLS VIOLATION: Client 2 can see users from other agencies!')
    return false
  }
  
  // Test 2: Verify cross-tenant operations fail
  console.log('\n📋 Test 2: Cross-Tenant Operation Prevention')
  
  try {
    // Try to update a user from agency 2 using agency 1's client
    const agency2User = await prisma.user.findFirst({
      where: { agencyId: agency2.id }
    })
    
    if (agency2User) {
      // Try to update using secure function - should fail because user not in agency 1
      const result = await client1.updateAgencyUser(agency2User.id, {
        firstName: 'HACKED'
      })
      
      console.error('🚨 RLS VIOLATION: Cross-tenant update succeeded!')
      return false
    }
  } catch (error) {
    console.log('✅ Cross-tenant update correctly blocked')
  }
  
  // Test 3: Verify agency isolation
  console.log('\n📋 Test 3: Agency Isolation')
  
  // Client should only see their own agency
  const agencies1 = await (client1 as any).agency.findMany()
  const agencies2 = await (client2 as any).agency.findMany()
  
  console.log(`Client 1 sees ${agencies1.length} agencies`)
  console.log(`Client 2 sees ${agencies2.length} agencies`)
  
  if (agencies1.length !== 1 || agencies1[0].id !== agency1.id) {
    console.error('🚨 RLS VIOLATION: Agency isolation failed for client 1!')
    return false
  }
  
  if (agencies2.length !== 1 || agencies2[0].id !== agency2.id) {
    console.error('🚨 RLS VIOLATION: Agency isolation failed for client 2!')
    return false
  }
  
  console.log('✅ Agency isolation working correctly')
  
  // Test 4: Verify context switching
  console.log('\n📋 Test 4: Context Switching')
  
  const multiClient = getTenantPrismaClient(agency1.id)
  
  // Should see agency 1 users using secure functions
  const usersBeforeSwitch = await multiClient.getAgencyUsers()
  console.log(`Before switch: ${usersBeforeSwitch.length} users`)
  
  // Switch context to agency 2
  await multiClient.setAgencyContext(agency2.id)
  const usersAfterSwitch = await multiClient.getAgencyUsers()
  console.log(`After switch: ${usersAfterSwitch.length} users`)
  
  // Verify the users are from different agencies
  const beforeAgencies = [...new Set(usersBeforeSwitch.map(u => u.agencyId))]
  const afterAgencies = [...new Set(usersAfterSwitch.map(u => u.agencyId))]
  
  if (beforeAgencies.length === 1 && afterAgencies.length === 1 && 
      beforeAgencies[0] !== afterAgencies[0]) {
    console.log('✅ Context switching working correctly')
  } else {
    console.error('🚨 Context switching failed!')
    return false
  }
  
  console.log('\n🎉 All RLS tests passed! Tenant isolation is working correctly.')
  return true
}

export async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...')
  
  await prisma.$executeRaw`DELETE FROM "users" WHERE email LIKE '%@greenthumb.com' OR email LIKE '%@lawnmasters.com'`
  await prisma.$executeRaw`DELETE FROM "agencies" WHERE slug IN ('greenthumb', 'lawnmasters')`
  
  console.log('✅ Test data cleaned up')
}

// Main test function
export async function runRLSTests() {
  try {
    const success = await testRLSPolicies()
    await cleanupTestData()
    
    if (success) {
      console.log('\n🔐 RLS Implementation: SECURE ✅')
    } else {
      console.log('\n⚠️  RLS Implementation: NEEDS ATTENTION ❌')
    }
    
    return success
  } catch (error) {
    console.error('❌ RLS Test Error:', error)
    await cleanupTestData()
    return false
  }
}