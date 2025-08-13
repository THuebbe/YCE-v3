import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">YardCard Elite</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/auth/sign-in" 
                className="text-gray-500 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/sign-up" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your lawn care business. Start with our free trial and scale as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Basic Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Basic</h3>
              <p className="mt-2 text-gray-600">Perfect for getting started</p>
              <div className="mt-6">
                <span className="text-5xl font-bold text-gray-900">$29</span>
                <span className="text-gray-500">/month</span>
              </div>
            </div>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Up to 50 clients
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic scheduling
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email support
              </li>
            </ul>
            <div className="mt-8">
              <Link
                href="/auth/sign-up"
                className="w-full block text-center bg-gray-900 text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Professional Plan */}
          <div className="bg-blue-600 rounded-2xl shadow-lg p-8 text-white transform scale-105">
            <div className="text-center">
              <h3 className="text-2xl font-bold">Professional</h3>
              <p className="mt-2 text-blue-100">Most popular choice</p>
              <div className="mt-6">
                <span className="text-5xl font-bold">$79</span>
                <span className="text-blue-100">/month</span>
              </div>
            </div>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-white mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited clients
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-white mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced scheduling & routing
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-white mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Analytics & reporting
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-white mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority support
              </li>
            </ul>
            <div className="mt-8">
              <Link
                href="/auth/sign-up"
                className="w-full block text-center bg-white text-blue-600 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
              <p className="mt-2 text-gray-600">For larger operations</p>
              <div className="mt-6">
                <span className="text-5xl font-bold text-gray-900">$149</span>
                <span className="text-gray-500">/month</span>
              </div>
            </div>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Everything in Professional
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Multi-team management
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                API access
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                24/7 phone support
              </li>
            </ul>
            <div className="mt-8">
              <Link
                href="/auth/sign-up"
                className="w-full block text-center bg-gray-900 text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer a free trial?</h3>
              <p className="text-gray-600">Yes! All plans include a 14-day free trial with full access to features.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Absolutely. You can cancel your subscription at any time with no cancellation fees.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards and offer annual billing discounts.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}