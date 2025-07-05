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
// import { advanceOrderStatus } from '../actions'; // Temporarily disabled to fix client/server import issue
import { useRouter } from 'next/navigation';
import { useToast } from '@/shared/components/feedback/toast';
import { EditSignsModal } from './edit-signs-modal';
import { CancelOrderModal } from './cancel-order-modal';

interface OrderCardProps {
  order: any;
}

export function OrderCard({ order }: OrderCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
    router.push(`/dashboard/orders/${order.id}`);
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
            <h4 className="font-semibold text-gray-900">
              #{order.orderNumber}
            </h4>
            <Badge className={`${statusColor} text-xs mt-1`}>
              {order.status}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewDetails}
              className="p-1 h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditSigns}
              className="p-1 h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelOrder}
              className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            <span>{order.customerName}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatEventDate(new Date(order.eventDate))}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="truncate">{order.eventAddress}</span>
          </div>
        </div>

        {/* Order Details */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <Package className="h-4 w-4 mr-1" />
            <span>{signCount} sign{signCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center font-semibold text-gray-900">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Action Button */}
        {availableActions.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            {availableActions.map((action) => (
              <Button
                key={action}
                variant={action === 'cancel' ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => handleAction(action)}
                disabled={isProcessing}
                className="w-full"
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