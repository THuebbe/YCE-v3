import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserById } from '@/lib/db/supabase-client'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

export default async function RoutingPage() {
  console.log('🚏 Routing page: Starting user routing logic')
  
  try {
    const { userId } = await auth()
    console.log('🚏 Routing page: Auth result', { userId })
    
    if (!userId) {
      console.log('🚏 Routing page: No user ID, redirecting to sign-in')
      redirect('/auth/sign-in')
    }

    // Give a moment for webhooks to process if this is a new user
    console.log('🚏 Routing page: Looking up user in database')
    let user = await getUserById(userId)
    
    // If user not found, wait a moment and try again (webhook might still be processing)
    if (!user) {
      console.log('🚏 Routing page: User not found, waiting for webhook processing...')
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
      user = await getUserById(userId)
    }
    
    // Add additional wait time for webhook processing
    if (!user) {
      console.log('🚏 Routing page: User still not found, waiting additional 3 seconds...')
      await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 more seconds
      user = await getUserById(userId)
    }
    
    if (user?.agency?.slug) {
      console.log('🚏 Routing page: User has agency, redirecting to dashboard:', user.agency.slug)
      redirect(`/${user.agency.slug}/dashboard`)
    } else if (user && !user.agency) {
      console.log('🚏 Routing page: User exists but no agency, redirecting to onboarding')
      redirect('/onboarding')
    } else if (user) {
      console.log('🚏 Routing page: User exists with agency but no slug, redirecting to onboarding')
      redirect('/onboarding')
    } else {
      console.log('🚏 Routing page: User still not found after extended waiting, redirecting to onboarding')
      redirect('/onboarding')
    }

  } catch (error) {
    // Re-throw redirect errors so they work properly
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    console.error('🚏 Routing page: Error during routing:', error)
    console.error('🚏 Routing page: Error stack:', error instanceof Error ? error.stack : String(error))
    
    // Show error page for actual errors (not redirects)
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-900 mb-4">Routing Error</h1>
          <p className="text-red-700 mb-4">There was an error during authentication routing.</p>
          <p className="text-sm text-red-600 mb-4">Error: {error instanceof Error ? error.message : String(error)}</p>
          <div className="space-y-2">
            <Link href="/sign-in" className="block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Try Sign In Again
            </Link>
            <Link href="/onboarding" className="block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Go to Onboarding
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

// This component shows while the routing logic runs
function RoutingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="text-lg text-gray-700">Setting up your account...</span>
      </div>
      <p className="mt-2 text-sm text-gray-500">This will just take a moment</p>
    </div>
  )
}