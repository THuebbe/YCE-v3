import { Container } from '@/shared/components/layout/container';
import { OrderDetails } from '@/features/orders/components/order-details';

interface OrderDetailPageProps {
  params: {
    orderId: string;
  };
}

export async function generateMetadata() {
  return {
    title: `Order Details - YardCard Elite`,
    description: `Order management for YardCard Elite`
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  // Await params to fix Next.js 15 requirement
  const { orderId } = await params;
  
  // Temporary mock data to test the UI
  const mockOrder = {
    id: orderId,
    orderNumber: 'WBA0001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '555-123-4567',
    eventDate: new Date('2024-01-15'),
    eventAddress: '123 Main St, Anytown, ST 12345',
    eventType: 'Birthday Party',
    specialInstructions: 'Please place signs near the front entrance',
    status: 'pending',
    subtotal: 9500,
    total: 9500,
    createdAt: new Date('2024-01-01'),
    deployedAt: null,
    completedAt: null,
    cancelledAt: null,
    orderItems: [
      {
        id: '1',
        signId: 'sign1',
        quantity: 2,
        unitPrice: 2500,
        lineTotal: 5000,
        sign: {
          id: 'sign1',
          name: 'Happy Birthday',
          category: 'Birthday',
          imageUrl: '/api/placeholder/150/100'
        }
      },
      {
        id: '2',
        signId: 'sign2',
        quantity: 1,
        unitPrice: 4500,
        lineTotal: 4500,
        sign: {
          id: 'sign2',
          name: 'Celebration Banner',
          category: 'Birthday',
          imageUrl: '/api/placeholder/150/100'
        }
      }
    ],
    agency: {
      id: 'agency1',
      name: 'West Branch Agency',
      slug: 'west-branch'
    },
    activities: [
      {
        id: 'activity1',
        action: 'created',
        status: 'pending',
        notes: 'Order created from booking',
        createdAt: new Date('2024-01-01'),
        user: {
          id: 'user1',
          firstName: 'System',
          lastName: 'Admin',
          email: 'admin@example.com'
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container size="lg" spacing="wide">
        <div className="py-8">
          <OrderDetails order={mockOrder} />
        </div>
      </Container>
    </div>
  );
}