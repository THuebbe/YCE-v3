import { OrganizationProfile } from '@clerk/nextjs'

export default function OrganizationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Organization Settings
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Manage your organization profile, members, and settings
          </p>
        </div>
        <div className="flex justify-center">
          <OrganizationProfile 
            appearance={{
              elements: {
                rootBox: 'w-full max-w-4xl',
                card: 'shadow-xl border border-neutral-200 rounded-xl',
                headerTitle: 'text-2xl font-bold text-neutral-900',
                headerSubtitle: 'text-neutral-600',
                formButtonPrimary: 
                  'bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200',
                formFieldInput: 
                  'border border-neutral-300 focus:border-primary focus:ring-primary rounded-lg',
                navbarButton: 
                  'text-neutral-700 hover:text-primary hover:bg-neutral-50 rounded-lg transition-colors duration-200',
                navbarButtonActive: 
                  'text-primary bg-primary/10 rounded-lg',
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}