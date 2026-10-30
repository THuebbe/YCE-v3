// Server only: never import this from a 'use client' file.
//
// Cross-tenant by design: these queries read every agency. Only pages and
// actions that call requireAdmin() first may use them.
import { supabase } from '@/lib/db/supabase-client';
import { agencyHasInventory } from '@/features/agency/readiness-server';
import { bookingBlockers, type ReadinessItem } from '@/features/agency/readiness';
import { ADMIN_AGENCY_COLUMNS, agencyRows, overview, type AdminAgency, type AgencyRow, type OrderStub, type Overview } from './summary';

function check<T>(label: string, result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(`admin ${label}: ${result.error.message}`);
  return result.data as T;
}

/**
 * Every agency with its readiness and order counts. Reads all order stubs
 * and counts them here: fine at a few thousand orders; past that, move the
 * counting into a SQL function.
 */
export async function loadAdminSummary(): Promise<{ rows: AgencyRow[]; overview: Overview }> {
  const [agencies, stock, orders] = await Promise.all([
    supabase.from('agencies').select(ADMIN_AGENCY_COLUMNS).order('created_at', { ascending: false }),
    supabase.from('agency_inventory').select('agency_id').gt('quantity', 0),
    supabase.from('orders').select('agency_id, created_at, status'),
  ]);
  const agencyList = check('agencies', agencies) as unknown as AdminAgency[];
  const stocked = new Set((check('inventory', stock) as { agency_id: string }[]).map(r => r.agency_id));
  const orderList = check('orders', orders) as OrderStub[];

  const rows = agencyRows(agencyList, stocked, orderList);
  return { rows, overview: overview(rows, orderList) };
}

export interface AdminAgencyDetail {
  agency: AdminAgency;
  blockers: ReadinessItem[];
  users: { id: string; email: string | null; first_name: string | null; last_name: string | null; role: string | null; created_at: string }[];
  /** No customer names or contact details: the owner doesn't need them here */
  recentOrders: { id: string; order_number: string | null; created_at: string; event_date: string | null; status: string | null; payment_status: string | null; total: number | null }[];
  ordersTotal: number;
}

export async function loadAdminAgency(id: string): Promise<AdminAgencyDetail | null> {
  const found = await supabase.from('agencies').select(ADMIN_AGENCY_COLUMNS).eq('id', id).maybeSingle();
  const agency = check('agency', found) as unknown as AdminAgency | null;
  if (!agency) return null;

  const [users, recent, total, hasInventory] = await Promise.all([
    supabase.from('users').select('id, email, first_name, last_name, role, created_at').eq('agency_id', id).order('created_at'),
    supabase.from('orders')
      .select('id, order_number, created_at, event_date, status, payment_status, total')
      .eq('agency_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('agency_id', id),
    agencyHasInventory(id),
  ]);
  if (total.error) throw new Error(`admin order count: ${total.error.message}`);

  return {
    agency,
    blockers: bookingBlockers(agency, hasInventory),
    users: check('users', users) as AdminAgencyDetail['users'],
    recentOrders: check('orders', recent) as AdminAgencyDetail['recentOrders'],
    ordersTotal: total.count ?? 0,
  };
}
