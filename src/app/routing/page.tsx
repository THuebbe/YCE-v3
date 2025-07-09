import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserById } from '@/lib/db/supabase-client'
import { Loader2 } from 'lucide-react'

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

export default async function RoutingPage() {
  console.log('🚏 Routing page: Starting user routing logic')
  
  try {
    const { userId } = await auth()
    console.log('🚏 Routing page: Auth result', { userId })
    
    if (!userId) {
      console.log('🚏 Routing page: No user ID, redirecting to sign-in')
      redirect('/sign-in')
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
    
    if (user?.agency?.slug) {
      console.log('🚏 Routing page: User has agency, redirecting to dashboard:', user.agency.slug)
      redirect(`/dashboard?agency=${user.agency.slug}`)
    } else if (user) {
      console.log('🚏 Routing page: User exists but no agency, redirecting to onboarding')
      redirect('/onboarding')
    } else {
      console.log('🚏 Routing page: User still not found after waiting, redirecting to onboarding')
      redirect('/onboarding')
    }

  } catch (error) {
    console.error('🚏 Routing page: Error during routing:', error)
    // If anything fails, redirect to onboarding
    redirect('/onboarding')
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