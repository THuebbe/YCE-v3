/**
 * Utility functions for booking link management
 */

/**
 * Generate booking URL for an agency
 */
export function generateBookingUrl(agencySlug: string, domain: string = 'yardcard-elite.com'): string {
  return `https://${domain}/${agencySlug}/booking`
}

/**
 * Copy text to clipboard with error handling
 */
export async function copyToClipboard(text: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported')
    }
    
    await navigator.clipboard.writeText(text)
    return { success: true }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to copy to clipboard' 
    }
  }
}

/**
 * Open booking link in new tab with security attributes
 */
export function openBookingLink(url: string): void {
  try {
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    console.error('Failed to open booking link:', error)
    // Fallback: try to navigate in current window
    window.location.href = url
  }
}

/**
 * Validate booking URL format
 */
export function isValidBookingUrl(url: string): boolean {
  try {
    const urlObject = new URL(url)
    return urlObject.protocol === 'https:' && urlObject.pathname.includes('/booking')
  } catch {
    return false
  }
}

/**
 * Extract agency slug from booking URL
 */
export function extractAgencySlugFromUrl(url: string): string | null {
  try {
    const urlObject = new URL(url)
    const pathSegments = urlObject.pathname.split('/').filter(Boolean)
    
    // Expected format: /agency-slug/booking
    if (pathSegments.length >= 2 && pathSegments[pathSegments.length - 1] === 'booking') {
      return pathSegments[pathSegments.length - 2]
    }
    
    return null
  } catch {
    return null
  }
}