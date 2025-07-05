import { createClerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

const prisma = new PrismaClient();

// Configuration
const TARGET_ORG_ID = 'org_2z6Uq6UQqpoGuZnDQEOg9Eh7ZoR';
const SPECIFIC_USER_ID = 'user_2vHceGPgDVopU89JYlmrt5jL0ha';

// Test users to create in Clerk (with known passwords)
const TEST_USERS = [
  {
    email: 'admin@elite-denver.com',
    password: 'TestPass123!',
    firstName: 'Admin',
    lastName: 'Denver',
    role: 'ADMIN'
  },
  {
    email: 'manager@elite-denver.com',
    password: 'TestPass123!',
    firstName: 'Manager',
    lastName: 'Denver',
    role: 'MANAGER'
  },
  {
    email: 'admin@sunny-signs-ca.com',
    password: 'TestPass123!',
    firstName: 'Admin',
    lastName: 'California',
    role: 'ADMIN'
  },
  {
    email: 'manager@sunny-signs-ca.com',
    password: 'TestPass123!',
    firstName: 'Manager',
    lastName: 'California',
    role: 'MANAGER'
  },
  {
    email: 'admin@texas-signs.com',
    password: 'TestPass123!',
    firstName: 'Admin',
    lastName: 'Texas',
    role: 'ADMIN'
  },
  {
    email: 'manager@texas-signs.com',
    password: 'TestPass123!',
    firstName: 'Manager',
    lastName: 'Texas',
    role: 'MANAGER'
  }
];

interface UserCredentials {
  email: string;
  password: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  role: string;
  agencyName?: string;
  dashboardUrl?: string;
}

async function getExistingClerkUser() {
  console.log('🔍 Fetching your existing Clerk user...');
  
  try {
    const user = await clerkClient.users.getUser(SPECIFIC_USER_ID);
    console.log(`✅ Found existing user: ${user.emailAddresses[0]?.emailAddress} (${user.id})`);
    return user;
  } catch (error) {
    console.error('❌ Error fetching existing user:', error);
    return null;
  }
}

async function getOrganizationMembers() {
  console.log('👥 Fetching organization members...');
  
  try {
    const members = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: TARGET_ORG_ID
    });
    
    console.log(`✅ Found ${members.totalCount} organization members`);
    return members.data;
  } catch (error) {
    console.error('❌ Error fetching organization members:', error);
    return [];
  }
}

async function createTestUsersInClerk() {
  console.log('👤 Creating test users in Clerk...');
  
  const createdUsers = [];
  
  for (const userData of TEST_USERS) {
    try {
      // Check if user already exists
      const existingUsers = await clerkClient.users.getUserList({
        emailAddress: [userData.email]
      });
      
      if (existingUsers.data.length > 0) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        createdUsers.push({
          ...userData,
          clerkUserId: existingUsers.data[0].id
        });
        continue;
      }
      
      // Create new user
      const user = await clerkClient.users.createUser({
        emailAddress: [userData.email],
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        skipPasswordChecks: true
      });
      
      console.log(`✅ Created user: ${userData.email} (${user.id})`);
      
      createdUsers.push({
        ...userData,
        clerkUserId: user.id
      });
      
      // Add to organization
      try {
        await clerkClient.organizations.createOrganizationMembership({
          organizationId: TARGET_ORG_ID,
          userId: user.id,
          role: userData.role.toLowerCase()
        });
        console.log(`✅ Added ${userData.email} to organization`);
      } catch (orgError) {
        console.log(`⚠️  Could not add ${userData.email} to organization (may not exist or permission issue)`);
      }
      
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }
  
  return createdUsers;
}

