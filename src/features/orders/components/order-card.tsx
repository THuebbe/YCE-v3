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
  X 
} from 'lucide-react';
import { OrderStatus, OrderAction, getAvailableActions, getActionLabel } from '../stateMachine';
import { formatCurrency, formatEventDate, getOrderStatusBadgeColor } from '../client-utils';

// Helper function to format address
const formatAddress = (address: string | object): string => {
  if (typeof address === 'string') {
    try {
      // Try to parse if it's a JSON string
      const parsed = JSON.parse(address);
      return formatAddressObject(parsed);
    } catch {
      // If parsing fails, return the string as-is
      return address;
    }
  } else if (typeof address === 'object' && address !== null) {
    return formatAddressObject(address);
  }
  return 'Address not available';
};

const formatAddressObject = (addr: any): string => {
  const parts = [];
  if (addr.street) parts.push(addr.street);
  if (addr.city) parts.push(addr.city);
  if (addr.state) parts.push(addr.state);
  if (addr.zip) parts.push(addr.zip);
  return parts.join(', ') || 'Address not available';
};
// import { advanceOrderStatus } from '../actions'; // Temporarily disabled to fix client/server import issue
import { useRouter } from 'next/navigation';
import { useToast } from '@/shared/components/feedback/toast';
import { EditSignsModal } from './edit-signs-modal';
import { CancelOrderModal } from './cancel-order-modal';
import { useAgencySlug, getAgencyRoute } from '@/lib/navigation';

interface OrderCardProps {
  order: any;
}

export function OrderCard({ order }: OrderCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const agencySlug = useAgencySlug();

  const availableActions = getAvailableActions(order.status as OrderStatus);
  const signCount = order.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  const statusColor = getOrderStatusBadgeColor(order.status);

  const handleAction = async (action: OrderAction) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Temporary mock action for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Demo Mode',
        description: `Would ${getActionLabel(action).toLowerCase()} - this is demo data`,
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Demo mode - no real actions performed',
        variant: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
              #{order.orderNumber}
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
              title="Edit signs"
            >
              <Edit className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelOrder}
              className="p-2 h-10 w-10 text-red-600 hover:text-red-700"
              title="Cancel order"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-neutral-600">
            <User className="h-4 w-4 mr-2" />
            <span>{order.customerName}</span>
          </div>
          <div className="flex items-center text-sm text-neutral-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatEventDate(new Date(order.eventDate))}</span>
          </div>
          <div className="flex items-center text-sm text-neutral-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="truncate">{formatAddress(order.eventAddress)}</span>
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