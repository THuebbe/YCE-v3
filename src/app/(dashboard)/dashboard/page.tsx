// DISABLED: This route is disabled in favor of agency-specific routes [agency]/dashboard
// Use /[agency]/dashboard instead of /dashboard

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Route Disabled</h1>
        <p className="text-gray-600">This route has been disabled. Please use agency-specific routes instead.</p>
        <p className="text-sm text-gray-500 mt-2">Use: /[agency]/dashboard</p>
      </div>
    </div>
  )
}