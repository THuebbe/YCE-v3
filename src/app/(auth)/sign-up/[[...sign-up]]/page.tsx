import { SignUp } from '@clerk/nextjs'
import { headers } from 'next/headers'

export default async function SignUpPage() {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  
  // Redirect to routing page to handle user flow after authentication
  const redirectUrl = hostname.includes('.localhost') || hostname.includes('localhost')
    ? `http://${hostname}/routing`
    : `https://${hostname}/routing`
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">
            Join YardCard Elite
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Start managing your yard sign rentals today
          </p>
        </div>
        <div className="mt-8">
          <SignUp 
            redirectUrl={redirectUrl}
            appearance={{
              elements: {
                formButtonPrimary: 
                  'bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200',
                card: 'shadow-xl border border-neutral-200 rounded-xl',
                headerTitle: 'text-2xl font-bold text-neutral-900',
                headerSubtitle: 'text-neutral-600',
                socialButtonsBlockButton: 
                  'border border-neutral-300 hover:border-neutral-400 text-neutral-700 hover:bg-neutral-50 transition-colors duration-200',
                formFieldInput: 
                  'border border-neutral-300 focus:border-primary focus:ring-primary rounded-lg',
                footerActionLink: 'text-primary hover:text-primary-dark',
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}