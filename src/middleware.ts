import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/organization(.*)',
  '/settings(.*)',
  '/profile(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about',
  '/pricing',
  '/contact',
  '/api/webhooks(.*)',
  '/maintenance',
  '/not-found',
])

// Extract subdomain from hostname
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

// Check if this is a main domain (no subdomain)
function isMainDomain(hostname: string): boolean {
  const subdomain = getSubdomain(hostname)
  return !subdomain || subdomain === 'www'
}

export default clerkMiddleware(async (auth, req) => {
  const hostname = req.headers.get('host') || ''
  const { pathname } = req.nextUrl
  
  const subdomain = getSubdomain(hostname)
  const isMain = isMainDomain(hostname)
  
  console.log('🔍 Middleware: Request details', {
    hostname,
    pathname,
    subdomain,
    isMain,
    url: req.url
  })
  
  // Check if Clerk is properly configured
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!clerkKey) {
    console.log('🔍 Middleware: Clerk not configured, skipping auth')
    // Pass through without auth checks if Clerk isn't configured
    const response = NextResponse.next()
    response.headers.set('x-hostname', hostname)
    if (subdomain) {
      response.headers.set('x-subdomain', subdomain)
    }
    response.headers.set('x-is-main-domain', isMain.toString())
    return response
  }
  
  // Handle authentication
  let userId: string | null = null
  try {
    const authResult = await auth()
    userId = authResult.userId
    
    if (!isPublicRoute(req) && isProtectedRoute(req)) {
      await auth.protect()
    }
  } catch (error) {
    console.error('🔍 Middleware: Auth error:', error)
    // If auth fails, treat as unauthenticated
    userId = null
  }
  
  // If user is logged in and on a public route's root, redirect to their agency's subdomain
  if (userId && isPublicRoute(req) && pathname === '/') {
    console.log('🔍 Middleware: User logged in, checking redirect logic', {
      userId,
      hostname,
      pathname,
      isMain,
      subdomain
    })
    
    // Only redirect if they're on the main domain (no subdomain)
    if (isMain) {
      console.log('🔍 Middleware: User on main domain, checking user metadata')
      
      try {
        // TEMPORARY: Since Clerk metadata isn't accessible in Edge Runtime,
        // hardcode the known user's agency slug for testing
        let agencySlug: string | undefined
        
        if (userId === 'user_2vHceGPgDVopU89JYlmrt5jL0ha') {
          agencySlug = 'yardcard-elite-west-branch'
          console.log('🔍 Middleware: Known user, using hardcoded agency slug:', agencySlug)
        } else {
          console.log('🔍 Middleware: Unknown user, no agency slug available')
        }
        
        console.log('🔍 Middleware: User metadata:', { agencySlug })
        
        if (agencySlug) {
          // Redirect to their agency's subdomain
          console.log('🔍 Middleware: Redirecting to agency subdomain:', agencySlug)
          const url = new URL('/dashboard', req.url)
          url.hostname = `${agencySlug}.${url.hostname}`
          console.log('🔍 Middleware: Redirect URL:', url.toString())
          return Response.redirect(url)
        } else {
          // No agency found in metadata, redirect to onboarding
          console.log('🔍 Middleware: No agency in metadata, redirecting to onboarding')
          const url = new URL('/onboarding', req.url)
          return Response.redirect(url)
        }
      } catch (error) {
        console.error('Error fetching user metadata in middleware:', error)
        // Fallback to onboarding if there's an error
        const url = new URL('/onboarding', req.url)
        return Response.redirect(url)
      }
    }
    
    // If they're already on a subdomain, just redirect to dashboard
    console.log('🔍 Middleware: User on subdomain, redirecting to dashboard')
    const url = new URL('/dashboard', req.url)
    url.host = req.headers.get('host') || url.host
    return Response.redirect(url)
  }

  // If user is not authenticated and trying to access protected routes, redirect to sign-in
  if (!userId && isProtectedRoute(req)) {
    const url = new URL('/sign-in', req.url)
    url.host = req.headers.get('host') || url.host
    return Response.redirect(url)
  }
  
  // Pass hostname info via headers for server components to handle agency resolution
  const response = NextResponse.next()
  
  // Add hostname context to headers
  response.headers.set('x-hostname', hostname)
  if (subdomain) {
    response.headers.set('x-subdomain', subdomain)
  }
  response.headers.set('x-is-main-domain', isMain.toString())
  
  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}