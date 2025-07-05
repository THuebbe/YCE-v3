import { getOrdersByStatus } from '../actions';
import { OrderStatus } from '../stateMachine';
import { OrderColumn } from './order-column';
import { EmptyOrdersState } from './empty-orders-state';

const ORDER_COLUMNS: { status: OrderStatus; title: string; description: string }[] = [
  {
    status: 'pending',
    title: 'Pending',
    description: 'Orders awaiting pick ticket generation'
  },
  {
    status: 'processing',
    title: 'Processing',
    description: 'Orders being prepared for deployment'
  },
  {
    status: 'deployed',
    title: 'Deployed',
    description: 'Signs deployed in the field'
  },
  {
    status: 'completed',
    title: 'Completed',
    description: 'Orders completed successfully'
  }
];

export async function OrdersBoard() {
  // Mock data for testing - replace with real data later
  const mockOrders = [
    {
      id: 'order1',
      orderNumber: 'WBA0001',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      eventDate: new Date('2024-01-15'),
      eventAddress: '123 Main St, Anytown, ST 12345',
      status: 'pending',
      total: 9500,
      createdAt: new Date('2024-01-01'),
      orderItems: [
        { quantity: 2, sign: { name: 'Happy Birthday', category: 'Birthday' } }
      ]
    },
    {
      id: 'order2',
      orderNumber: 'WBA0002',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      eventDate: new Date('2024-01-20'),
      eventAddress: '456 Oak Ave, Somewhere, ST 67890',
      status: 'processing',
      total: 12000,
      createdAt: new Date('2024-01-02'),
      orderItems: [
        { quantity: 3, sign: { name: 'Graduation', category: 'Graduation' } }
      ]
    },
    {
      id: 'order3',
      orderNumber: 'WBA0003',
      customerName: 'Bob Johnson',
      customerEmail: 'bob@example.com',
      eventDate: new Date('2024-01-25'),
      eventAddress: '789 Pine St, Elsewhere, ST 13579',
      status: 'deployed',
      total: 7500,
      createdAt: new Date('2024-01-03'),
      orderItems: [
        { quantity: 1, sign: { name: 'Welcome Home', category: 'General' } }
      ]
    }
  ];

  // Organize orders by status
  const pendingOrders = mockOrders.filter(order => order.status === 'pending');
  const processingOrders = mockOrders.filter(order => order.status === 'processing');
  const deployedOrders = mockOrders.filter(order => order.status === 'deployed');
  const completedOrders = mockOrders.filter(order => order.status === 'completed');

  const allOrders = [...pendingOrders, ...processingOrders, ...deployedOrders, ...completedOrders];

  // Show empty state if no orders
  if (allOrders.length === 0) {
    return <EmptyOrdersState />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {ORDER_COLUMNS.map(column => {
        let orders;
        switch (column.status) {
          case 'pending':
            orders = pendingOrders;
            break;
          case 'processing':
            orders = processingOrders;
            break;
          case 'deployed':
            orders = deployedOrders;
            break;
          case 'completed':
            orders = completedOrders;
            break;
          default:
            orders = [];
        }

        return (
          <OrderColumn
            key={column.status}
            status={column.status}
            title={column.title}
            description={column.description}
            orders={orders}
          />
        );
      })}
    </div>
  );
}