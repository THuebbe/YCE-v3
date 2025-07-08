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
    const { userId } = await auth()
    console.log('🏠 Root page: Auth result', { userId })
    
    if (userId) {
      // Get current hostname to check if we're on the main domain or a subdomain
      const headersList = await headers()
      const hostname = headersList.get('host') || ''
      const currentSubdomain = getSubdomain(hostname)
      
      console.log('🏠 Root page: Hostname info', { hostname, currentSubdomain })
      
      // If user is already on a subdomain, just redirect to dashboard
      if (currentSubdomain) {
        console.log('🏠 Root page: On subdomain, redirecting to dashboard')
        redirect('/dashboard')
      }
      
      // If on main domain, check if user has an agency and redirect to their subdomain
      try {
        // Only try database connection if Prisma is properly configured
        if (!process.env.DATABASE_URL) {
          console.warn('🏠 Root page: DATABASE_URL not configured, redirecting to dashboard')
          redirect('/dashboard')
        }
        
        console.log('🏠 Root page: Checking database for user:', userId)
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { agency: true }
        })
        
        console.log('🏠 Root page: Database result', { user, hasAgency: !!user?.agency })
        
        if (user?.agency?.slug) {
          // Redirect to their agency's subdomain
          const protocol = hostname.includes('localhost') ? 'http' : 'https'
          const baseHost = hostname.includes('localhost') ? 'localhost:3000' : hostname
          const agencyUrl = `${protocol}://${user.agency.slug}.${baseHost}/dashboard`
          console.log('🏠 Root page: Redirecting to agency subdomain:', agencyUrl)
          redirect(agencyUrl)
        } else if (user) {
          // User exists but no agency, redirect to onboarding
          console.log('🏠 Root page: User exists but no agency, redirecting to onboarding')
          redirect('/onboarding')
        } else {
          // User not found in database, redirect to onboarding to create user record
          console.log('🏠 Root page: User not found in database, redirecting to onboarding')
          redirect('/onboarding')
        }
      } catch (dbError) {
        console.error('🏠 Root page: Database error checking user agency:', dbError)
        // If database is not working, just redirect to dashboard
        // The dashboard will handle auth and user creation
        redirect('/dashboard')
      }
    } else {
      console.log('🏠 Root page: No user ID, showing landing page')
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