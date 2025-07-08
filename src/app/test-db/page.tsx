export const dynamic = 'force-dynamic'

export default async function TestDB() {
  console.log('🔍 Test DB: Starting database connection test')
  
  // Test if we can import PrismaClient directly
  let PrismaClient: any
  let prismaError: any
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient: PC } = require('@prisma/client')
    PrismaClient = PC
    console.log('✅ PrismaClient imported successfully')
  } catch (error) {
    prismaError = error
    console.error('❌ Failed to import PrismaClient:', error)
  }
  
  // Test environment variables
  const dbUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL
  const nodeEnv = process.env.NODE_ENV
  
  console.log('🔍 Environment check:', {
    hasDatabase: !!dbUrl,
    hasDirectUrl: !!directUrl,
    nodeEnv,
    databaseUrlStart: dbUrl?.substring(0, 30),
    directUrlStart: directUrl?.substring(0, 30)
  })
  
  // Test direct connection
  let testResult = null
  let connectionError = null
  
  if (PrismaClient && dbUrl) {
    try {
      console.log('🔍 Creating PrismaClient with URL:', dbUrl?.substring(0, 50) + '...')
      
      const client = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl
          }
        },
        log: ['error']
      })
      
      console.log('🔍 Testing direct connection...')
      testResult = await client.$queryRaw`SELECT 1 as test`
      console.log('✅ Direct connection successful:', testResult)
      
      await client.$disconnect()
    } catch (error) {
      connectionError = error
      console.error('❌ Direct connection failed:', error)
      
      // Try without custom datasource
      try {
        console.log('🔍 Trying without custom datasource...')
        const client2 = new PrismaClient({
          log: ['error']
        })
        testResult = await client2.$queryRaw`SELECT 1 as test`
        console.log('✅ Second attempt successful:', testResult)
        await client2.$disconnect()
      } catch (error2) {
        console.error('❌ Second attempt also failed:', error2)
      }
    }
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Environment</h2>
          <pre className="text-sm">{JSON.stringify({
            nodeEnv,
            hasDatabase: !!dbUrl,
            hasDirectUrl: !!directUrl,
            databaseUrlStart: dbUrl?.substring(0, 30),
            directUrlStart: directUrl?.substring(0, 30)
          }, null, 2)}</pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">PrismaClient Import</h2>
          <pre className="text-sm">{JSON.stringify({
            success: !!PrismaClient,
            error: prismaError instanceof Error ? prismaError.message : null
          }, null, 2)}</pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Direct Connection Test</h2>
          <pre className="text-sm">{JSON.stringify({
            success: !!testResult,
            result: testResult,
            error: connectionError instanceof Error ? connectionError.message : null
          }, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}