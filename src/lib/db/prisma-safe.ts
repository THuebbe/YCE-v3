// Safe Prisma client that handles build environment issues
let prisma: any

declare global {
  var __globalPrisma__: any | undefined
}

if (process.env.NODE_ENV === 'production') {
  try {
    // @ts-expect-error Prisma client types may not be available during build
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client')
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
  } catch (error) {
    console.warn('Prisma client not available in build environment:', error)
    // Create a mock client for build time
    prisma = {
      $transaction: () => Promise.resolve({}),
      $executeRawUnsafe: () => Promise.resolve(),
      $queryRawUnsafe: () => Promise.resolve([]),
      $disconnect: () => Promise.resolve(),
    }
  }
} else {
  try {
    // @ts-expect-error Prisma client types may not be available during build
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client')
    
    prisma = globalThis.__globalPrisma__ ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
    
    if (process.env.NODE_ENV !== 'production') {
      globalThis.__globalPrisma__ = prisma
    }
  } catch (error) {
    console.warn('Prisma client not available:', error)
    // Create a mock client for development
    prisma = {
      $transaction: () => Promise.resolve({}),
      $executeRawUnsafe: () => Promise.resolve(),
      $queryRawUnsafe: () => Promise.resolve([]),
      $disconnect: () => Promise.resolve(),
    }
  }
}

export { prisma }
export default prisma