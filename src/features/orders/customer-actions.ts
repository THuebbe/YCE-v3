'use server';

import { revalidatePath } from 'next/cache';
import { agencyActorId, loadCancelQuote } from './customer-cancel';
import { performCancellation } from './cancellation';

/**
 * The customer cancels from their emailed link. Everything is recomputed
 * here from the order's saved terms: the browser only says "yes".
 */
export async function cancelBookingAsCustomer(input: { agencySlug: string; orderId: string; token: string }):
  Promise<{ success: true; refund: number; refunded: boolean } | { success: false; error: string }> {
  try {
    const quote = await loadCancelQuote(input.agencySlug, input.orderId, input.token);
    if (!quote) return { success: false, error: 'This cancel link is not valid. Please contact the agency.' };
    if (!quote.canCancel) {
      return { success: false, error: quote.status === 'cancelled' ? 'This booking is already cancelled.' : 'Your signs are already out, so this booking can\'t be cancelled online. Please contact the agency.' };
    }
    const actor = await agencyActorId(quote.agencyId);
    if (!actor) return { success: false, error: 'Please contact the agency to cancel.' };
    const outcome = await performCancellation({
      orderId: quote.orderId,
      agencyId: quote.agencyId,
      total: quote.total,
      refundAmount: quote.refund,
      refundType: quote.refund <= 0 ? 'none' : quote.refund >= quote.total ? 'full' : 'partial',
      actorUserId: actor,
      reason: 'Cancelled by the customer online',
      cancelledBy: 'customer',
    });
    if (!outcome.success) return { success: false, error: outcome.error.replace('The order was not cancelled.', 'Your booking was not cancelled. Please try again or contact the agency.') };
    revalidatePath('/[agency]/(app)/orders', 'page');
    return { success: true, refund: quote.refund, refunded: outcome.refunded };
  } catch (error) {
    console.error('cancelBookingAsCustomer failed:', input.orderId, error);
    return { success: false, error: 'Something went wrong. Please contact the agency.' };
  }
}
