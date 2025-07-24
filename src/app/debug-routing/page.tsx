import { auth } from '@clerk/nextjs/server'
import { getUserById } from '@/lib/db/supabase-client'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DebugRoutingPage() {
  const { userId } = await auth()
  
  let user = null
  let agency = null
  
  if (userId) {
    try {
      user = await getUserById(userId)
      agency = user?.agency
    } catch (error) {
      console.error('Debug: Error getting user:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Routing Information</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Authentication</h2>
            <div className="space-y-2">
              <p><strong>User ID:</strong> {userId || 'Not authenticated'}</p>
              <p><strong>User Data:</strong> {user ? 'Found' : 'Not found'}</p>
              {user && (
                <>
                  <p><strong>User Name:</strong> {user.firstName} {user.lastName}</p>
                  <p><strong>User Email:</strong> {user.email}</p>
                </>
              )}
            </div>
          </div>

          {/* Agency Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Agency</h2>
            <div className="space-y-2">
              <p><strong>Has Agency:</strong> {agency ? 'Yes' : 'No'}</p>
              {agency && (
                <>
                  <p><strong>Agency Name:</strong> {agency.name}</p>
                  <p><strong>Agency Slug:</strong> {agency.slug}</p>
                  <p><strong>Agency ID:</strong> {agency.id}</p>
                  <p><strong>Agency Active:</strong> {agency.isActive ? 'Yes' : 'No'}</p>
                </>
              )}
            </div>
          </div>

          {/* Navigation Test Links */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Test Navigation</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/" className="text-blue-600 hover:underline">
                Home
              </Link>
              <Link href="/routing" className="text-blue-600 hover:underline">
                Routing Page
              </Link>
              <Link href="/booking" className="text-blue-600 hover:underline">
                Booking (General)
              </Link>
              {agency?.slug && (
                <>
                  <Link href={`/${agency.slug}/dashboard`} className="text-blue-600 hover:underline">
                    Agency Dashboard
                  </Link>
                  <Link href={`/${agency.slug}/booking`} className="text-blue-600 hover:underline">
                    Agency Booking
                  </Link>
                </>
              )}
              <Link href="/sign-in" className="text-blue-600 hover:underline">
                Sign In
              </Link>
              <Link href="/onboarding" className="text-blue-600 hover:underline">
                Onboarding
              </Link>
            </div>
          </div>

          {/* Current Route Info */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Expected Flow</h2>
            <div className="space-y-2 text-sm">
              <p>1. User signs in → Redirected to /routing</p>
              <p>2. /routing checks user agency → Redirects to /{agency.slug}/dashboard</p>
              <p>3. /{agency.slug}/dashboard validates access → Shows dashboard</p>
              <p>4. Direct booking access at /{agency.slug}/booking</p>
              
              {agency?.slug && (
                <div className="mt-4 p-4 bg-green-50 rounded">
                  <p className="font-medium text-green-800">Your expected dashboard URL:</p>
                  <code className="text-green-600">/{agency.slug}/dashboard</code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}