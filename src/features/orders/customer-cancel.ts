// Server only: the customer's self-service cancel (link in the confirmation email).
import { timingSafeEqual } from 'node:crypto';
import { supabase, getAgencyBySlug } from '@/lib/db/supabase-client';
import { cancellationPolicyOf, customerRefund, type CancellationPolicy } from '@/features/booking/terms';
import { hoursUntilDelivery } from './client-utils';
import { resolveTimeZone } from '@/features/booking/booking-rules';

export interface CustomerCancelQuote {
  orderId: string;
  agencyId: string;
  orderNumber: string;
  status: string;
  eventDate: string | null;
  total: number;
  /** Paid by card through Stripe (the refund goes back to the card) */
  paidByCard: boolean;
  policy: CancellationPolicy;
  /** Inside the notice window: no refund */
  insideNotice: boolean;
  fee: number;
  refund: number;
  canCancel: boolean;
}

/**
 * The order behind a cancel link, or null if the token doesn't match
 * (wrong order, wrong agency, or an order from before cancel links).
 */
export async function loadCancelQuote(agencySlug: string, orderId: string, token: string): Promise<CustomerCancelQuote | null> {
  if (!token || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) return null;
  const { data: order } = await supabase
    .from('orders')
    .select('id, agency_id, order_number, status, event_date, total, payment_status, terms_snapshot, cancel_token, extra_days_before')
    .eq('id', orderId)
    .eq('agency_id', agency.id)
    .maybeSingle();
  const stored = order?.cancel_token as string | null | undefined;
  if (!order || !stored || stored.length !== token.length || !timingSafeEqual(Buffer.from(stored), Buffer.from(token))) return null;

  const total = Number(order.total) || 0;
  const policy = cancellationPolicyOf(order.terms_snapshot);
  // The agency's clock: "48 hours before delivery" means their midnight, not the server's
  const hours = hoursUntilDelivery({ event_date: order.event_date as string, extra_days_before: order.extra_days_before as number }, resolveTimeZone(agency.operating_hours));
  const { insideNotice, fee, refund } = customerRefund(total, policy, hours);
  return {
    orderId: order.id as string,
    agencyId: order.agency_id as string,
    orderNumber: order.order_number as string,
    status: order.status as string,
    eventDate: (order.event_date as string) ?? null,
    total,
    paidByCard: ['paid', 'partially_refunded'].includes(order.payment_status as string),
    policy,
    insideNotice,
    fee,
    refund,
    canCancel: ['pending', 'processing'].includes(order.status as string),
  };
}

/** order_activities needs a user: customer cancels are logged under the agency's admin, with a note saying who */
export async function agencyActorId(agencyId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('id, role')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: true })
    .limit(10);
  const users = data ?? [];
  return (users.find(u => u.role === 'ADMIN') ?? users[0])?.id ?? null;
}
