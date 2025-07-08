import { headers } from 'next/headers'
import { cache } from 'react'
import { getTenantPrismaClient, prisma, TenantAwarePrismaClient } from './db/prisma'
import { getAgencyBySlug, getAgencyByDomain } from './db/queries/agency'

// Cache the tenant resolution for the request
export const getCurrentTenant = cache(async (): Promise<string | null> => {
  try {
    const headersList = await headers()
    const hostname = headersList.get('host') || ''
    
    // TEMPORARY: Check for agency in URL parameters (workaround for Vercel subdomain limitations)
    const url = headersList.get('x-url') || ''
    const urlParams = new URLSearchParams(url.split('?')[1] || '')
    const agencySlug = urlParams.get('agency')
    
    if (agencySlug) {
      console.log('🏢 Tenant: Found agency slug in URL:', agencySlug)
      const agency = await getAgencyBySlug(agencySlug)
      if (agency && agency.isActive) {
        console.log('🏢 Tenant: Agency found and active:', agency.id)
        return agency.id
      }
    }
    
    // Extract subdomain from hostname (original approach)
    const subdomain = getSubdomain(hostname)
    
    if (subdomain) {
      console.log('🏢 Tenant: Found subdomain:', subdomain)
      // Look up agency by subdomain
      const agency = await getAgencyBySlug(subdomain)
      if (agency && agency.isActive) {
        console.log('🏢 Tenant: Agency found via subdomain:', agency.id)
        return agency.id
      }
    }
    
    // Check for custom domain
    const customDomainAgency = await getAgencyByDomain(hostname)
    if (customDomainAgency && customDomainAgency.isActive) {
      console.log('🏢 Tenant: Agency found via custom domain:', customDomainAgency.id)
      return customDomainAgency.id
    }
    
    console.log('🏢 Tenant: No tenant context found')
    return null
  } catch (error) {
    console.error('Error resolving tenant:', error)
    return null
  }
})

// Get a tenant-scoped Prisma client for the current request
export const getTenantClient = cache(async (): Promise<TenantAwarePrismaClient> => {
  const tenantId = await getCurrentTenant()
  
  if (tenantId) {
    return getTenantPrismaClient(tenantId)
  }
  
  // Return the base client without tenant context for non-tenant requests
  return prisma as TenantAwarePrismaClient
})

// Execute a database operation within a specific tenant context
export async function withTenantContext<T>(
  tenantId: string,
  operation: (client: TenantAwarePrismaClient) => Promise<T>
): Promise<T> {
  const client = getTenantPrismaClient(tenantId)
  return await operation(client)
}

// Execute a database operation within the current request's tenant context
export async function withCurrentTenantContext<T>(
  operation: (client: TenantAwarePrismaClient) => Promise<T>
): Promise<T> {
  const client = await getTenantClient()
  return await operation(client)
}

// Validate that the current user belongs to the specified tenant
export async function validateTenantAccess(targetTenantId: string): Promise<boolean> {
  const currentTenantId = await getCurrentTenant()
  return currentTenantId === targetTenantId
}

// Helper function to extract subdomain (same as middleware)
function getSubdomain(hostname: string): string | null {
  // Remove port if present
  const hostWithoutPort = hostname.split(':')[0]
  
  // Handle localhost development
  if (hostWithoutPort.endsWith('.localhost') || hostWithoutPort === 'localhost') {
    const parts = hostWithoutPort.split('.')
    
    if (parts.length > 1 && parts[0] !== 'localhost') {
      // subdomain.localhost format
      return parts[0]
    }
    return null
  }
  
  // Handle other development IPs
  if (hostWithoutPort.startsWith('127.0.0.1') || hostWithoutPort.startsWith('192.168')) {
    return null
  }
  
  // For production domains like subdomain.yardcardelite.com
  const parts = hostWithoutPort.split('.')
  if (parts.length > 2) {
    return parts[0]
  }
  
  return null
}

// Hook for React components to get tenant context
export function useTenantContext() {
  // This would typically use React context or a state management solution
  // For now, we'll return a function to get the current tenant
  return {
    getCurrentTenant,
    getTenantClient,
    withCurrentTenantContext,
    validateTenantAccess
  }
}

// Middleware helper to set tenant context early in the request lifecycle
export async function setRequestTenantContext(): Promise<string | null> {
  const tenantId = await getCurrentTenant()
  
  if (tenantId) {
    // Set the tenant context in the main Prisma client
    await (prisma as TenantAwarePrismaClient).setAgencyContext(tenantId)
  }
  
  return tenantId
}

// Clear tenant context (useful for cleanup)
export async function clearTenantContext(): Promise<void> {
  await (prisma as TenantAwarePrismaClient).setAgencyContext(null)
}