import Link from 'next/link'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Service Temporarily Unavailable
          </h1>
          <p className="text-gray-600 mb-6">
            This YardCard Elite agency account is currently inactive. Access has been temporarily suspended.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Need Help?</h2>
          <p className="text-sm text-gray-600 mb-3">
            If you believe this is an error or need to reactivate your account, please contact:
          </p>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Email:</span>{' '}
              <a 
                href="mailto:support@yardcardelite.com" 
                className="text-blue-600 hover:text-blue-800"
              >
                support@yardcardelite.com
              </a>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>{' '}
              <a 
                href="tel:1-800-YARDCARD" 
                className="text-blue-600 hover:text-blue-800"
              >
                1-800-YARDCARD
              </a>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Return to YardCard Elite
        </Link>
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; 2024 YardCard Elite. All rights reserved.</p>
      </footer>
    </div>
  )
}