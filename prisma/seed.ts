import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test agencies
  const greenThumbAgency = await prisma.agency.upsert({
    where: { slug: 'greenthumb' },
    update: {},
    create: {
      name: 'Green Thumb Lawn Care',
      slug: 'greenthumb',
      isActive: true,
    },
  })

  const lawnmastersAgency = await prisma.agency.upsert({
    where: { slug: 'lawnmasters' },
    update: {},
    create: {
      name: 'Lawn Masters Pro',
      slug: 'lawnmasters',
      isActive: true,
    },
  })

  const inactiveAgency = await prisma.agency.upsert({
    where: { slug: 'inactive' },
    update: {},
    create: {
      name: 'Inactive Lawn Service',
      slug: 'inactive',
      isActive: false,
    },
  })

  console.log({ greenThumbAgency, lawnmastersAgency, inactiveAgency })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })