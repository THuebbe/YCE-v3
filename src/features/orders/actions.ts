'use server';

import { generateOrderDocument, DocumentType } from './documents/generator';
import { getOrderWithDetails, updateOrderDocuments } from './utils';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/db/supabase-client';
import { requireAgencyMember } from '@/features/auth/guards';
import { getStripe, toCents } from '@/lib/stripe';
import { requireFeature } from '@/features/billing/server';
import { sendCustomerCancellationEmail } from '@/lib/email';
import { formatDay } from '@/features/booking/booking-rules';
import type { OrderAction } from './stateMachine';
import type { CancelOrderInput } from './types';

const ELITE_DOCUMENTS: ReadonlySet<DocumentType> = new Set(['pickTicket', 'pickupChecklist']);

export async function generateDocument(orderId: string, type: DocumentType) {
  try {
    // Browser-callable: check the caller belongs to the order's own agency.
    // (Not getCurrentTenant(): it resolves from the URL and proves nothing
    // about the caller.)
    const { data: owner } = await supabase
      .from('orders')
      .select('agency_id')
      .eq('id', orderId)
      .single();
    await requireAgencyMember(owner?.agency_id);
    if (ELITE_DOCUMENTS.has(type)) await requireFeature(owner!.agency_id, 'deploymentDocs');

    // Generate the document
    const result = await generateOrderDocument(orderId, type);
    
    // Store document metadata in order
    await updateOrderDocuments(orderId, {
      type: result.type,
      url: result.url,
      filename: result.filename,
      generatedAt: result.generatedAt.toISOString()
    });

    // Revalidate order pages (note: revalidatePath will work for all agency routes)
    revalidatePath('/[agency]/orders/[orderId]', 'page');
    revalidatePath('/[agency]/orders', 'page');

    return {
      success: true,
      result: {
        url: result.url,
        filename: result.filename,
        type: result.type
      }
    };
  } catch (error) {
    console.error(`Failed to generate ${type} document:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate document'
    };
  }
}

export async function generatePickTicket(orderId: string) {
  return generateDocument(orderId, 'pickTicket');
}

export async function generateOrderSummary(orderId: string) {
  return generateDocument(orderId, 'orderSummary');
}

export async function generatePickupChecklist(orderId: string) {
  return generateDocument(orderId, 'pickupChecklist');
}
// ---------------------------------------------------------------- order flow
// Each action checks the caller belongs to the ORDER's agency
// (browser-callable; RLS is off).

type ActionResult = { success: true } | { success: false; error: string };

async function requireOrderMember(orderId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('id, agency_id, status')
    .eq('id', orderId)
    .single();
  if (!order) throw new Error('Order not found');
  const user = await requireAgencyMember(order.agency_id);
  return { order: order as { id: string; agency_id: string; status: string }, user };
}

function revalidateOrder(orderId: string) {
  revalidatePath('/[agency]/orders', 'page');
  revalidatePath('/[agency]/orders/[orderId]', 'page');
}

const ADVANCE: Partial<Record<OrderAction, { from: string; to: string; stamp?: string }>> = {
  startProcessing: { from: 'pending', to: 'processing' },
  generatePickTicket: { from: 'pending', to: 'processing' },
  printOrderSummary: { from: 'processing', to: 'deployed', stamp: 'deployed_at' },
  markDeployed: { from: 'processing', to: 'deployed', stamp: 'deployed_at' },
};

/** pending -> processing -> deployed. Check-in and cancel have their own actions. */
export async function advanceOrderStatus(orderId: string, action: OrderAction): Promise<ActionResult> {
  try {
    const step = ADVANCE[action];
    if (!step) return { success: false, error: 'This action is not a status change' };
    const { order, user } = await requireOrderMember(orderId);
    if (order.status !== step.from) {
      return { success: false, error: `Order is ${order.status}, not ${step.from}` };
    }
    const now = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from('orders')
      .update({ status: step.to, updated_at: now, ...(step.stamp ? { [step.stamp]: now } : {}) })
      .eq('id', orderId)
      .eq('agency_id', order.agency_id)
      .eq('status', step.from) // lost a race with another tab -> no row
      .select('id');
    if (error || !updated?.length) return { success: false, error: 'Order changed - refresh and try again' };
    const { error: logError } = await supabase.from('order_activities').insert({
      id: crypto.randomUUID(), order_id: orderId, action, status: step.to, user_id: user.id, created_at: now,
    });
    if (logError) console.error('order_activities insert failed:', orderId, logError.message);
    revalidateOrder(orderId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update order' };
  }
}

/** Emails the customer; the cancellation stands if it fails */
async function notifyCustomerOfCancellation(orderId: string, agencyId: string, refundAmount: number, refundedToCard: boolean) {
  try {
    const { data } = await supabase
      .from('orders')
      .select('order_number, customer_name, customer_email, event_date, agency:agencies(name, email, phone)')
      .eq('id', orderId).eq('agency_id', agencyId).single();
    const agency = (Array.isArray(data?.agency) ? data?.agency[0] : data?.agency) as { name: string; email: string | null; phone: string | null } | undefined;
    if (!data?.customer_email || !agency) return;
    await sendCustomerCancellationEmail({
      to: data.customer_email,
      customerName: data.customer_name ?? '',
      orderNumber: data.order_number,
      eventDay: data.event_date ? formatDay(String(data.event_date).slice(0, 10), true) : 'your event',
      refundAmount,
      refundedToCard,
      agencyName: agency.name,
      agencyEmail: agency.email,
      agencyPhone: agency.phone,
    });
  } catch (error) {
    console.error('Cancellation email failed (order stays cancelled):', orderId, error);
  }
}

const CHECK_IN_ERRORS: Record<string, string> = {
  not_deployed: 'Only deployed orders can be checked in',
  count_mismatch: 'Every sign must be counted as good, damaged or missing',
  order_not_found: 'Order not found',
};

/** Records returned / damaged / missing per sign, releases the order's sign
 *  hold and completes the order. Damaged and missing signs leave stock. */
export async function checkInOrder(input: {
  orderId: string;
  lines: { signId: string; good: number; damaged: number; missing: number; notes?: string }[];
  notes?: string;
}): Promise<ActionResult & { removedFromStock?: number }> {
  try {
    const { order, user } = await requireOrderMember(input.orderId);
    const { data, error } = await supabase.rpc('yce_check_in_order', {
      p_order_id: input.orderId,
      p_agency_id: order.agency_id,
      p_user_id: user.id,
      p_lines: input.lines.map(l => ({
        sign_id: l.signId, good: l.good, damaged: l.damaged, missing: l.missing, notes: l.notes ?? '',
      })),
      p_notes: input.notes ?? '',
    });
    const result = data as { ok?: boolean; reason?: string; removed_from_stock?: number } | null;
    if (error || !result?.ok) {
      return { success: false, error: CHECK_IN_ERRORS[result?.reason ?? ''] ?? 'Check-in failed' };
    }
    revalidateOrder(input.orderId);
    return { success: true, removedFromStock: result.removed_from_stock ?? 0 };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Check-in failed' };
  }
}

/**
 * Cancels a pending/processing order, releases its sign hold and, for orders
 * paid by card through Stripe, refunds the customer (direct charge on the
 * agency's account; the platform's $3 application fee is kept - decided
 * 2026-10-17). The refund runs first: if Stripe refuses it, nothing is
 * cancelled. Unpaid/demo orders just record the amount.
 */
export async function cancelOrder(input: CancelOrderInput): Promise<ActionResult & { refunded?: boolean }> {
  try {
    const { order, user } = await requireOrderMember(input.orderId);
    if (!['pending', 'processing'].includes(order.status)) {
      return {
        success: false,
        error: `A ${order.status} order can't be cancelled${order.status === 'deployed' ? ' - check its signs in instead' : ''}`,
      };
    }
    const { data: details } = await supabase
      .from('orders').select('total, payment_status')
      .eq('id', order.id).eq('agency_id', order.agency_id).single();
    const total = Number(details?.total) || 0;
    const refundAmount = input.refundType === 'none' ? 0
      : Math.round(Math.min(Math.max(Number(input.refundAmount) || 0, 0), total) * 100) / 100;

    // Paid by card through Stripe? (the checkout that created this order)
    const { data: checkout } = await supabase
      .from('booking_checkouts')
      .select('id, payment_intent_id, stripe_account_id')
      .eq('order_id', order.id).eq('agency_id', order.agency_id).eq('status', 'completed')
      .maybeSingle();

    let refunded = false;
    if (checkout?.payment_intent_id && refundAmount > 0) {
      try {
        await getStripe().refunds.create(
          {
            payment_intent: checkout.payment_intent_id,
            amount: toCents(refundAmount),
            refund_application_fee: false,
            reason: 'requested_by_customer',
            metadata: { yce_order_id: order.id, yce_cancelled_by: user.id },
          },
          { stripeAccount: checkout.stripe_account_id, idempotencyKey: `order-${order.id}-refund-${toCents(refundAmount)}` }
        );
        refunded = true;
      } catch (error) {
        const reason = (error as { message?: string })?.message ?? 'Stripe refused the refund';
        console.error('Cancel refund failed:', order.id, reason);
        return { success: false, error: `The refund didn't go through (${reason}). The order was not cancelled.` };
      }
    }

    const { data, error } = await supabase.rpc('yce_cancel_order', {
      p_order_id: input.orderId,
      p_agency_id: order.agency_id,
      p_user_id: user.id,
      p_reason: input.reason ?? '',
      p_refund_type: input.refundType,
    });
    const result = data as { ok?: boolean; reason?: string; status?: string } | null;
    if (error || !result?.ok) {
      if (refunded) console.error('REFUNDED BUT NOT CANCELLED - cancel it by hand:', order.id, error?.message ?? result);
      return {
        success: false,
        error: refunded
          ? 'The refund was issued, but the order could not be marked cancelled. Please try cancelling again.'
          : result?.reason === 'not_cancellable' ? `A ${result.status} order can't be cancelled` : 'Cancel failed',
      };
    }

    const { error: refundError } = await supabase
      .from('orders')
      .update({
        refund_amount: refundAmount,
        ...(refunded ? { payment_status: refundAmount >= total ? 'refunded' : 'partially_refunded' } : {}),
      })
      .eq('id', input.orderId).eq('agency_id', order.agency_id);
    if (refundError) console.error('refund_amount not saved:', input.orderId, refundError.message);
    if (refunded) {
      await supabase.from('booking_checkouts')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .eq('id', checkout!.id);
    }
    await notifyCustomerOfCancellation(order.id, order.agency_id, refundAmount, refunded);
    revalidateOrder(input.orderId);
    return { success: true, refunded };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Cancel failed' };
  }
}
