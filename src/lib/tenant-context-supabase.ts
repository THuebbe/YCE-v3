import { headers } from 'next/headers'
import { cache } from 'react'
import { getAgencyBySlug, getAgencyByDomain } from './db/supabase-client'

// Cache the tenant resolution for the request
export const getCurrentTenant = cache(async (): Promise<string | null> => {
  try {
    const headersList = await headers()
    const hostname = headersList.get('host') || ''
    
    console.log('🏢 Tenant (Supabase): Starting tenant resolution for hostname:', hostname)
    
    // PRIORITY 1: Extract agency slug from route path (new agency-first routing)
    const url = headersList.get('x-url') || ''
    console.log('🏢 Tenant (Supabase): Checking URL for agency in route path:', url)
    
    if (url) {
      const urlPath = new URL(url).pathname
      const pathSegments = urlPath.split('/').filter(Boolean)
      
      // Check if this is an agency-specific route: /[agency]/dashboard/* or /[agency]/orders/*
      if (pathSegments.length >= 2 && 
          (pathSegments[1] === 'dashboard' || 
           pathSegments[1] === 'orders' || 
           pathSegments[1] === 'inventory' || 
           pathSegments[1] === 'customers' || 
           pathSegments[1] === 'reports' || 
           pathSegments[1] === 'settings')) {
        
        const agencySlug = pathSegments[0]
        console.log('🏢 Tenant (Supabase): Found agency slug in route path:', agencySlug)
        
        const agency = await getAgencyBySlug(agencySlug)
        if (agency && agency.isActive) {
          console.log('🏢 Tenant (Supabase): ✅ Agency resolved via route path:', agency.id)
          return agency.id
        } else {
          console.log('🏢 Tenant (Supabase): ❌ Agency not found or inactive via route path')
        }
      }
      
      // FALLBACK: Check for legacy agency in URL parameters
      const urlParams = new URLSearchParams(url.split('?')[1] || '')
      const agencySlug = urlParams.get('agency')
      
      if (agencySlug) {
        console.log('🏢 Tenant (Supabase): Found legacy agency slug in URL parameter:', agencySlug)
        const agency = await getAgencyBySlug(agencySlug)
        if (agency && agency.isActive) {
          console.log('🏢 Tenant (Supabase): ✅ Agency resolved via legacy URL parameter:', agency.id)
          return agency.id
        }
      }
    }
    
    // PRIORITY 2: Extract subdomain from hostname
    const subdomain = getSubdomain(hostname)
    
    if (subdomain) {
      console.log('🏢 Tenant (Supabase): Found subdomain:', subdomain)
      const agency = await getAgencyBySlug(subdomain)
      if (agency && agency.isActive) {
        console.log('🏢 Tenant (Supabase): ✅ Agency resolved via subdomain:', agency.id)
        return agency.id
      } else {
        console.log('🏢 Tenant (Supabase): ❌ Agency not found or inactive via subdomain')
      }
    }
    
    // PRIORITY 3: Check for custom domain
    const customDomainAgency = await getAgencyByDomain(hostname)
    if (customDomainAgency && customDomainAgency.isActive) {
      console.log('🏢 Tenant (Supabase): ✅ Agency resolved via custom domain:', customDomainAgency.id)
      return customDomainAgency.id
    }
    
    console.log('🏢 Tenant (Supabase): ❌ No tenant context found')
    return null
  } catch (error) {
    console.error('🏢 Tenant (Supabase): Error resolving tenant:', error)
    return null
  }
})

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

// Validate that the current user belongs to the specified tenant
export async function validateTenantAccess(targetTenantId: string): Promise<boolean> {
  const currentTenantId = await getCurrentTenant()
  return currentTenantId === targetTenantId
}

// Execute a database operation within a specific tenant context
export async function withTenantContext<T>(
  tenantId: string,
  operation: (tenantId: string) => Promise<T>
): Promise<T> {
  return await operation(tenantId)
}

// Execute a database operation within the current request's tenant context
export async function withCurrentTenantContext<T>(
  operation: (tenantId: string) => Promise<T>
): Promise<T> {
  const tenantId = await getCurrentTenant()
  if (!tenantId) {
    throw new Error('No tenant context available')
  }
  return await operation(tenantId)
}

// Hook for React components to get tenant context
export function useTenantContext() {
  return {
    getCurrentTenant,
    withCurrentTenantContext,
    validateTenantAccess
  }
}