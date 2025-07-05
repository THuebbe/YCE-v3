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

// Test users with phone numbers (required by your Clerk instance)
const TEST_USERS = [
  {
    email: 'admin@elite-denver.com',
    password: 'TestPass123!',
    phoneNumber: '+15551234567',
    firstName: 'Admin',
    lastName: 'Denver',
    role: 'ADMIN',
    agencySlug: 'elite-denver'
  },
  {
    email: 'manager@elite-denver.com',
    password: 'TestPass123!',
    phoneNumber: '+15551234568',
    firstName: 'Manager',
    lastName: 'Denver',
    role: 'MANAGER',
    agencySlug: 'elite-denver'
  },
  {
    email: 'admin@sunny-signs-ca.com',
    password: 'TestPass123!',
    phoneNumber: '+15551234569',
    firstName: 'Admin',
    lastName: 'California',
    role: 'ADMIN',
    agencySlug: 'sunny-signs-ca'
  },
  {
    email: 'manager@sunny-signs-ca.com',
    password: 'TestPass123!',
    phoneNumber: '+15551234570',
    firstName: 'Manager',
    lastName: 'California',
    role: 'MANAGER',
    agencySlug: 'sunny-signs-ca'
  },
  {
    email: 'admin@texas-signs.com',
    password: 'TestPass123!',
    phoneNumber: '+15551234571',
    firstName: 'Admin',
    lastName: 'Texas',
    role: 'ADMIN',
    agencySlug: 'texas-signs'
  },
  {
    email: 'manager@texas-signs.com',
    password: 'TestPass123!',
    phoneNumber: '+15551234572',
    firstName: 'Manager',
    lastName: 'Texas',
    role: 'MANAGER',
    agencySlug: 'texas-signs'
  }
];

async function createTestUsers() {
  console.log('👤 Creating test users in Clerk...');
  
  const createdUsers = [];
  
  // Get existing agencies
  const agencies = await prisma.agency.findMany();
  const agencyMap = agencies.reduce((acc, agency) => {
    acc[agency.slug] = agency;
    return acc;
  }, {} as any);
  
  for (const userData of TEST_USERS) {
    try {
      // Check if user already exists
      const existingUsers = await clerkClient.users.getUserList({
        emailAddress: [userData.email]
      });
      
      if (existingUsers.data.length > 0) {
        console.log(`⚠️  User ${userData.email} already exists in Clerk`);
        createdUsers.push({
          ...userData,
          clerkUserId: existingUsers.data[0].id,
          status: 'existing'
        });
        continue;
      }
      
      // Create new user in Clerk
      const user = await clerkClient.users.createUser({
        emailAddress: [userData.email],
        phoneNumber: [userData.phoneNumber],
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        skipPasswordChecks: true
      });
      
      console.log(`✅ Created user in Clerk: ${userData.email} (${user.id})`);
      
      // Add user to database
      const agency = agencyMap[userData.agencySlug];
      if (agency) {
        await prisma.user.create({
          data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role as any,
            agencyId: agency.id,
            clerkUserId: user.id,
            emailVerified: new Date()
          }
        });
        
        console.log(`✅ Added user to database: ${userData.email} → ${agency.name}`);
      }
      
      createdUsers.push({
        ...userData,
        clerkUserId: user.id,
        status: 'created'
      });
      
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
      createdUsers.push({
        ...userData,
        clerkUserId: null,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return createdUsers;
}

async function generateCredentialsFile(users: any[]) {
  console.log('📝 Generating test credentials file...');
  
  const credentialsData = {
    generated: new Date().toISOString(),
    note: "Test user credentials for development",
    testUsers: users.map(user => ({
      email: user.email,
      password: user.password,
      phoneNumber: user.phoneNumber,
      clerkUserId: user.clerkUserId,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      agencySlug: user.agencySlug,
      dashboardUrl: `http://${user.agencySlug}.localhost:3000/dashboard`,
      status: user.status
    }))
  };
  
  const credentialsPath = path.join(process.cwd(), 'test-users-credentials.json');
  fs.writeFileSync(credentialsPath, JSON.stringify(credentialsData, null, 2));
  
  console.log(`✅ Test credentials saved to: ${credentialsPath}`);
  return credentialsPath;
}

async function main() {
  console.log('🚀 Creating test users for existing agencies...');
  
  try {
    const users = await createTestUsers();
    const credentialsPath = await generateCredentialsFile(users);
    
    const successCount = users.filter(u => u.status === 'created').length;
    const existingCount = users.filter(u => u.status === 'existing').length;
    const failedCount = users.filter(u => u.status === 'failed').length;
    
    console.log('\n🎉 Test user creation completed!');
    console.log(`\n📋 Summary:`);
    console.log(`   • ${successCount} users created successfully`);
    console.log(`   • ${existingCount} users already existed`);
    console.log(`   • ${failedCount} users failed to create`);
    console.log(`   • Credentials saved to: ${credentialsPath}`);
    
    if (successCount > 0) {
      console.log('\n🔗 Test Dashboard URLs:');
      console.log('   • http://elite-denver.localhost:3000/dashboard');
      console.log('   • http://sunny-signs-ca.localhost:3000/dashboard');
      console.log('   • http://texas-signs.localhost:3000/dashboard');
    }
    
  } catch (error) {
    console.error('❌ Test user creation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});