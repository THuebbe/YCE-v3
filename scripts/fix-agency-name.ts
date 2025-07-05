import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAgencyName() {
  console.log('🔧 Fixing agency name...');
  
  const agency = await prisma.agency.update({
    where: {
      slug: 'yardcard-elite-west-branch'
    },
    data: {
      name: 'YardCard Elite West Branch'
    }
  });
  
  console.log('✅ Updated agency:', agency.name);
  
  await prisma.$disconnect();
}

fixAgencyName();