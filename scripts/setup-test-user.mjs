import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupTestUser() {
  console.log('Setting up test user...')
  
  try {
    // First, let's see what agencies exist
    const agencies = await prisma.agency.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { users: true }
        }
      }
    })
    
    console.log('Available agencies:')
    agencies.forEach(agency => {
      console.log(`- ${agency.name} (${agency.slug}) - ${agency._count.users} users`)
    })
    
    // Let's see what users exist
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        agencyId: true,
        agency: {
          select: { name: true, slug: true }
        }
      }
    })
    
    console.log('\nExisting users:')
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) in ${user.agency.name}`)
    })
    
    console.log('\n=== SETUP INSTRUCTIONS ===')
    console.log('1. Copy your Clerk user ID from the browser console when logged in')
    console.log('2. Copy your email address from Clerk')
    console.log('3. Choose which agency to join (or create one)')
    console.log('4. Run this script with user details')
    console.log('\nExample: node scripts/setup-test-user.mjs add user_xxx your@email.com "Your Name" ADMIN agency_id')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function addUser(clerkId, email, name, role, agencyId) {
  try {
    const [firstName, ...lastNameParts] = name.split(' ')
    const lastName = lastNameParts.join(' ') || null
    
    const user = await prisma.user.create({
      data: {
        id: clerkId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        agencyId: agencyId
      }
    })
    
    console.log('✅ User created successfully!')
    console.log(`- ID: ${user.id}`)
    console.log(`- Email: ${user.email}`)
    console.log(`- Role: ${user.role}`)
    console.log(`- Name: ${user.firstName} ${user.lastName}`)
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message)
  }
}

// Parse command line arguments
const [,, action, clerkId, email, name, role, agencyId] = process.argv

if (action === 'add' && clerkId && email && name && role && agencyId) {
  await addUser(clerkId, email, name, role, agencyId)
  await prisma.$disconnect()
} else {
  await setupTestUser()
}