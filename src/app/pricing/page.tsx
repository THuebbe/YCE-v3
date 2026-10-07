import Link from 'next/link'

// Plans decided 2026-10-07 (see PRODUCT.md "Platform revenue")
const PLANS = [
  {
    name: 'Essentials',
    tagline: 'Everything you need to take bookings',
    monthly: 49,
    annual: 499,
    featured: false,
    features: [
      'Online booking page for your customers',
      'Instant notification for every new order',
      'Sign inventory control',
      'Email support',
    ],
  },
  {
    name: 'Elite',
    tagline: 'For agencies that want the full picture',
    monthly: 79,
    annual: 799,
    featured: true,
    features: [
      'Everything in Essentials',
      'Full reporting and analytics',
    ],
  },
]

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
            Two simple plans for your yard sign rental business. Try either free for 14 days, or start right away.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={plan.featured
                ? 'bg-blue-600 rounded-2xl shadow-lg p-8 text-white'
                : 'bg-white rounded-2xl shadow-lg p-8'}
            >
              <div className="text-center">
                <h3 className={`text-2xl font-bold ${plan.featured ? '' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`mt-2 ${plan.featured ? 'text-blue-100' : 'text-gray-600'}`}>{plan.tagline}</p>
                <div className="mt-6">
                  <span className={`text-5xl font-bold ${plan.featured ? '' : 'text-gray-900'}`}>${plan.monthly}</span>
                  <span className={plan.featured ? 'text-blue-100' : 'text-gray-500'}>/month</span>
                </div>
                <p className={`mt-2 text-sm ${plan.featured ? 'text-blue-100' : 'text-gray-500'}`}>
                  or ${plan.annual}/year
                </p>
              </div>
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <svg className={`h-5 w-5 mr-3 ${plan.featured ? 'text-white' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/auth/sign-up"
                  className={plan.featured
                    ? 'w-full block text-center bg-white text-blue-600 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-semibold'
                    : 'w-full block text-center bg-gray-900 text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors'}
                >
                  Get Started
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer a free trial?</h3>
              <p className="text-gray-600">Yes. Both plans come with an optional 14-day free trial, or you can start your subscription right away. A card is required at signup either way.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I pay yearly?</h3>
              <p className="text-gray-600">Yes. Annual billing is $499/year for Essentials and $799/year for Elite.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Yes. You can cancel your subscription at any time with no cancellation fees.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do my customers pay me?</h3>
              <p className="text-gray-600">Connect your own Stripe, Venmo, or PayPal account, or let us set up card payments for you in a few minutes. Payments go directly to you.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}