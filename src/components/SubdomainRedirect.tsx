'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

// Helper component to redirect users to their correct subdomain if they're on the wrong one
export function SubdomainRedirect() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded || !user) return

    // Check if we're on localhost without a subdomain
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // User is on main domain but should be on their agency subdomain
      // We could redirect them here if we know their agency
      console.log('User is on main domain - they may need to access their agency subdomain')
    }
  }, [user, isLoaded])

  return null // This component doesn't render anything
}