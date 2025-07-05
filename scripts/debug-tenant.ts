import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

// Simulate the getCurrentTenant function manually
async function debugTenant() {
  console.log('🔍 Debugging tenant resolution...');
  
  const hostname = 'yardcard-elite-west-branch.localhost:3000';
  
  // Extract subdomain
  const hostWithoutPort = hostname.split(':')[0];
  const parts = hostWithoutPort.split('.');
  const subdomain = parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : null;
  
  console.log('🌐 Hostname:', hostname);
  console.log('🏷️ Subdomain:', subdomain);
  
  if (subdomain) {
    // Look up agency by slug (subdomain)
    const agency = await prisma.agency.findFirst({
      where: {
        slug: subdomain,
        isActive: true
      }
    });
    
    if (agency) {
      console.log('🏢 Found agency:', {
        id: agency.id,
        name: agency.name,
        slug: agency.slug
      });
      
      // Check users in this agency
      const users = await prisma.user.findMany({
        where: {
          agencyId: agency.id
        }
      });
      
      console.log('👥 Users in agency:', users.length);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.clerkUserId})`);
      });
      
      return agency.id;
    } else {
      console.log('❌ No agency found for subdomain:', subdomain);
    }
  }
  
  await prisma.$disconnect();
}

debugTenant();