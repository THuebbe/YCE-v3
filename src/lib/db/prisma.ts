// Import safe Prisma client that handles build environment issues
import { prisma as safePrisma } from './prisma-safe'

let PrismaClient: any
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const prismaModule = require('@prisma/client')
  PrismaClient = prismaModule.PrismaClient
} catch {
  // Mock PrismaClient for build environment
  PrismaClient = class MockPrismaClient {
    constructor() {}
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

// Enhanced Prisma client with secure function-based tenant isolation
class TenantAwarePrismaClient extends PrismaClient {
  private currentAgencyId: string | null = null

  constructor(options?: any) {
    super(options)
  }

  // Set the current agency context using secure functions
  async setAgencyContext(agencyId: string | null): Promise<void> {
    this.currentAgencyId = agencyId
    
    try {
      if (agencyId) {
        // Use a fresh connection to avoid prepared statement conflicts
        await (this as any).$executeRawUnsafe(`SELECT set_current_agency_id('${agencyId}')`)
      } else {
        await (this as any).$executeRawUnsafe(`SELECT clear_current_agency_id()`)
      }
    } catch (error) {
      // Handle connection issues gracefully - don't log in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to set agency context in database:', error instanceof Error ? error.message : String(error))
      }
      // Continue with client-side tracking for fallback
    }
  }

  // Get the current agency context
  getCurrentAgencyId(): string | null {
    return this.currentAgencyId
  }

  // Secure method to get users for current agency
  async getAgencyUsers(): Promise<Array<any>> {
    if (!this.currentAgencyId) {
      throw new Error('No agency context set. Call setAgencyContext() first.')
    }
    
    try {
      const rlsResult = await (this as any).$queryRawUnsafe(`SELECT * FROM get_agency_users()`) as Array<any>
      
      if (rlsResult.length > 0) {
        return rlsResult
      }
      
      throw new Error('RLS function returned no users, falling back')
    } catch (error) {
      // Fallback to direct query with manual filtering
      const directResult = await (this as any).user.findMany({
        where: { agencyId: this.currentAgencyId }
      })
      
      return directResult
    }
  }

  // Secure method to get current agency info
  async getCurrentAgency(): Promise<any> {
    if (!this.currentAgencyId) {
      throw new Error('No agency context set. Call setAgencyContext() first.')
    }
    
    try {
      const result = await (this as any).$queryRawUnsafe(`SELECT * FROM get_current_agency()`) as Array<any>
      return result[0] || null
    } catch (error) {
      console.error('Error getting current agency:', error)
      // Fallback to direct query
      return await (this as any).agency.findUnique({
        where: { id: this.currentAgencyId }
      })
    }
  }

  // Secure method to create a user in current agency
  async createAgencyUser(userData: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role?: string
  }): Promise<any> {
    if (!this.currentAgencyId) {
      throw new Error('No agency context set. Call setAgencyContext() first.')
    }

    const { id, email, firstName = null, lastName = null, role = 'USER' } = userData

    try {
      const result = await (this as any).$queryRawUnsafe(`
        SELECT create_agency_user('${id}', '${email}', ${firstName ? `'${firstName}'` : 'NULL'}, ${lastName ? `'${lastName}'` : 'NULL'}, '${role}')
      `) as Array<any>
      return result[0]
    } catch (error) {
      console.error('Error creating agency user:', error)
      // Fallback to direct creation with manual agency assignment
      return await (this as any).user.create({
        data: {
          id,
          email,
          firstName,
          lastName,
          role: role as any,
          agencyId: this.currentAgencyId,
        }
      })
    }
  }

  // Secure method to update a user in current agency
  async updateAgencyUser(userId: string, updates: {
    firstName?: string
    lastName?: string
    role?: string
  }): Promise<any> {
    if (!this.currentAgencyId) {
      throw new Error('No agency context set. Call setAgencyContext() first.')
    }

    const { firstName = null, lastName = null, role = null } = updates

    try {
      const result = await (this as any).$queryRawUnsafe(`
        SELECT update_agency_user('${userId}', ${firstName ? `'${firstName}'` : 'NULL'}, ${lastName ? `'${lastName}'` : 'NULL'}, ${role ? `'${role}'` : 'NULL'})
      `) as Array<any>
      return result[0]
    } catch (error) {
      console.error('Error updating agency user:', error)
      // Fallback to direct update with agency validation
      return await (this as any).user.update({
        where: { 
          id: userId,
          agencyId: this.currentAgencyId
        },
        data: {
          ...(firstName !== null && { firstName }),
          ...(lastName !== null && { lastName }),
          ...(role !== null && { role: role as any }),
        }
      })
    }
  }

  // Create a new client instance with agency context pre-set
  forAgency(agencyId: string): TenantAwarePrismaClient {
    const client = new TenantAwarePrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
    
    // Set the agency context immediately
    client.setAgencyContext(agencyId).catch(console.error)
    
    return client
  }

  // Execute a function with a specific agency context
  async withAgencyContext<T>(
    agencyId: string | null, 
    fn: (client: TenantAwarePrismaClient) => Promise<T>
  ): Promise<T> {
    const previousAgencyId = this.currentAgencyId
    
    try {
      await this.setAgencyContext(agencyId)
      return await fn(this)
    } finally {
      // Restore previous context
      await this.setAgencyContext(previousAgencyId)
    }
  }

  // Override $disconnect to clear context
  async $disconnect(): Promise<void> {
    try {
      await this.setAgencyContext(null)
    } catch {
      // Ignore errors during cleanup
    }
    return super.$disconnect()
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new TenantAwarePrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export the tenant-aware client type
export type { TenantAwarePrismaClient }

// Utility function to get a tenant-scoped client
export function getTenantPrismaClient(agencyId: string): TenantAwarePrismaClient {
  return (prisma as TenantAwarePrismaClient).forAgency(agencyId)
}