async function syncUsersToDatabase(allUsers: any[], agencies: any[]) {
  console.log('🔄 Syncing users to database...');
  
  // Clear existing users
  await prisma.user.deleteMany();
  
  const agencyMap = {
    'elite-denver': agencies.find(a => a.slug === 'elite-denver'),
    'sunny-signs-ca': agencies.find(a => a.slug === 'sunny-signs-ca'),
    'texas-signs': agencies.find(a => a.slug === 'texas-signs'),
    'yardcard-elite-west-branch': agencies.find(a => a.slug === 'yardcard-elite-west-branch')
  };
  
  const syncedUsers = [];
  
  for (const userData of allUsers) {
    let agencyId;
    let role = 'USER';
    
    // Determine agency based on email domain or specific user ID
    if (userData.clerkUserId === SPECIFIC_USER_ID) {
      // Your specific user - create agency if it doesn't exist
      if (!agencyMap['yardcard-elite-west-branch']) {
        // Check if agency already exists, if so update it
        let userAgency = await prisma.agency.findFirst({
          where: { slug: 'yardcard-elite-west-branch' }
        });
        
        if (!userAgency) {
          userAgency = await prisma.agency.create({
            data: {
              name: 'YardCard Elite West Branch',
              slug: 'yardcard-elite-west-branch',
              subdomain: 'yardcard-elite-west-branch',
              city: 'Your City',
              businessName: 'YardCard Elite West Branch LLC',
              agencyCode: 'AG004',
              email: userData.email,
              phone: '(555) 123-4567',
              address: {
                street: '123 Main Street',
                city: 'Your City',
                state: 'ST',
                zip: '12345'
              },
              orderCounter: 0,
              isActive: true,
              description: 'Your personal YardCard Elite agency',
              subscriptionStatus: 'active',
              subscriptionStartDate: new Date(),
              stripeConnectStatus: 'pending',
              pricingConfig: {
                basePrice: 95,
                extraDayPrice: 10,
                lateFee: 25
              }
            }
          });
        } else {
          // Update existing agency name to be consistent
          userAgency = await prisma.agency.update({
            where: { id: userAgency.id },
            data: {
              name: 'YardCard Elite West Branch'
            }
          });
        }
        agencyMap['yardcard-elite-west-branch'] = userAgency;
      }
      agencyId = agencyMap['yardcard-elite-west-branch'].id;
      role = 'ADMIN';
    } else if (userData.email.includes('elite-denver')) {
      agencyId = agencyMap['elite-denver']?.id;
      role = userData.role || (userData.email.includes('admin') ? 'ADMIN' : 'MANAGER');
    } else if (userData.email.includes('sunny-signs-ca')) {
      agencyId = agencyMap['sunny-signs-ca']?.id;
      role = userData.role || (userData.email.includes('admin') ? 'ADMIN' : 'MANAGER');
    } else if (userData.email.includes('texas-signs')) {
      agencyId = agencyMap['texas-signs']?.id;
      role = userData.role || (userData.email.includes('admin') ? 'ADMIN' : 'MANAGER');
    } else {
      // Default to first agency
      agencyId = agencies[0]?.id;
    }
    
    if (!agencyId) {
      console.log(`⚠️  No agency found for user ${userData.email}, skipping...`);
      continue;
    }
    
    try {
      const user = await prisma.user.create({
        data: {
          id: userData.clerkUserId, // Use Clerk user ID as primary key
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: role as any,
          agencyId,
          clerkUserId: userData.clerkUserId,
          emailVerified: new Date()
        }
      });
      
      syncedUsers.push({
        ...userData,
        databaseId: user.id,
        agencyName: Object.entries(agencyMap).find(([_, agency]) => agency?.id === agencyId)?.[1]?.name,
        dashboardUrl: `http://${Object.entries(agencyMap).find(([_, agency]) => agency?.id === agencyId)?.[0]}.localhost:3000/dashboard`
      });
      
      console.log(`✅ Synced user: ${userData.email} to ${user.role} role`);
    } catch (error) {
      console.error(`❌ Error syncing user ${userData.email}:`, error);
    }
  }
  
  return syncedUsers;
}

async function generateCredentialsFile(users: UserCredentials[]) {
  console.log('📝 Generating credentials file...');
  
  const credentialsData = {
    generated: new Date().toISOString(),
    testUsers: users.map(user => ({
      email: user.email,
      password: user.password,
      clerkUserId: user.clerkUserId,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      agencyName: user.agencyName,
      dashboardUrl: user.dashboardUrl
    }))
  };
  
  const credentialsPath = path.join(process.cwd(), 'test-credentials.json');
  fs.writeFileSync(credentialsPath, JSON.stringify(credentialsData, null, 2));
  
  console.log(`✅ Credentials saved to: ${credentialsPath}`);
  return credentialsPath;
}

async function main() {
  console.log('🚀 Starting Clerk user sync process...');
  
  try {
    // Get existing agencies
    const agencies = await prisma.agency.findMany();
    
    // Get your existing user
    const existingUser = await getExistingClerkUser();
    
    // Get organization members
    const orgMembers = await getOrganizationMembers();
    
    // Create test users in Clerk
    const createdUsers = await createTestUsersInClerk();
    
    // Combine all users
    const allUsers = [];
    
    // Add your existing user
    if (existingUser) {
      allUsers.push({
        email: existingUser.emailAddresses[0]?.emailAddress || 'unknown@email.com',
        password: 'Your existing password',
        clerkUserId: existingUser.id,
        firstName: existingUser.firstName || 'Admin',
        lastName: existingUser.lastName || 'User',
        role: 'ADMIN'
      });
    }
    
    // Add organization members
    for (const member of orgMembers) {
      if (member.publicUserData) {
        allUsers.push({
          email: member.publicUserData.identifier || 'unknown@email.com',
          password: 'Unknown (existing user)',
          clerkUserId: member.publicUserData.userId,
          firstName: member.publicUserData.firstName || 'User',
          lastName: member.publicUserData.lastName || 'Member',
          role: member.role.toUpperCase()
        });
      }
    }
    
    // Add created test users
    allUsers.push(...createdUsers);
    
    // Sync to database
    const syncedUsers = await syncUsersToDatabase(allUsers, agencies);
    
    // Generate credentials file
    const credentialsPath = await generateCredentialsFile(syncedUsers);
    
    console.log('\n🎉 Sync completed successfully!');
    console.log(`\n📋 Summary:`);
    console.log(`   • ${syncedUsers.length} users synced to database`);
    console.log(`   • Credentials saved to: ${credentialsPath}`);
    console.log(`\n🔗 Your dashboard: http://yardcard-elite-west-branch.localhost:3000/dashboard`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});