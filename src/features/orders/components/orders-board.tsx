import { getOrdersByAgency } from '../data';
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
  // Fetch real orders from Supabase
  const orders = await getOrdersByAgency();

  // Organize orders by status
  const pendingOrders = orders.filter((order: any) => order.status === 'pending');
  const processingOrders = orders.filter((order: any) => order.status === 'processing');
  const deployedOrders = orders.filter((order: any) => order.status === 'deployed');
  const completedOrders = orders.filter((order: any) => order.status === 'completed');

  const allOrders = [...pendingOrders, ...processingOrders, ...deployedOrders, ...completedOrders];

  // Show empty state if no orders
  if (allOrders.length === 0) {
    return <EmptyOrdersState />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-default">
      {ORDER_COLUMNS.map(column => {
        let orders: any[];
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