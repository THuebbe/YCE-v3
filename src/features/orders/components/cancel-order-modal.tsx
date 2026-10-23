'use client';

import { useState } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from '@/shared/components/feedback/modal';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { NumberField } from '@/shared/components/ui/number-field';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { TriangleAlert, Clock } from 'lucide-react';
import { formatDay } from '@/features/booking/booking-rules';
import { formatCurrency, hoursUntilDelivery } from '../client-utils';
import { cancellationFee, cancellationPolicyOf } from '@/features/booking/terms';
import { cancelOrder } from '../actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/shared/components/feedback/toast';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  /** The agency's time zone (operating_hours.timeZone) */
  timeZone?: string;
}

export function CancelOrderModal({ isOpen, onClose, order, timeZone }: CancelOrderModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const maxRefundAmount = Number(order.total) || 0; // dollars (numeric column comes back as a string)
  // What this order's own terms say for a customer cancellation
  const policy = cancellationPolicyOf(order.terms_snapshot);
  const fee = cancellationFee(maxRefundAmount, policy);
  const hoursLeft = hoursUntilDelivery(order, timeZone);
  const insideNotice = hoursLeft < policy.noticeHours;
  const suggested: 'partial' | 'none' = insideNotice ? 'none' : 'partial';
  const [refundType, setRefundType] = useState<'full' | 'partial' | 'none'>(suggested);
  const [partialAmount, setPartialAmount] = useState((maxRefundAmount - fee).toFixed(2));
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const paidByCard = ['paid', 'succeeded'].includes(String(order.payment_status));

  const handleCancel = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const refundAmount = refundType === 'full'
        ? maxRefundAmount
        : refundType === 'partial'
          ? Math.min(parseFloat(partialAmount) || 0, maxRefundAmount)
          : 0;

      const result = await cancelOrder({ orderId: order.id, reason, refundType, refundAmount });
      if (!result.success) {
        toast({ title: 'Could not cancel order', description: result.error, variant: 'error' });
        return;
      }

      toast({
        title: 'Order cancelled',
        description: `Order #${order.order_number} is cancelled and its signs are free again.${
          refundAmount <= 0 ? ''
            : 'refunded' in result && result.refunded
              ? ` ${formatCurrency(refundAmount)} refunded to the customer's card.`
              : ` Refund of ${formatCurrency(refundAmount)} recorded - this order wasn't paid by card here, so pay it back the way the customer paid.`
        }`,
        variant: 'success'
      });

      resetModal();
      onClose();
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel order',
        variant: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setRefundType(suggested);
    setPartialAmount((maxRefundAmount - fee).toFixed(2));
    setReason('');
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetModal();
      onClose();
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      size="lg"
      className="max-w-2xl"
    >
      <ModalHeader>
        <ModalTitle className="flex items-center gap-2 text-danger">
          <TriangleAlert className="size-5" aria-hidden />
          Cancel order #{order.order_number}?
        </ModalTitle>
        <ModalDescription>
          This can&apos;t be undone. The signs are freed for other bookings.
        </ModalDescription>
      </ModalHeader>

      <ModalContent className="space-y-6">
        {/* Order Summary */}
        <dl className="grid grid-cols-1 gap-2 rounded-control bg-surface-sunken p-4 text-fine sm:grid-cols-2">
          <div><dt className="text-fg-muted">Customer</dt><dd className="font-semibold">{order.customer_name}</dd></div>
          <div><dt className="text-fg-muted">Event</dt><dd className="font-semibold">{order.event_date ? formatDay(String(order.event_date).slice(0, 10)) : 'Not set'}</dd></div>
          <div><dt className="text-fg-muted">Paid</dt><dd className="font-semibold">{formatCurrency(order.total)}</dd></div>
        </dl>

        {/* What this order's terms say */}
        <div className={`${insideNotice ? 'border-caution bg-caution-soft text-caution' : 'border-line bg-positive-soft text-positive'} rounded-control border p-4`}>
          <div className="flex items-start gap-2 text-fine">
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {insideNotice
                ? `Delivery is less than ${policy.noticeHours} hours away. If the customer is cancelling, their terms say no refund.`
                : `If the customer is cancelling, their terms give a refund minus a ${formatCurrency(fee)} cancellation fee (${policy.feePercent}% or ${formatCurrency(policy.feeMinimum)}, whichever is more).`}
              {' '}If you can&apos;t deliver or install (including weather), give a full refund.
              {paidByCard ? ' The refund goes back to their card.' : ''}
            </span>
          </div>
        </div>

        {/* Refund Options */}
        <div className="space-y-4">
          <Label className="text-copy font-bold">Refund</Label>
          <RadioGroup
            value={refundType}
            onValueChange={(value) => setRefundType(value as 'full' | 'partial' | 'none')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id="full" />
              <label 
                htmlFor="full" 
                className="cursor-pointer"
              >
                Full refund ({formatCurrency(maxRefundAmount)})
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="partial" id="partial" />
              <label htmlFor="partial" className="cursor-pointer">
                Refund minus cancellation fee ({formatCurrency(maxRefundAmount - fee)})
              </label>
            </div>

            {refundType === 'partial' && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="partialAmount" className="text-fine">
                  Refund amount (you can change it; max {formatCurrency(maxRefundAmount)})
                </Label>
                <NumberField
                  id="partialAmount"
                  decimals
                  prefix="$"
                  value={partialAmount}
                  onValueChange={setPartialAmount}
                  placeholder="0.00"
                  className="w-36"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <label htmlFor="none" className="cursor-pointer">
                No refund
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Cancellation Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">Reason (optional, kept with the order)</Label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full resize-none rounded-control border border-line-strong bg-surface p-3 text-copy focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
            rows={3}
            maxLength={500}
          />
          <div className="text-right text-fine text-fg-muted">
            {reason.length}/500 characters
          </div>
        </div>

      </ModalContent>

      <ModalFooter>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={isProcessing}
        >
          Keep order
        </Button>
        <Button
          variant="error"
          onClick={handleCancel}
          loading={isProcessing}
        >
          {isProcessing ? 'Cancelling…' : 'Cancel order'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}