import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/shared/components/layout/Header'
import { getAgencyBySlug, getUserById } from '@/lib/db/supabase-client'
import { InventoryPage } from '@/features/inventory/components/inventory-page'

export const metadata = {
  title: 'Inventory - YardCard Elite',
  description: 'Manage your yard sign inventory and stock levels'
}

export default async function Inventory({ 
  params 
}: { 
  params: Promise<{ agency: string }> 
}) {
  const { userId } = await auth()
  const resolvedParams = await params
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Get agency slug from URL parameter
  const agencySlug = resolvedParams.agency

  if (!agencySlug) {
    redirect('/routing')
  }

  // Verify the agency exists and the user has access to it
  let agency, user
  try {
    const results = await Promise.all([
      getAgencyBySlug(agencySlug),
      getUserById(userId)
    ])
    agency = results[0]
    user = results[1]

    if (!agency) {
      redirect('/routing')
    }

    if (!user || user.agency?.slug !== agencySlug) {
      redirect('/routing')
    }
  } catch (error) {
    console.error('Inventory: Error verifying agency access:', error)
    redirect('/routing')
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header />
      <InventoryPage />
    </div>
  )
}