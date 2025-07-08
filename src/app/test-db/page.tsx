import { testConnection, getAgencyBySlug } from '@/lib/db/supabase-client'

export const dynamic = 'force-dynamic'

export default async function TestDB() {
  console.log('🔍 Test DB: Starting Supabase connection test')
  
  // Test environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
  const nodeEnv = process.env.NODE_ENV
  
  console.log('🔍 Environment check:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
    nodeEnv,
    supabaseUrlStart: supabaseUrl?.substring(0, 30),
    supabaseKeyStart: supabaseKey?.substring(0, 30)
  })
  
  // Test direct connection
  let testResult = false
  let connectionError = null
  
  try {
    console.log('🔍 Testing Supabase connection...')
    testResult = await testConnection()
    console.log('✅ Supabase connection successful:', testResult)
  } catch (error) {
    connectionError = error
    console.error('❌ Supabase connection failed:', error)
  }
  
  // Test agency lookup
  let agencyTest = null
  let agencyError = null
  
  try {
    console.log('🔍 Testing agency lookup...')
    agencyTest = await getAgencyBySlug('yardcard-elite-west-branch')
    console.log('✅ Agency lookup result:', !!agencyTest)
  } catch (error) {
    agencyError = error
    console.error('❌ Agency lookup failed:', error)
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Environment</h2>
          <pre className="text-sm">{JSON.stringify({
            nodeEnv,
            hasSupabaseUrl: !!supabaseUrl,
            hasSupabaseKey: !!supabaseKey,
            supabaseUrlStart: supabaseUrl?.substring(0, 30),
            supabaseKeyStart: supabaseKey?.substring(0, 30)
          }, null, 2)}</pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Connection Test</h2>
          <pre className="text-sm">{JSON.stringify({
            success: testResult,
            method: 'Supabase Direct',
            error: connectionError instanceof Error ? connectionError.message : null
          }, null, 2)}</pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Agency Lookup Test</h2>
          <pre className="text-sm">{JSON.stringify({
            success: !!agencyTest,
            agencyFound: !!agencyTest,
            agencyId: agencyTest?.id,
            agencyName: agencyTest?.name,
            isActive: agencyTest?.isActive,
            error: agencyError instanceof Error ? agencyError.message : null
          }, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}