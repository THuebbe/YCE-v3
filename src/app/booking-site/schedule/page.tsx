import { headers } from 'next/headers'
import { getAgencyBySlug } from '@/lib/db/queries/agency'
import Link from 'next/link'

function getSubdomain(hostname: string): string | null {
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1') || hostname.startsWith('192.168')) {
    const parts = hostname.split('.')
    return parts.length > 1 ? parts[0] : null
  }
  
  const parts = hostname.split('.')
  if (parts.length > 2) {
    return parts[0]
  }
  
  return null
}

export default async function SchedulePage() {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  const subdomain = getSubdomain(hostname)
  
  let agency = null
  if (subdomain) {
    agency = await getAgencyBySlug(subdomain)
  }

  const agencyName = agency?.name || 'Professional Lawn Care'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-green-800">
                {agencyName}
              </Link>
            </div>
            <Link 
              href="/" 
              className="text-gray-500 hover:text-gray-900"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Schedule Your Service
            </h1>
            <p className="text-gray-600">
              Book your lawn care service with {agencyName}
            </p>
          </div>

          {/* Service Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 cursor-pointer">
                <h3 className="font-medium text-gray-900">Lawn Mowing</h3>
                <p className="text-sm text-gray-500 mt-1">Regular lawn maintenance</p>
                <p className="text-lg font-semibold text-green-600 mt-2">$50+</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 cursor-pointer">
                <h3 className="font-medium text-gray-900">Fertilization</h3>
                <p className="text-sm text-gray-500 mt-1">Seasonal fertilizer application</p>
                <p className="text-lg font-semibold text-green-600 mt-2">$80+</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 cursor-pointer">
                <h3 className="font-medium text-gray-900">Weed Control</h3>
                <p className="text-sm text-gray-500 mt-1">Professional weed treatment</p>
                <p className="text-lg font-semibold text-green-600 mt-2">$60+</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Service Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="Enter your full address where service is needed"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="Any special instructions or requests..."
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Request Service Quote
                </button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                We'll contact you within 24 hours to confirm your appointment and provide a detailed quote.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}