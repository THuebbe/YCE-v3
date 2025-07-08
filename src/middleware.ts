import { NextRequest, NextResponse } from 'next/server'

// Basic route matchers
const isProtectedRoute = (pathname: string) => {
  return pathname.startsWith('/dashboard') || 
         pathname.startsWith('/organization') || 
         pathname.startsWith('/settings') || 
         pathname.startsWith('/profile')
}

const isPublicRoute = (pathname: string) => {
  const publicPaths = ['/', '/sign-in', '/sign-up', '/about', '/pricing', '/contact', '/maintenance', '/not-found']
  return publicPaths.some(path => pathname === path || pathname.startsWith(path)) ||
         pathname.startsWith('/api/webhooks')
}

// Extract subdomain from hostname
function getSubdomain(hostname: string): string | null {
  const hostWithoutPort = hostname.split(':')[0]
  
  // Handle localhost development
  if (hostWithoutPort.endsWith('.localhost') || hostWithoutPort === 'localhost') {
    const parts = hostWithoutPort.split('.')
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0]
    }
    return null
  }
  
  // Handle development IPs
  if (hostWithoutPort.startsWith('127.0.0.1') || hostWithoutPort.startsWith('192.168')) {
    return null
  }
  
  // For production domains
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

export default function middleware(req: NextRequest) {
  try {
    const hostname = req.headers.get('host') || ''
    const { pathname } = req.nextUrl
    
    const subdomain = getSubdomain(hostname)
    const isMain = isMainDomain(hostname)
    
    // For now, just pass through and let the app handle auth
    // This prevents middleware failures while preserving functionality
    const response = NextResponse.next()
    
    // Add hostname context to headers for server components
    response.headers.set('x-hostname', hostname)
    if (subdomain) {
      response.headers.set('x-subdomain', subdomain)
    }
    response.headers.set('x-is-main-domain', isMain.toString())
    
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Fallback: just pass through the request
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}