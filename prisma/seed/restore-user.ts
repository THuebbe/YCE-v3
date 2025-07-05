import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreUser() {
  console.log('🔄 Restoring user access...');
  
  try {
    // Create your agency first
    const agency = await prisma.agency.create({
      data: {
        name: 'YardCard Elite West Branch',
        slug: 'yardcard-elite-west-branch',
        subdomain: 'yardcard-elite-west-branch',
        city: 'Your City',
        businessName: 'YardCard Elite West Branch LLC',
        agencyCode: 'AG004',
        email: 'admin@yardcard-elite-west-branch.com',
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

    // Create your user record
    const user = await prisma.user.create({
      data: {
        email: 'admin@yardcard-elite-west-branch.com', // You can update this later
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        agencyId: agency.id,
        clerkUserId: 'user_2vHceGPgDVopU89JYlmrt5jL0ha', // The user ID from your middleware
        emailVerified: new Date()
      }
    });

    console.log('✅ User and agency restored successfully!');
    console.log(`🏢 Agency: ${agency.name} (${agency.slug})`);
    console.log(`👤 User: ${user.email} (${user.role})`);
    console.log(`🔗 Dashboard URL: http://yardcard-elite-west-branch.localhost:3000/dashboard`);
    
  } catch (error) {
    console.error('❌ Error restoring user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreUser().catch((e) => {
  console.error(e);
  process.exit(1);
});