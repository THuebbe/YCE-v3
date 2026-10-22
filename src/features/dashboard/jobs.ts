// Server only: the dashboard's "jobs" list - which displays go up and come
// down each day. The days come from the order's inventory hold (the same
// rental window booking reserved), so they match what the calendar blocks.
import { supabase } from '@/lib/db/supabase-client';
import { addDays, resolveTimeZone, todayIn } from '@/features/booking/booking-rules';
import { countOrderSigns, formatAddress, formatTimeWindow } from '@/features/orders/client-utils';

export type JobKind = 'setup' | 'pickup';

export interface Job {
  kind: JobKind;
  day: string; // YYYY-MM-DD
  orderId: string;
  orderNumber: string;
  customerName: string;
  address: string;
  signs: number;
  timeWindow: string | null;
  /** Set up: the order is deployed or done. Pick up: checked in. */
  done: boolean;
}

export interface JobsOverview {
  today: string;
  /** Next `days` days from today, only the days with jobs (today always) */
  days: { day: string; jobs: Job[] }[];
  /** Displays still out after their pickup day */
  overdue: Job[];
}

const WINDOW_DAYS = 7;
/** How far back an unpicked display still counts as overdue (older ones are data problems, not jobs) */
const OVERDUE_LOOKBACK_DAYS = 60;

export async function getJobsOverview(agency: { id: string; operating_hours?: unknown }): Promise<JobsOverview> {
  const today = todayIn(resolveTimeZone(agency.operating_hours));
  const last = addDays(today, WINDOW_DAYS - 1);
  const empty: JobsOverview = { today, days: [{ day: today, jobs: [] }], overdue: [] };

  const { data: holds, error } = await supabase
    .from('inventory_holds')
    .select('order_id, rental_start, rental_end')
    .eq('agency_id', agency.id)
    .eq('hold_type', 'order')
    .lte('rental_start', last)
    .gte('rental_end', addDays(today, -OVERDUE_LOOKBACK_DAYS));
  if (error) {
    console.error('getJobsOverview holds failed:', agency.id, error.message);
    return empty;
  }
  const ids = [...new Set((holds ?? []).map(h => h.order_id).filter(Boolean))] as string[];
  if (ids.length === 0) return empty;

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, event_address, timeWindow, delivery_time, status, order_signs(sign_id, quantity), order_items(sign_id, quantity)')
    .eq('agency_id', agency.id)
    .in('id', ids)
    .neq('status', 'cancelled');
  if (ordersError) {
    console.error('getJobsOverview orders failed:', agency.id, ordersError.message);
    return empty;
  }
  const byId = new Map((orders ?? []).map(o => [o.id as string, o]));

  const jobs: Job[] = [];
  const overdue: Job[] = [];
  for (const hold of holds ?? []) {
    const order = byId.get(hold.order_id as string);
    if (!order) continue;
    const base = {
      orderId: order.id as string,
      orderNumber: (order.order_number as string) || '',
      customerName: (order.customer_name as string) || 'Customer',
      address: formatAddress(order.event_address),
      signs: countOrderSigns(order),
      timeWindow: formatTimeWindow(order as { delivery_time?: string | null; timeWindow?: string | null }),
    };
    const start = hold.rental_start as string;
    const end = hold.rental_end as string;
    const status = order.status as string;
    const pickedUp = status === 'completed';

    if (start >= today && start <= last) {
      jobs.push({ ...base, kind: 'setup', day: start, done: status === 'deployed' || pickedUp });
    }
    if (end >= today && end <= last) {
      jobs.push({ ...base, kind: 'pickup', day: end, done: pickedUp });
    } else if (end < today && status === 'deployed') {
      overdue.push({ ...base, kind: 'pickup', day: end, done: false });
    }
  }

  const days = new Map<string, Job[]>([[today, []]]);
  for (const job of jobs.sort(byDayThenKind)) {
    days.set(job.day, [...(days.get(job.day) ?? []), job]);
  }
  return {
    today,
    days: [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, list]) => ({ day, jobs: list })),
    overdue: overdue.sort(byDayThenKind),
  };
}

// Pickups first in a day: they free the signs the setups may need
function byDayThenKind(a: Job, b: Job): number {
  return a.day.localeCompare(b.day) || (a.kind === b.kind ? a.customerName.localeCompare(b.customerName) : a.kind === 'pickup' ? -1 : 1);
}
