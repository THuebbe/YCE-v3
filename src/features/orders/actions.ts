'use server';

import { generateOrderDocument, DocumentType } from './documents/generator';
import { getOrderWithDetails, updateOrderDocuments } from './utils';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/db/supabase-client';
import { requireAgencyMember } from '@/features/auth/guards';
import { requireFeature } from '@/features/billing/server';
import { performCancellation } from './cancellation';
import { assessFees } from './fees';
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

    const outcome = await performCancellation({
      orderId: order.id,
      agencyId: order.agency_id,
      total,
      refundAmount,
      refundType: input.refundType,
      actorUserId: user.id,
      reason: input.reason ?? '',
    });
    if (!outcome.success) return outcome;
    const { refunded } = outcome;
    revalidateOrder(input.orderId);
    return { success: true, refunded };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Cancel failed' };
  }
}

/** After check-in: charge the late/damage fees the agency confirmed (or waive with 0) */
export async function assessOrderFees(input: { orderId: string; lateAmount: number; damageAmount: number }) {
  try {
    const { order, user } = await requireOrderMember(input.orderId);
    const { data: agency } = await supabase.from('agencies').select('slug').eq('id', order.agency_id).single();
    const result = await assessFees({
      orderId: order.id,
      agencyId: order.agency_id,
      agencySlug: agency?.slug ?? '',
      lateAmount: input.lateAmount,
      damageAmount: input.damageAmount,
      userId: user.id,
    });
    revalidateOrder(input.orderId);
    return result;
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'Could not charge the fees' };
  }
}
