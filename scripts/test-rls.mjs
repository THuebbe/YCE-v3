#!/usr/bin/env node

// Test script to validate RLS implementation
// Run with: node scripts/test-rls.mjs

console.log('🔒 YardCard Elite - Row-Level Security Test')
console.log('==========================================\n')

// Since we can't import TypeScript directly, let's run a basic connectivity test
// and provide instructions for running the full test suite

async function basicTest() {
  try {
    // Test if we can load the Prisma client
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    console.log('📋 Basic Database Connectivity Test')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Check if agencies table exists
    try {
      const agencyCount = await prisma.agency.count()
      console.log(`✅ Agencies table exists (${agencyCount} agencies)`)
    } catch (error) {
      console.log('❌ Agencies table missing or inaccessible')
      console.log('   Run the schema migrations first!')
      return false
    }
    
    // Check if users table exists with agencyId
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ Users table exists (${userCount} users)`)
    } catch (error) {
      console.log('❌ Users table missing or schema mismatch')
      console.log('   Run the schema migrations first!')
      return false
    }
    
    // Check if RLS functions exist
    try {
      await prisma.$queryRaw`SELECT get_current_agency_id()`
      console.log('✅ RLS functions are available')
    } catch (error) {
      console.log('❌ RLS functions missing')
      console.log('   Run the RLS migration!')
      return false
    }
    
    await prisma.$disconnect()
    console.log('\n🎉 Basic tests passed! Database schema looks good.')
    
    console.log('\n📝 To run the full RLS test suite:')
    console.log('1. First, make sure you have applied all migrations')
    console.log('2. Then run: npx tsx src/lib/test-rls.ts')
    console.log('   Or install tsx globally: npm i -g tsx')
    
    return true
    
  } catch (error) {
    console.error('❌ Basic test failed:', error.message)
    console.log('\n🔧 Troubleshooting steps:')
    console.log('1. Make sure DATABASE_URL is set correctly')
    console.log('2. Run schema migrations first')
    console.log('3. Run RLS migration')
    return false
  }
}

basicTest().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Test script failed:', error)
  process.exit(1)
})