'use client';

import { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Package, 
  DollarSign, 
  Clock, 
  Edit,
  X,
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { OrderStatus, OrderAction, getAvailableActions, getActionLabel } from '../stateMachine';
import { formatCurrency, formatEventDate, formatDate, getOrderStatusBadgeColor } from '../client-utils';
import { generatePickTicket, generateOrderSummary, generatePickupChecklist } from '../actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/shared/components/feedback/toast';
import { EditSignsModal } from './edit-signs-modal';
import { CancelOrderModal } from './cancel-order-modal';

interface OrderDetailsProps {
  order: any;
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState<string | null>(null);
  const [documents, setDocuments] = useState(order.documents || []);
  const router = useRouter();
  const { toast } = useToast();

  const availableActions = getAvailableActions(order.status as OrderStatus);
  const statusColor = getOrderStatusBadgeColor(order.status);
  const signCount = order.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

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

  const handleBack = () => {
    router.push('/dashboard/orders');
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleEditSigns = () => {
    setShowEditModal(true);
  };

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const handleGenerateDocument = async (type: 'pickTicket' | 'orderSummary' | 'pickupChecklist') => {
    if (isGeneratingDocument) return;
    
    setIsGeneratingDocument(type);
    try {
      let result;
      switch (type) {
        case 'pickTicket':
          result = await generatePickTicket(order.id);
          break;
        case 'orderSummary':
          result = await generateOrderSummary(order.id);
          break;
        case 'pickupChecklist':
          result = await generatePickupChecklist(order.id);
          break;
      }

      if (result.success) {
        // Update local documents state
        const newDocument = {
          type: result.result.type,
          url: result.result.url,
          filename: result.result.filename,
          generatedAt: result.result.generatedAt.toISOString()
        };
        setDocuments(prev => [...prev, newDocument]);

        toast({
          title: 'Document Generated',
          description: `${result.result.filename} has been generated successfully`,
          variant: 'success'
        });
      } else {
        const errorMessage = result.error || 'Failed to generate document';
        const isConfigError = errorMessage.includes('BLOB_READ_WRITE_TOKEN');
        
        toast({
          title: 'Generation Failed',
          description: isConfigError 
            ? 'Document generation is not configured. Please contact support.'
            : errorMessage,
          variant: 'error'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const isConfigError = errorMessage.includes('BLOB_READ_WRITE_TOKEN');
      
      toast({
        title: 'Error',
        description: isConfigError 
          ? 'Document generation is not configured. Please contact support.'
          : 'An unexpected error occurred',
        variant: 'error'
      });
    } finally {
      setIsGeneratingDocument(null);
    }
  };

  const getDocumentOfType = (type: string) => {
    return documents.find((doc: any) => doc.type === type);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={`${statusColor} text-sm`}>
                {order.status}
              </Badge>
              <span className="text-sm text-gray-500">
                Created {formatDate(new Date(order.createdAt))}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={handleEditSigns}
            disabled={['completed', 'cancelled'].includes(order.status)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Signs
          </Button>
          <Button
            variant="secondary"
            onClick={handleCancelOrder}
            disabled={['completed', 'cancelled'].includes(order.status)}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-900">{order.customerName}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-900">{order.customerEmail}</span>
                  </div>
                  {order.customerPhone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-gray-900">{order.customerPhone}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-900">{formatEventDate(new Date(order.eventDate))}</span>
                  </div>
                  <div className="flex items-start text-sm">
                    <MapPin className="h-4 w-4 mr-3 text-gray-400 mt-0.5" />
                    <span className="text-gray-900">{order.eventAddress}</span>
                  </div>
                  {order.eventType && (
                    <div className="flex items-center text-sm">
                      <Package className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-gray-900">{order.eventType}</span>
                    </div>
                  )}
                </div>
              </div>
              {order.specialInstructions && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Special Instructions:</strong> {order.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Order Items */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Items
              </h3>
              <div className="space-y-4">
                {order.orderItems?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {item.sign.imageUrl && (
                        <img
                          src={item.sign.imageUrl}
                          alt={item.sign.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{item.sign.name}</h4>
                        <p className="text-sm text-gray-600">{item.sign.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </div>
                      <div className="font-medium text-gray-900">
                        {formatCurrency(item.lineTotal)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Order Activity */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Activity
              </h3>
              <div className="space-y-4">
                {order.activities?.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : activity.status === 'cancelled' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {activity.user.firstName} {activity.user.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(new Date(activity.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.notes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sign Count</span>
                  <span className="text-gray-900">{signCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          {availableActions.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Actions
                </h3>
                <div className="space-y-2">
                  {availableActions.map((action) => (
                    <Button
                      key={action}
                      variant={action === 'cancel' ? 'secondary' : 'primary'}
                      onClick={() => handleAction(action)}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {getActionLabel(action)}
                    </Button>
                  ))}
                  
                  {/* Mobile Check-In Link for deployed orders */}
                  {order.status === 'deployed' && (
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/dashboard/orders/${order.id}/check-in`)}
                      className="w-full mt-2"
                    >
                      📱 Mobile Check-In
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Documents
              </h3>
              <div className="space-y-2">
                {/* Pick Ticket */}
                {getDocumentOfType('pickTicket') ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => window.open(getDocumentOfType('pickTicket').url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Pick Ticket
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleGenerateDocument('pickTicket')}
                    disabled={isGeneratingDocument === 'pickTicket'}
                  >
                    {isGeneratingDocument === 'pickTicket' ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Pick Ticket
                      </>
                    )}
                  </Button>
                )}

                {/* Order Summary */}
                {getDocumentOfType('orderSummary') ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => window.open(getDocumentOfType('orderSummary').url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Order Summary
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleGenerateDocument('orderSummary')}
                    disabled={isGeneratingDocument === 'orderSummary'}
                  >
                    {isGeneratingDocument === 'orderSummary' ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Order Summary
                      </>
                    )}
                  </Button>
                )}

                {/* Pickup Checklist */}
                {getDocumentOfType('pickupChecklist') ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => window.open(getDocumentOfType('pickupChecklist').url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Pickup Checklist
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleGenerateDocument('pickupChecklist')}
                    disabled={isGeneratingDocument === 'pickupChecklist'}
                  >
                    {isGeneratingDocument === 'pickupChecklist' ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Pickup Checklist
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
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
    </div>
  );
}