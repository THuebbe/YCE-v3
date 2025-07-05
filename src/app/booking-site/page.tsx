import { headers } from 'next/headers'
import { getAgencyBySlug } from '@/lib/db/queries/agency'
import Link from 'next/link'

// Extract subdomain from hostname
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

export default async function BookingHomePage() {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  const subdomain = getSubdomain(hostname)
  
  // Get agency information
  let agency = null
  if (subdomain) {
    agency = await getAgencyBySlug(subdomain)
  }

  const agencyName = agency?.name || 'Professional Lawn Care'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-800">{agencyName}</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/services" className="text-gray-500 hover:text-gray-900">Services</Link>
              <Link href="/about" className="text-gray-500 hover:text-gray-900">About</Link>
              <Link href="/contact" className="text-gray-500 hover:text-gray-900">Contact</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link 
                href="/booking/schedule" 
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Book Service
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
            <span className="text-green-600"> Services</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Transform your outdoor space with {agencyName}&apos;s professional lawn care services. 
            Quality service, reliable scheduling, and beautiful results guaranteed.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/booking/schedule"
              className="rounded-md bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Schedule Service
            </Link>
            <Link href="#services" className="text-base font-semibold leading-6 text-gray-900">
              View Services <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Services Section */}
        <div id="services" className="mt-24">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center mb-12">
            Our Services
          </h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-md mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lawn Mowing</h3>
              <p className="text-gray-600 mb-4">
                Regular lawn mowing services to keep your grass healthy and your property looking pristine.
              </p>
              <Link 
                href="/booking/schedule?service=mowing" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Book Now →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-md mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fertilization</h3>
              <p className="text-gray-600 mb-4">
                Professional fertilization programs tailored to your lawn&apos;s specific needs and season.
              </p>
              <Link 
                href="/booking/schedule?service=fertilization" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Book Now →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-md mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Weed Control</h3>
              <p className="text-gray-600 mb-4">
                Effective weed control treatments to maintain a healthy, weed-free lawn year-round.
              </p>
              <Link 
                href="/booking/schedule?service=weed-control" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Book Now →
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-green-600 rounded-2xl py-16 px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Schedule your first service today and experience the difference professional lawn care makes.
          </p>
          <Link
            href="/booking/schedule"
            className="inline-flex items-center px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Schedule Your Service
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  )
}