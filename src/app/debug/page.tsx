import { headers } from 'next/headers'
import { getCurrentTenant } from '@/lib/tenant-context'
import { getAgencyBySlug } from '@/lib/db/queries/agency'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  console.log('🐛 Debug page: Starting')
  
  try {
    // Get all headers for debugging
    const headersList = await headers()
    const hostname = headersList.get('host') || ''
    const xUrl = headersList.get('x-url') || ''
    
    console.log('🐛 Debug: Headers', {
      hostname,
      xUrl,
      allHeaders: Object.fromEntries(headersList.entries())
    })
    
    // Parse URL manually
    const cleanUrl = xUrl.split('#')[0]
    const urlParams = new URLSearchParams(cleanUrl.split('?')[1] || '')
    const agencySlug = urlParams.get('agency')
    
    console.log('🐛 Debug: URL parsing', {
      cleanUrl,
      queryString: cleanUrl.split('?')[1],
      agencySlug
    })
    
    // Debug environment
    console.log('🐛 Debug: Environment', {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlStart: process.env.DATABASE_URL?.substring(0, 20)
    })
    
    // Test agency lookup directly
    let agency = null
    let agencyError = null
    if (agencySlug) {
      try {
        // Test direct Prisma call
        console.log('🐛 Debug: Testing direct Prisma call...')
        agency = await prisma.agency.findUnique({
          where: { slug: agencySlug }
        })
        console.log('🐛 Debug: Direct Prisma result', {
          agencySlug,
          agencyFound: !!agency,
          agencyId: agency?.id,
          isActive: agency?.isActive
        })
      } catch (error) {
        agencyError = error
        console.error('🐛 Debug: Direct Prisma error', error)
        
        // Try the helper function as fallback
        try {
          agency = await getAgencyBySlug(agencySlug)
          console.log('🐛 Debug: Helper function result', {
            agencySlug,
            agencyFound: !!agency,
            agencyId: agency?.id,
            isActive: agency?.isActive
          })
        } catch (helperError) {
          console.error('🐛 Debug: Helper function error', helperError)
        }
      }
    }
    
    // Test tenant context function
    const tenantId = await getCurrentTenant()
    console.log('🐛 Debug: Tenant context result', { tenantId })
    
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Tenant Context</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Headers</h2>
            <pre className="text-sm">{JSON.stringify({
              hostname,
              'x-url': xUrl,
              'x-hostname': headersList.get('x-hostname'),
              'x-subdomain': headersList.get('x-subdomain')
            }, null, 2)}</pre>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">URL Parsing</h2>
            <pre className="text-sm">{JSON.stringify({
              cleanUrl,
              queryString: cleanUrl.split('?')[1],
              agencySlug,
              hasParams: !!urlParams.toString()
            }, null, 2)}</pre>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Agency Lookup</h2>
            <pre className="text-sm">{JSON.stringify({
              agencySlug,
              agencyFound: !!agency,
              agencyId: agency?.id,
              agencyName: agency?.name,
              isActive: agency?.isActive,
              hasError: !!agencyError,
              errorMessage: agencyError instanceof Error ? agencyError.message : null
            }, null, 2)}</pre>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Tenant Context</h2>
            <pre className="text-sm">{JSON.stringify({
              tenantId,
              hasContext: !!tenantId
            }, null, 2)}</pre>
          </div>
        </div>
        
        <div className="mt-6">
          <p className="text-sm text-gray-600">
            Try: <a href="/debug?agency=yardcard-elite-west-branch" className="text-blue-600 underline">
              /debug?agency=yardcard-elite-west-branch
            </a>
          </p>
        </div>
      </div>
    )
  } catch (error) {
    console.error('🐛 Debug: Error', error)
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Debug Error</h1>
        <pre className="bg-red-100 p-4 rounded text-sm">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    )
  }
}