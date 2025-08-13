import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { CreateAgencyForm } from '@/features/auth/components/CreateAgencyForm'

export default async function OnboardingPage() {
  // Ensure user is authenticated
  const user = await currentUser()
  if (!user) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to YardCard Elite
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Let&apos;s set up your lawn care business
            </p>
            <p className="text-gray-500">
              Create your agency profile to start managing clients and growing your business
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-900">
                Create Your Agency
              </h2>
              <p className="text-gray-600 mt-1">
                This information will be used to set up your business profile
              </p>
            </div>
            
            <div className="p-8">
              <CreateAgencyForm />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@yardcardelite.com" className="text-green-600 hover:text-green-700">
                support@yardcardelite.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}