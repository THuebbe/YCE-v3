import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testAuthFlow() {
  console.log('🧪 Testing full authentication flow...');
  
  const targetEmail = 'thuebbe.coding@gmail.com';
  const targetClerkId = 'user_2vHceGPgDVopU89JYlmrt5jL0ha';
  
  try {
    // Step 1: Simulate getCurrentTenant()
    const hostname = 'yardcard-elite-west-branch.localhost:3000';
    const subdomain = hostname.split(':')[0].split('.')[0];
    
    const agency = await prisma.agency.findFirst({
      where: {
        slug: subdomain,
        isActive: true
      }
    });
    
    console.log('📍 Step 1 - Tenant resolution:', agency ? `✅ ${agency.name}` : '❌ No agency');
    
    if (!agency) {
      return;
    }
    
    // Step 2: Find user by email in this agency
    const userByEmail = await prisma.user.findFirst({
      where: {
        email: targetEmail,
        agencyId: agency.id
      }
    });
    
    console.log('📧 Step 2 - User by email:', userByEmail ? `✅ ${userByEmail.email}` : '❌ No user');
    
    // Step 3: Find user by Clerk ID in this agency  
    const userByClerkId = await prisma.user.findFirst({
      where: {
        clerkUserId: targetClerkId,
        agencyId: agency.id
      }
    });
    
    console.log('🆔 Step 3 - User by Clerk ID:', userByClerkId ? `✅ ${userByClerkId.email}` : '❌ No user');
    
    // Step 4: Check all users in agency
    const allAgencyUsers = await prisma.user.findMany({
      where: {
        agencyId: agency.id
      }
    });
    
    console.log('👥 Step 4 - All agency users:');
    allAgencyUsers.forEach(user => {
      console.log(`   - ${user.email} | ClerkID: ${user.clerkUserId} | Role: ${user.role}`);
    });
    
    // Test the exact logic from getCurrentAuthenticatedUser
    console.log('\n🔬 Testing exact auth logic...');
    
    const directUsers = await prisma.user.findMany({
      where: { agencyId: agency.id }
    });
    
    const clerkUserEmail = targetEmail; // This would come from clerkUser.emailAddresses[0]?.emailAddress
    const dbUser = directUsers.find(user => user.email === clerkUserEmail);
    
    console.log('🎯 Direct lookup result:', dbUser ? `✅ Found user: ${dbUser.email}` : '❌ No match');
    
    if (dbUser) {
      console.log('✅ Authentication should work!');
      console.log(`   User: ${dbUser.firstName} ${dbUser.lastName}`);
      console.log(`   Role: ${dbUser.role}`);
      console.log(`   Agency: ${agency.name}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthFlow();