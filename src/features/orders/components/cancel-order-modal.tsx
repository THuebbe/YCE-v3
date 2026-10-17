'use client';

import { useState } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from '@/shared/components/feedback/modal';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { formatCurrency, hoursUntilDelivery } from '../client-utils';
import { cancellationFee, cancellationPolicyOf } from '@/features/booking/terms';
import { cancelOrder } from '../actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/shared/components/feedback/toast';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export function CancelOrderModal({ isOpen, onClose, order }: CancelOrderModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const maxRefundAmount = Number(order.total) || 0; // dollars (numeric column comes back as a string)
  // What this order's own terms say for a customer cancellation
  const policy = cancellationPolicyOf(order.terms_snapshot);
  const fee = cancellationFee(maxRefundAmount, policy);
  const hoursLeft = hoursUntilDelivery(order);
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
        <ModalTitle className="flex items-center text-red-600">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Cancel Order #{order.order_number}
        </ModalTitle>
        <ModalDescription>
          This action cannot be undone. Please review the cancellation details below.
        </ModalDescription>
      </ModalHeader>

      <ModalContent className="space-y-6">
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Customer:</span>
              <span className="ml-2 text-gray-900">{order.customer_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Event Date:</span>
              <span className="ml-2 text-gray-900">
                {new Date(order.event_date).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Amount:</span>
              <span className="ml-2 text-gray-900 font-medium">
                {formatCurrency(order.total)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 text-gray-900">{order.status}</span>
            </div>
          </div>
        </div>

        {/* What this order's terms say */}
        <div className={`${insideNotice ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-800'} border rounded-lg p-4`}>
          <div className="flex items-start text-sm">
            <Clock className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
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
          <Label className="text-base font-medium">Refund Options</Label>
          <RadioGroup
            value={refundType}
            onValueChange={(value) => setRefundType(value as 'full' | 'partial' | 'none')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id="full" />
              <label 
                htmlFor="full" 
                className="text-sm cursor-pointer flex items-center"
              >
                <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                Full Refund ({formatCurrency(maxRefundAmount)})
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="partial" id="partial" />
              <label htmlFor="partial" className="text-sm cursor-pointer">
                Refund minus cancellation fee ({formatCurrency(maxRefundAmount - fee)})
              </label>
            </div>

            {refundType === 'partial' && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="partialAmount" className="text-sm">
                  Refund amount (you can change it; max {formatCurrency(maxRefundAmount)})
                </Label>
                <Input
                  id="partialAmount"
                  type="number"
                  min="0"
                  max={maxRefundAmount}
                  step="0.01"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-32"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <label htmlFor="none" className="text-sm cursor-pointer">
                No Refund
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Cancellation Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">Cancellation Reason (Optional)</Label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for cancellation..."
            className="w-full p-3 border border-gray-300 rounded-md resize-none"
            rows={3}
            maxLength={500}
          />
          <div className="text-right text-xs text-gray-500">
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
          Keep Order
        </Button>
        <Button
          variant="error"
          onClick={handleCancel}
          disabled={isProcessing}
          className="bg-red-600 hover:bg-red-700"
        >
          {isProcessing ? 'Cancelling...' : 'Cancel Order'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}