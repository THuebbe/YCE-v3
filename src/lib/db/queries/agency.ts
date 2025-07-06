import { prisma } from '../prisma'
// import { Agency } from '@prisma/client'

// Cache for agency lookups to improve performance
const agencyCache = new Map<string, { agency: any | null; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

export async function getAgencyBySlug(slug: string): Promise<any | null> {
  // Check cache first
  const cached = agencyCache.get(slug)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.agency
  }

  try {
    const agency = await prisma.agency.findUnique({
      where: { slug }
    })

    // Update cache
    agencyCache.set(slug, {
      agency,
      timestamp: Date.now()
    })

    return agency
  } catch (error) {
    console.error('Error fetching agency by slug:', error)
    return null
  }
}

export async function getAgencyByDomain(domain: string): Promise<any | null> {
  // Check cache first
  const cached = agencyCache.get(`domain:${domain}`)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.agency
  }

  try {
    const agency = await prisma.agency.findUnique({
      where: { domain }
    })

    // Update cache
    agencyCache.set(`domain:${domain}`, {
      agency,
      timestamp: Date.now()
    })

    return agency
  } catch (error) {
    console.error('Error fetching agency by domain:', error)
    return null
  }
}

export async function isAgencyActive(slug: string): Promise<boolean> {
  const agency = await getAgencyBySlug(slug)
  return agency?.isActive ?? false
}

// Clear cache entry (useful for when agency data is updated)
export function clearAgencyCache(slug?: string, domain?: string) {
  if (slug) {
    agencyCache.delete(slug)
  }
  if (domain) {
    agencyCache.delete(`domain:${domain}`)
  }
  if (!slug && !domain) {
    agencyCache.clear()
  }
}

// Check if user exists in database
export async function userExistsInDatabase(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })
    return !!user
  } catch (error) {
    console.error('Error checking if user exists:', error)
    return false
  }
}

// Get user's agency by user ID
export async function getUserAgency(userId: string): Promise<Agency | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { agency: true }
    })
    
    return user?.agency || null
  } catch (error) {
    console.error('Error fetching user agency:', error)
    return null
  }
}

// Get all active agencies (for admin purposes)
export async function getActiveAgencies(): Promise<Agency[]> {
  try {
    return await prisma.agency.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching active agencies:', error)
    return []
  }
}