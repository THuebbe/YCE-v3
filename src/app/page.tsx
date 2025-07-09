import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  console.log('🏠 Root page: Starting load')
  
  try {
    const { userId } = await auth()
    console.log('🏠 Root page: Auth result', { userId })
    
    if (userId) {
      console.log('🏠 Root page: User authenticated, redirecting to routing page')
      redirect('/routing')
    } else {
      console.log('🏠 Root page: No user ID, showing landing page')
    }
  } catch (authError) {
    console.error('🏠 Root page: Authentication error:', authError)
    // If auth fails, fall through to show landing page
  }
  
  console.log('🏠 Root page: Showing landing page')

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