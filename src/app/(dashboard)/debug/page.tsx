import { auth, currentUser } from '@clerk/nextjs/server'
import { getCurrentTenant } from '@/lib/tenant-context'
import { prisma } from '@/lib/db/prisma'

export default async function DebugPage() {
  const { userId } = await auth()
  const clerkUser = await currentUser()
  const tenantId = await getCurrentTenant()
  
  const debugInfo: Record<string, unknown> = {
    userId,
    clerkUserEmail: clerkUser?.emailAddresses[0]?.emailAddress,
    tenantId,
    agency: null,
    dbUser: null,
    error: null
  }
  
  try {
    if (tenantId) {
      debugInfo.agency = await prisma.agency.findUnique({
        where: { id: tenantId }
      })
      
      if (clerkUser?.emailAddresses[0]?.emailAddress) {
        debugInfo.dbUser = await prisma.user.findFirst({
          where: {
            email: clerkUser.emailAddresses[0].emailAddress,
            agencyId: tenantId
          }
        })
      }
    }
  } catch (error) {
    debugInfo.error = error instanceof Error ? error.message : String(error);
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}