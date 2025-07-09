import { auth } from '@clerk/nextjs/server'
import { getUserById } from '@/lib/db/supabase-client'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DebugAuthPage() {
  console.log('🐛 Debug Auth: Starting auth debug page')
  
  try {
    const { userId } = await auth()
    console.log('🐛 Debug Auth: Auth result', { userId })
    
    let user = null
    let userError = null
    
    if (userId) {
      try {
        user = await getUserById(userId)
        console.log('🐛 Debug Auth: User lookup result', { user })
      } catch (err) {
        userError = err
        console.error('🐛 Debug Auth: Error looking up user:', err)
      }
    }
    
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Auth Debug Page</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clerk Auth Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Clerk Authentication</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">User ID:</span>
                  <span className={userId ? 'text-green-600' : 'text-red-600'}>
                    {userId || 'Not authenticated'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className={userId ? 'text-green-600' : 'text-red-600'}>
                    {userId ? 'Authenticated' : 'Not authenticated'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Database User Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Database User</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">User Found:</span>
                  <span className={user ? 'text-green-600' : 'text-red-600'}>
                    {user ? 'Yes' : 'No'}
                  </span>
                </div>
                {user && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span className="text-gray-600">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span className="text-gray-600">{user.firstName} {user.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Role:</span>
                      <span className="text-gray-600">{user.role}</span>
                    </div>
                  </>
                )}
                {userError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-600">Error: {userError.message}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Agency Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Agency Association</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Has Agency:</span>
                  <span className={user?.agency ? 'text-green-600' : 'text-red-600'}>
                    {user?.agency ? 'Yes' : 'No'}
                  </span>
                </div>
                {user?.agency && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Agency Name:</span>
                      <span className="text-gray-600">{user.agency.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Agency Slug:</span>
                      <span className="text-gray-600">{user.agency.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Agency Active:</span>
                      <span className={user.agency.isActive ? 'text-green-600' : 'text-red-600'}>
                        {user.agency.isActive ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <a
                  href="/routing"
                  className="block w-full bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700"
                >
                  Test Routing Logic
                </a>
                <a
                  href="/sign-in"
                  className="block w-full bg-gray-600 text-white px-4 py-2 rounded text-center hover:bg-gray-700"
                >
                  Go to Sign In
                </a>
                <a
                  href="/onboarding"
                  className="block w-full bg-green-600 text-white px-4 py-2 rounded text-center hover:bg-green-700"
                >
                  Go to Onboarding
                </a>
                {user?.agency?.slug && (
                  <a
                    href={`/dashboard?agency=${user.agency.slug}`}
                    className="block w-full bg-purple-600 text-white px-4 py-2 rounded text-center hover:bg-purple-700"
                  >
                    Go to Dashboard
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* Raw Data */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Raw Data</h2>
            <div className="bg-gray-100 rounded p-4 overflow-x-auto">
              <pre className="text-sm text-gray-700">
                {JSON.stringify({ userId, user, userError: userError?.message }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    )
    
  } catch (error) {
    console.error('🐛 Debug Auth: Error in debug page:', error)
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-900 mb-4">Debug Page Error</h1>
          <p className="text-red-700">Error: {error.message}</p>
        </div>
      </div>
    )
  }
}