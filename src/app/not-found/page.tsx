import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.44-5.124-3.5M15 6.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Agency Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            The agency you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <p className="text-sm text-gray-500">
            Please check the URL and try again, or contact the agency directly if you believe this is an error.
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-blue-900 mb-3">What you can do:</h2>
          <ul className="text-sm text-blue-800 space-y-2 text-left">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Double-check the agency subdomain in your URL
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Contact the agency directly for their correct link
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Return to the main YardCard Elite site to find agencies
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go to YardCard Elite Home
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>Need help? Contact us at{' '}
              <a 
                href="mailto:support@yardcardelite.com"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                support@yardcardelite.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-sm text-gray-400">
        <p>&copy; 2024 YardCard Elite. All rights reserved.</p>
      </footer>
    </div>
  )
}