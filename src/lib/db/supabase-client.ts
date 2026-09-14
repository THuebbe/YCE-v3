import { createClient } from '@supabase/supabase-js'

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

    // userId is the Clerk auth ID. Users created via the Clerk webhook have
    // it stored directly as `id` (see api/webhooks/clerk/route.ts), but
    // manually-seeded users (e.g. scripts/sync-clerk-users.ts) keep their
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

// Order-related database operations (for dashboard)
export async function getOrdersByAgency(agencyId: string, limit: number = 10): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Supabase: Error fetching orders:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Supabase: Exception in getOrdersByAgency:', error)
    return []
  }
}

// Upcoming orders for dashboard
export async function getUpcomingOrdersByAgency(agencyId: string, limit: number = 10): Promise<any[]> {
  try {
    console.log('🔍 Supabase: Fetching upcoming orders for agency:', agencyId)
    
    const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format
    
    // Query orders with future event dates and active statuses
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        event_date,
        status,
        order_items(quantity)
      `)
      .eq('agency_id', agencyId)
      .in('status', ['pending', 'processing', 'deployed'])
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(limit)
    
    if (error) {
      console.error('❌ Supabase: Error fetching upcoming orders:', error)
      return []
    }
    
    if (!orders || orders.length === 0) {
      console.log('ℹ️ Supabase: No upcoming orders found for agency:', agencyId)
      return []
    }
    
    // Transform the data to match the component interface
    const transformedOrders = orders.map(order => ({
      id: order.id,
      customer_name: order.customer_name,
      event_date: order.event_date,
      status: order.status,
      signCount: order.order_items?.reduce((total: number, item: any) => total + (item.quantity || 0), 0) || 0
    }))
    
    console.log(`✅ Supabase: Found ${transformedOrders.length} upcoming orders`)
    return transformedOrders
    
  } catch (error) {
    console.error('❌ Supabase: Exception in getUpcomingOrdersByAgency:', error)
    return []
  }
}

// Dashboard metrics
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
    
    // Get monthly revenue (current month)
    const { data: currentMonthOrders, error: currentMonthError } = await supabase
      .from('orders')
      .select('total, completed_at, updated_at')
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .or(`completed_at.gte.${startOfMonth.toISOString()},and(completed_at.is.null,updated_at.gte.${startOfMonth.toISOString()})`)
    
    // Get previous month revenue
    const { data: prevMonthOrders, error: prevMonthError } = await supabase
      .from('orders')
      .select('total, completed_at, updated_at')
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .or(`and(completed_at.gte.${startOfPrevMonth.toISOString()},completed_at.lt.${startOfMonth.toISOString()}),and(completed_at.is.null,updated_at.gte.${startOfPrevMonth.toISOString()},updated_at.lt.${startOfMonth.toISOString()})`)
    
    // Get completed orders count (current month)
    const { data: completedOrders, error: completedOrdersError } = await supabase
      .from('orders')
      .select('id, completed_at, updated_at')
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .or(`completed_at.gte.${startOfMonth.toISOString()},and(completed_at.is.null,updated_at.gte.${startOfMonth.toISOString()})`)
    
    // Get last 30 days revenue (rolling)
    const { data: last30DaysOrders, error: last30DaysError } = await supabase
      .from('orders')
      .select('total, completed_at, updated_at')
      .eq('agency_id', agencyId)
      .eq('status', 'completed')
      .or(`completed_at.gte.${thirtyDaysAgo.toISOString()},and(completed_at.is.null,updated_at.gte.${thirtyDaysAgo.toISOString()})`)
    
    // Calculate metrics
    const openOrdersCount = openOrders?.length || 0
    const currentMonthRevenue = currentMonthOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    const prevMonthRevenue = prevMonthOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    const last30DaysRevenue = last30DaysOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    const completedOrdersCount = completedOrders?.length || 0
    const averageOrderValue = completedOrdersCount > 0 ? currentMonthRevenue / completedOrdersCount : 0
    
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
