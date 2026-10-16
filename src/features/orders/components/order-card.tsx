'use client';

import { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  User, 
  Package, 
  DollarSign, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  FileText,
  X 
} from 'lucide-react';
import { OrderStatus, OrderAction, getAvailableActions, getActionLabel } from '../stateMachine';
import { countOrderSigns, formatAddress, formatCurrency, formatEventDate, getOrderStatusBadgeColor } from '../client-utils';
import { useOrderAction } from './use-order-action';

import { useRouter } from 'next/navigation';
import { useToast } from '@/shared/components/feedback/toast';
import { EditSignsModal } from './edit-signs-modal';
import { CancelOrderModal } from './cancel-order-modal';
import { useAgencySlug, getAgencyRoute } from '@/lib/navigation';

const DOCUMENT_LABELS: Record<string, string> = {
  pickTicket: 'Pick Ticket',
  orderSummary: 'Order Summary',
  pickupChecklist: 'Pickup Checklist',
};

/** orders.documents keeps every generation; show the latest of each type */
function latestDocuments(documents: unknown): { type: string; url: string }[] {
  if (!Array.isArray(documents)) return [];
  const byType = new Map<string, { type: string; url: string }>();
  for (const doc of documents) {
    if (doc?.type && doc?.url) byType.set(doc.type, { type: doc.type, url: doc.url });
  }
  return Object.keys(DOCUMENT_LABELS).flatMap(type => byType.get(type) ?? []);
}

interface OrderCardProps {
  order: any;
}

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const agencySlug = useAgencySlug();

  const availableActions = getAvailableActions(order.status as OrderStatus);
  const orderDocuments = latestDocuments(order.documents);
  const signCount = countOrderSigns(order);
  const statusColor = getOrderStatusBadgeColor(order.status);


  const handleViewDetails = () => {
    if (agencySlug) {
      router.push(`/${agencySlug}/orders/${order.id}`);
    } else {
      console.error('No agency context available for navigation - redirecting to routing page');
      router.push('/routing');
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { run: handleAction, isProcessing } = useOrderAction(order, () => setShowCancelModal(true));

  const handleEditSigns = () => {
    setShowEditModal(true);
  };

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-neutral-900">
              #{order.order_number}
            </h4>
            <Badge className={`${statusColor} text-xs mt-1`}>
              {order.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewDetails}
              className="p-2 h-10 w-10"
              title="View order details"
            >
              <Eye className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditSigns}
              className="p-2 h-10 w-10"
              disabled // Edit signs is not built yet (needs a stock re-check and re-hold)
              title="Editing signs isn't available yet"
            >
              <Edit className="h-5 w-5" />
            </Button>
            {['pending', 'processing'].includes(order.status) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelOrder}
                className="p-2 h-10 w-10 text-red-600 hover:text-red-700"
                title="Cancel order"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-neutral-600">
            <User className="h-4 w-4 mr-2" />
            <span>{order.customer_name}</span>
          </div>
          <div className="flex items-center text-sm text-neutral-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatEventDate(new Date(order.event_date))}</span>
          </div>
          <div className="flex items-center text-sm text-neutral-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="truncate">{formatAddress(order.event_address)}</span>
          </div>
        </div>

        {/* Order Details */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-neutral-600">
            <Package className="h-4 w-4 mr-1" />
            <span>{signCount} sign{signCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center font-semibold text-neutral-900">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Documents made for this order (newest of each kind) */}
        {orderDocuments.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <FileText className="h-4 w-4 text-neutral-500" />
            {orderDocuments.map(doc => (
              <a
                key={doc.type}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 py-1"
              >
                {DOCUMENT_LABELS[doc.type] ?? doc.type}
              </a>
            ))}
          </div>
        )}

        {/* Action Button */}
        {availableActions.length > 0 && (
          <div className="pt-2 border-t border-neutral-200 space-y-2">
            {availableActions.map((action) => (
              <Button
                key={action}
                variant={action === 'cancel' ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => handleAction(action)}
                disabled={isProcessing}
                className={`w-full ${action !== 'cancel' ? '!text-white' : ''}`}
              >
                {getActionLabel(action)}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <EditSignsModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        order={order}
      />
      
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        order={order}
      />
    </Card>
  );
}