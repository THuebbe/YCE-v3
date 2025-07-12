'use client'

import { usePathname } from 'next/navigation'

/**
 * Hook to get the current agency slug from the route
 */
export function useAgencySlug(): string | null {
  const pathname = usePathname()
  
  // Extract agency from path: /[agency]/dashboard -> agency
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // Check if this is an agency-specific route
  if (pathSegments.length >= 2 && 
      (pathSegments[1] === 'dashboard' || 
       pathSegments[1] === 'orders' || 
       pathSegments[1] === 'inventory' || 
       pathSegments[1] === 'customers' || 
       pathSegments[1] === 'reports' || 
       pathSegments[1] === 'settings')) {
    return pathSegments[0]
  }
  
  return null
}

/**
 * Get an agency-aware route path
 * Note: agencySlug is required when calling from non-component contexts
 */
export function getAgencyRoute(path: string, agencySlug: string): string {
  if (!agencySlug) {
    console.warn('No agency slug provided for route:', path)
    return path
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  return `/${agencySlug}/${cleanPath}`
}