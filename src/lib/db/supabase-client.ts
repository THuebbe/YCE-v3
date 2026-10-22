import { createClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'
import { countOrderSigns } from '@/features/orders/client-utils'

// Create Supabase client with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable')
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Agency-related database operations
export async function getAgencyBySlug(slug: string): Promise<any | null> {
  try {
    console.log('🔍 Supabase: Looking up agency by slug:', slug)
    
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('❌ Supabase: Error fetching agency by slug:', error)
      return null
    }
    
    console.log('✅ Supabase: Agency found:', data?.id)
    return data
  } catch (error) {
    console.error('❌ Supabase: Exception in getAgencyBySlug:', error)
    return null
  }
}

export async function getAgencyByDomain(domain: string): Promise<any | null> {
  try {
    console.log('🔍 Supabase: Looking up agency by domain:', domain)
    
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('❌ Supabase: Error fetching agency by domain:', error)
      return null
    }
    
    console.log('✅ Supabase: Agency found by domain:', data?.id)
    return data
  } catch (error) {
    console.error('❌ Supabase: Exception in getAgencyByDomain:', error)
    return null
  }
}

// User-related database operations
export async function getUserById(userId: string): Promise<any | null> {
  try {
    console.log('🔍 Supabase: Looking up user by ID:', userId)

    // userId is interpolated into a PostgREST .or() filter below, so reject
    // anything that isn't a plain Clerk id / cuid ("user_2abc...", "cmc...")
    // to rule out filter injection (e.g. "x,email.ilike.*").
    if (!/^[A-Za-z0-9_-]+$/.test(userId)) {
      console.error('❌ Supabase: Rejected malformed user id')
      return null
    }

    // userId is the Clerk auth ID. Users created via the Clerk webhook have
    // it stored directly as `id` (see api/webhooks/clerk/route.ts), but
    // manually-seeded users keep their
    // original cuid `id` and link to Clerk only via `clerk_user_id`. Match
    // either so both paths resolve.
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        agency:agencies(*)
      `)
      .or(`id.eq.${userId},clerk_user_id.eq.${userId}`)
      .single()
    
    if (error) {
      // No row for this Clerk id: maybe an existing user signing in on a
      // new Clerk instance (dev -> production gives everyone new ids)
      if (error.code === 'PGRST116') return await relinkByVerifiedEmail(userId)
      console.error('❌ Supabase: Error fetching user by ID:', error)
      return null
    }
    
    console.log('✅ Supabase: User found:', data?.id, 'Agency:', data?.agency?.slug)
    return data
  } catch (error) {
    console.error('❌ Supabase: Exception in getUserById:', error)
    return null
  }
}

/**
 * Moving Clerk from its development to its production instance (2026-10)
 * gives every user a new Clerk id. The first time an existing YCE user
 * signs in on the new instance, find their row by their *verified* email
 * and store the new id, so they keep their agency. Only YCE users (with an
 * agency) are touched: `users` is shared with PantryPro.
 */
async function relinkByVerifiedEmail(userId: string): Promise<any | null> {
  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const primary = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
    if (!primary || primary.verification?.status !== 'verified') return null

    const { data: rows } = await supabase
      .from('users')
      .select('id')
      .ilike('email', primary.emailAddress)
      .not('agency_id', 'is', null)
    if (!rows || rows.length !== 1) return null // none, or ambiguous: leave it to onboarding

    const { data, error } = await supabase
      .from('users')
      .update({ clerk_user_id: userId })
      .eq('id', rows[0].id)
      .select(`
        *,
        agency:agencies(*)
      `)
      .single()
    if (error) {
      console.error('❌ Supabase: Relinking user to new Clerk id failed:', error.message)
      return null
    }
    console.log('🔗 Supabase: Relinked existing user to new Clerk id:', data.id)
    return data
  } catch (error) {
    console.error('❌ Supabase: Exception relinking user:', error)
    return null
  }
}

export async function userExistsInDatabase(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (error) {
      return false
    }
    
    return !!data
  } catch (error) {
    console.error('❌ Supabase: Exception in userExistsInDatabase:', error)
    return false
  }
}


export async function getDashboardMetrics(agencyId: string): Promise<any> {
  try {
    // Get current date for monthly calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    
    // Calculate 30 days ago for rolling period
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    
    // Get open orders count
    const { data: openOrders, error: openOrdersError } = await supabase
      .from('orders')
      .select('id')
      .eq('agency_id', agencyId)
      .in('status', ['pending', 'processing', 'deployed'])
    
    // Revenue = money the agency actually kept: what was paid minus
    // refunds, by booking date. Counts kept cancellation fees, excludes
    // unpaid orders (old demo checkouts).
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('total, refund_amount, created_at')
      .eq('agency_id', agencyId)
      .in('payment_status', ['paid', 'partially_refunded', 'refunded'])
      .gte('created_at', new Date(Math.min(startOfPrevMonth.getTime(), thirtyDaysAgo.getTime())).toISOString())

    // Get completed orders count (current month)
    const { data: completedOrders } = await supabase
      .from('orders')
      .select('id, completed_at, updated_at')
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .or(`completed_at.gte.${startOfMonth.toISOString()},and(completed_at.is.null,updated_at.gte.${startOfMonth.toISOString()})`)

    const kept = (o: { total: unknown; refund_amount: unknown }) =>
      Math.max(0, (Number(o.total) || 0) - (Number(o.refund_amount) || 0))
    const sumSince = (from: Date, to?: Date) => (paidOrders ?? [])
      .filter(o => { const t = new Date(o.created_at as string); return t >= from && (!to || t < to) })
      .reduce((sum, o) => sum + kept(o), 0)
    const round = (n: number) => Math.round(n * 100) / 100

    // Calculate metrics
    const openOrdersCount = openOrders?.length || 0
    const currentMonthRevenue = round(sumSince(startOfMonth))
    const prevMonthRevenue = round(sumSince(startOfPrevMonth, startOfMonth))
    const last30DaysRevenue = round(sumSince(thirtyDaysAgo))
    const completedOrdersCount = completedOrders?.length || 0
    const paidThisMonth = (paidOrders ?? []).filter(o => new Date(o.created_at as string) >= startOfMonth).length
    const averageOrderValue = paidThisMonth > 0 ? round(currentMonthRevenue / paidThisMonth) : 0
    
    return {
      openOrdersCount,
      monthlyRevenue: currentMonthRevenue,
      previousMonthRevenue: prevMonthRevenue,
      last30DaysRevenue,
      completedOrdersCount,
      averageOrderValue
    }
  } catch (error) {
    console.error('❌ Supabase: Exception in getDashboardMetrics:', error)
    return {
      openOrdersCount: 0,
      monthlyRevenue: 0,
      previousMonthRevenue: 0,
      last30DaysRevenue: 0,
      completedOrdersCount: 0,
      averageOrderValue: 0
    }
  }
}

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('agencies')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase: Connection test failed:', error)
      return false
    }
    
    console.log('✅ Supabase: Connection test successful')
    return true
  } catch (error) {
    console.error('❌ Supabase: Connection test exception:', error)
    return false
  }
}
