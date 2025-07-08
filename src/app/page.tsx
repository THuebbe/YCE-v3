import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma-safe'

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

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
  
  // For production domains
  const parts = hostWithoutPort.split('.')
  if (parts.length > 2) {
    return parts[0]
  }
  
  return null
}

export default async function HomePage() {
  console.log('🏠 Root page: Starting load')
  
  try {
    const authResult = await auth()
    console.log('🏠 Root page: Full auth result', authResult)
    
    const { userId, sessionId, orgId, orgRole, sessionClaims } = authResult
    console.log('🏠 Root page: Auth details', { 
      userId, 
      sessionId, 
      orgId, 
      orgRole, 
      hasSessionClaims: !!sessionClaims,
      claimsKeys: sessionClaims ? Object.keys(sessionClaims) : null
    })
    
    if (userId) {
      console.log('🏠 Root page: User is authenticated, redirecting to dashboard')
      redirect('/dashboard')
    } else {
      console.log('🏠 Root page: No user ID, checking if session exists but no userId')
      if (sessionId) {
        console.log('🏠 Root page: Session exists but no userId - possible session issue')
      }
    }
  } catch (authError) {
    console.error('🏠 Root page: Authentication error:', authError)
    // If auth fails, fall through to show landing page
  }
  
  console.log('🏠 Root page: Falling through to landing page')

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">YardCard Elite</h1>
          <p className="mt-2 text-gray-600">Lawn care business management platform</p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/sign-in"
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </Link>
          
          <Link 
            href="/sign-up"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}