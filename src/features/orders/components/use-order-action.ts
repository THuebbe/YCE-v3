'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/shared/components/feedback/toast';
import { useAgencySlug } from '@/lib/navigation';
import { advanceOrderStatus, generateOrderSummary, generatePickTicket } from '../actions';
import { getActionLabel, OrderAction } from '../stateMachine';

/**
 * One handler for the order card and the order details page: status
 * changes (with their document), check-in (its own screen) and cancel (the
 * caller's modal).
 */
export function useOrderAction(order: { id: string }, onCancel: () => void) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const agencySlug = useAgencySlug();

  const run = async (action: OrderAction) => {
    if (isProcessing) return;
    if (action === 'cancel') return onCancel();
    if (action === 'checkInSigns' || action === 'complete') {
      router.push(`/${agencySlug}/orders/${order.id}/check-in`);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await advanceOrderStatus(order.id, action);
      if (!result.success) {
        toast({ title: 'Could not update order', description: result.error, variant: 'error' });
        return;
      }
      // The document this step is named after; the status change stands even
      // if generating it fails (it can be regenerated from the order page)
      const document = action === 'generatePickTicket' ? generatePickTicket
        : action === 'printOrderSummary' ? generateOrderSummary
        : null;
      const docResult = document ? await document(order.id).catch(() => null) : null;
      toast({
        title: getActionLabel(action),
        description: document && !docResult?.success
          ? 'Status updated, but the document failed - generate it from the order page'
          : 'Order updated',
        variant: document && !docResult?.success ? 'warning' : 'success',
      });
      router.refresh();
    } finally {
      setIsProcessing(false);
    }
  };

  return { run, isProcessing };
}
