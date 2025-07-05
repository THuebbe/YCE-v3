// Check the actual database schema
const { PrismaClient } = require('@prisma/client')

async function checkSchema() {
  const prisma = new PrismaClient()
  
  try {
    console.log('📋 Checking database schema...\n')
    
    // Check users table columns
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `
    
    console.log('👤 Users table columns:')
    userColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
    })
    
    // Check agencies table columns
    const agencyColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'agencies' 
      ORDER BY ordinal_position
    `
    
    console.log('\n🏢 Agencies table columns:')
    agencyColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
    })
    
    // Check constraints
    const constraints = await prisma.$queryRaw`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name IN ('users', 'agencies')
    `
    
    console.log('\n🔗 Constraints:')
    constraints.forEach(constraint => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`)
    })
    
  } catch (error) {
    console.error('Error checking schema:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()