import { supabase } from '@/lib/db/supabase-client';
import { getCurrentTenant } from '@/lib/tenant-context-supabase';

export async function getOrdersByAgency() {
  try {
    const agencyId = await getCurrentTenant();
    
    if (!agencyId) {
      console.error('No agency context available for fetching orders');
      return [];
    }

    console.log('📦 Orders: Fetching orders for agency:', agencyId);

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          sign:sign_library(*)
        )
      `)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Orders: Error fetching orders:', error);
      return [];
    }

    console.log('✅ Orders: Successfully fetched', orders?.length || 0, 'orders');
    return orders || [];
  } catch (error) {
    console.error('❌ Orders: Exception fetching orders:', error);
    return [];
  }
}

export async function getOrdersByStatus(status: string) {
  try {
    const agencyId = await getCurrentTenant();
    
    if (!agencyId) {
      console.error('No agency context available for fetching orders');
      return [];
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          sign:sign_library(*)
        )
      `)
      .eq('agency_id', agencyId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Orders: Error fetching orders by status:', error);
      return [];
    }

    return orders || [];
  } catch (error) {
    console.error('❌ Orders: Exception fetching orders by status:', error);
    return [];
  }
}