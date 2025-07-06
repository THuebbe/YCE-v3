// Temporarily removing Prisma imports due to build issues
// import { Order, OrderItem, Sign, Agency, User } from '@prisma/client';
import { OrderStatus, OrderAction } from './stateMachine';

export interface CreateOrderInput {
  holdId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  eventDate: Date;
  eventAddress: string;
  eventType?: string;
  specialInstructions?: string;
  paymentIntentId?: string;
  stripePaymentIntentId?: string;
}

export interface OrderWithDetails {
  id: string;
  orderNumber: string;
  status: string;
  items: any[];
  agency: any;
  activities: OrderActivity[];
  // Add other properties as needed
}

export interface OrderActivity {
  id: string;
  orderId: string;
  userId: string;
  action: string;
  status: OrderStatus;
  notes?: string;
  createdAt: Date;
  user: { id: string; firstName: string; lastName: string; email: string };
}

export interface OrderDocument {
  id: string;
  type: 'pickTicket' | 'orderSummary' | 'pickupChecklist';
  url: string;
  generatedAt: Date;
}

export interface OrderMetrics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  deployedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  monthlyRevenue: number;
  averageOrderValue: number;
}

export interface OrderFilters {
  status?: OrderStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  customerId?: string;
  eventType?: string;
  search?: string;
}

export interface OrderSortOptions {
  field: 'orderNumber' | 'customerName' | 'eventDate' | 'totalAmount' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface CancelOrderInput {
  orderId: string;
  reason?: string;
  refundAmount?: number;
  refundType: 'full' | 'partial' | 'none';
}

export interface CheckInSignsInput {
  orderId: string;
  signCheckins: {
    signId: string;
    condition: 'good' | 'damaged' | 'missing';
    notes?: string;
    damagePhotos?: string[];
  }[];
  additionalNotes?: string;
}

export interface EditSignsInput {
  orderId: string;
  changes: {
    add?: { signId: string; quantity: number }[];
    remove?: { signId: string; quantity: number }[];
    update?: { signId: string; newQuantity: number }[];
  };
  reason?: string;
}

export type OrderCardProps = {
  order: OrderWithDetails;
  onStatusChange: (orderId: string, action: OrderAction) => void;
  onViewDetails: (orderId: string) => void;
  onEdit: (orderId: string) => void;
  onCancel: (orderId: string) => void;
};

export type OrderBoardColumn = {
  status: OrderStatus;
  title: string;
  orders: OrderWithDetails[];
  color: string;
};