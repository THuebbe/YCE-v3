import Link from 'next/link'

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">YardCard Elite</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/about" className="text-gray-500 hover:text-gray-900">About</Link>
              <Link href="/pricing" className="text-gray-500 hover:text-gray-900">Pricing</Link>
              <Link href="/contact" className="text-gray-500 hover:text-gray-900">Contact</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link 
                href="/sign-in" 
                className="text-gray-500 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Professional Lawn Care
            <span className="text-blue-600"> Scheduling</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Streamline your lawn care business with YardCard Elite. Manage clients, schedule services, 
            and grow your business with our comprehensive platform designed for lawn care professionals.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/sign-up"
              className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Start Free Trial
            </Link>
            <Link href="#features" className="text-base font-semibold leading-6 text-gray-900">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-blue-500">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 002.25 2.25v7.5" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Smart Scheduling</h3>
              <p className="mt-2 text-base text-gray-500">
                Automated scheduling system that optimizes routes and manages recurring services.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-green-500">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Client Management</h3>
              <p className="mt-2 text-base text-gray-500">
                Comprehensive client profiles with service history, preferences, and communication tools.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-yellow-500">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H4.5m2.25 0v3m0 0v.75A.75.75 0 016 9h.75m0 0H9m-3.75-4.5h3.75m0 0h3.75m-3.75 0v3m3.75-4.5v.75c0 .414.336.75.75.75h.75m0 0H15m-3.75-4.5v3m3.75-4.5H15m-3.75 4.5v.75A.75.75 0 0115 9h.75M15 12v3m0 0v.75A.75.75 0 0115 16.5h.75m.75-4.5v3m0 0v.75c0 .414.336.75.75.75H18m-3.75-4.5v3m3.75-4.5H18m-3.75 4.5v.75A.75.75 0 0115 18.75H18" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Business Growth</h3>
              <p className="mt-2 text-base text-gray-500">
                Analytics and reporting tools to track performance and identify growth opportunities.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}