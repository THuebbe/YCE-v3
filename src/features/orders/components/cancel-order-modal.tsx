'use client';

import { useState } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from '@/shared/components/feedback/modal';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { formatCurrency, shouldAutoRefund, isWithinCancellationWindow } from '../client-utils';
// import { cancelOrder } from '../actions'; // Temporarily disabled to fix client/server import issue
import { useToast } from '@/shared/components/feedback/toast';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export function CancelOrderModal({ isOpen, onClose, order }: CancelOrderModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial' | 'none'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const canAutoRefund = shouldAutoRefund(order);
  const withinCancellationWindow = isWithinCancellationWindow(order);
  const maxRefundAmount = order.total;

  const handleCancel = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const refundAmount = refundType === 'full' 
        ? maxRefundAmount 
        : refundType === 'partial' 
          ? Math.min(parseInt(partialAmount) * 100 || 0, maxRefundAmount)
          : 0;

      // Temporary mock action for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Demo Mode - Order Cancel',
        description: `Would cancel Order #${order.orderNumber}${refundAmount > 0 ? ` with ${formatCurrency(refundAmount)} refund` : ''} - this is demo data`,
        variant: 'success'
      });

      onClose();
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
    setRefundType('full');
    setPartialAmount('');
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
          Cancel Order #{order.orderNumber}
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
              <span className="ml-2 text-gray-900">{order.customerName}</span>
            </div>
            <div>
              <span className="text-gray-600">Event Date:</span>
              <span className="ml-2 text-gray-900">
                {new Date(order.eventDate).toLocaleDateString()}
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

        {/* Cancellation Window Notice */}
        {withinCancellationWindow ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-800">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                Order is within 24-hour cancellation window - eligible for automatic refund
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center text-amber-800">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                Order is past 24-hour cancellation window - manual refund processing required
              </span>
            </div>
          </div>
        )}

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
                {canAutoRefund && (
                  <span className="ml-2 text-xs text-green-600 font-medium">
                    Auto-processed
                  </span>
                )}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="partial" id="partial" />
              <label htmlFor="partial" className="text-sm cursor-pointer">
                Partial Refund
              </label>
            </div>

            {refundType === 'partial' && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="partialAmount" className="text-sm">
                  Refund Amount (max: {formatCurrency(maxRefundAmount)})
                </Label>
                <Input
                  id="partialAmount"
                  type="number"
                  min="0"
                  max={maxRefundAmount / 100}
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

        {/* Warning for deployed orders */}
        {order.status === 'deployed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-2" />
              <div className="text-sm text-red-800">
                <strong>Warning:</strong> This order is currently deployed. 
                Cancelling will require immediate sign retrieval from the field.
                Post-deployment cancellations are typically treated as completed orders.
              </div>
            </div>
          </div>
        )}
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