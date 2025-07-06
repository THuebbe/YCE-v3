import { prisma } from '@/lib/db/prisma';
import { getCurrentTenant } from '@/lib/tenant-context';
// import { Order } from '@prisma/client';

export async function generateOrderNumber(agencyId: string): Promise<{ orderNumber: string; internalNumber: string }> {
  // Get the agency's abbreviation for the order number prefix
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { name: true }
  });

  if (!agency) {
    throw new Error('Agency not found');
  }

  // Create a 3-letter abbreviation from the agency name
  const abbreviation = agency.name
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase())
    .join('')
    .padEnd(3, 'A')
    .substring(0, 3);

  // Get the next sequential number for this agency
  const lastOrder = await prisma.order.findFirst({
    where: { agencyId },
    orderBy: { internalNumber: 'desc' },
    select: { internalNumber: true }
  });

  const nextNumber = lastOrder && lastOrder.internalNumber 
    ? parseInt(lastOrder.internalNumber.split('-')[1]) + 1 
    : 1;
  const paddedNumber = nextNumber.toString().padStart(4, '0');

  return {
    orderNumber: `${abbreviation}${paddedNumber}`, // Customer-facing: e.g., "WBA0001"
    internalNumber: `${abbreviation}-${paddedNumber}` // Internal: e.g., "WBA-0001"
  };
}

export async function requireOrder(orderId: string): Promise<any> {
  const agencyId = await getCurrentTenant();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      agencyId
    }
  });

  if (!order) {
    throw new Error('Order not found or access denied');
  }

  return order;
}

export async function requireOrderWithDetails(orderId: string) {
  const agencyId = await getCurrentTenant();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      agencyId
    },
    include: {
      orderItems: {
        include: {
          sign: {
            select: {
              id: true,
              name: true,
              category: true,
              imageUrl: true
            }
          }
        }
      },
      agency: {
        select: {
          id: true,
          name: true,
          slug: true,
          email: true
        }
      },
      activities: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!order) {
    throw new Error('Order not found or access denied');
  }

  return order;
}

export function calculateOrderTotal(items: { unitPrice: number; quantity: number }[]): number {
  return items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
}

export function formatOrderNumber(orderNumber: string): string {
  // If it's already formatted, return as-is
  if (orderNumber.includes('-')) {
    return orderNumber;
  }
  
  // Otherwise, format it nicely
  return orderNumber.replace(/(\w{3})(\d{4})/, '$1-$2');
}

export function getOrderStatusBadgeColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'deployed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function canCancelOrder(order: any): boolean {
  // Can cancel if not completed or already cancelled
  return !['completed', 'cancelled'].includes(order.status);
}

export function isWithinCancellationWindow(order: any): boolean {
  // Check if order is within 24-hour cancellation window
  const orderTime = new Date(order.createdAt);
  const now = new Date();
  const hoursSinceOrder = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceOrder <= 24;
}

export function shouldAutoRefund(order: any): boolean {
  return canCancelOrder(order) && isWithinCancellationWindow(order);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount / 100); // Convert from cents to dollars
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export async function getOrderWithDetails(orderId: string) {
  const agencyId = await getCurrentTenant();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      agencyId
    },
    include: {
      orderItems: {
        include: {
          sign: true
        }
      },
      activities: {
        include: {
          user: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      signCheckIns: {
        include: {
          sign: true,
          checkedInBy: true
        }
      },
      agency: true,
      createdBy: true
    }
  });

  if (!order) {
    throw new Error('Order not found or access denied');
  }

  return order;
}

export async function updateOrderDocuments(
  orderId: string,
  documentMetadata: {
    type: string;
    url: string;
    filename: string;
    generatedAt: string;
  }
) {
  const agencyId = await getCurrentTenant();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      agencyId
    },
    select: { documents: true }
  });

  if (!order) {
    throw new Error('Order not found or access denied');
  }

  // Parse existing documents or initialize empty array
  const existingDocuments = Array.isArray(order.documents) 
    ? order.documents as any[]
    : [];

  // Add new document
  const updatedDocuments = [...existingDocuments, documentMetadata];

  // Update order with new documents
  await prisma.order.update({
    where: { id: orderId },
    data: {
      documents: updatedDocuments
    }
  });

  return updatedDocuments;
}

export async function getOrderDocuments(orderId: string) {
  const agencyId = await getCurrentTenant();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      agencyId
    },
    select: { documents: true }
  });

  if (!order) {
    throw new Error('Order not found or access denied');
  }

  return Array.isArray(order.documents) ? order.documents as any[] : [];
}