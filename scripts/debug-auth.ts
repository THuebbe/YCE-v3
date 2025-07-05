import { createClerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

const prisma = new PrismaClient();

async function debugAuth() {
  console.log('🔍 Debugging authentication issue...');
  
  const targetUserId = 'user_2vHceGPgDVopU89JYlmrt5jL0ha';
  
  try {
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(targetUserId);
    console.log('📧 Clerk user email:', clerkUser.emailAddresses[0]?.emailAddress);
    
    // Get users from database
    const dbUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: clerkUser.emailAddresses[0]?.emailAddress },
          { clerkUserId: targetUserId }
        ]
      },
      include: {
        agency: true
      }
    });
    
    console.log('📊 Database users found:', dbUsers.length);
    dbUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.clerkUserId}) → ${user.agency.name}`);
    });
    
    // Get agencies
    const agencies = await prisma.agency.findMany({
      where: {
        slug: 'yardcard-elite-west-branch'
      }
    });
    
    console.log('🏢 Agencies found:', agencies.length);
    agencies.forEach(agency => {
      console.log(`   - ${agency.name} (${agency.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();