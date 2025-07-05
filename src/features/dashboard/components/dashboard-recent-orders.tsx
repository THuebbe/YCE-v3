import { RecentOrdersList } from "./recent-orders-list";

export async function DashboardRecentOrders() {
  // Mock orders data for testing
  const orders = [
    {
      id: 'order1',
      orderNumber: 'WBA0001',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      eventDate: new Date('2024-01-15'),
      status: 'pending',
      total: 9500,
      signCount: 2,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'order2',
      orderNumber: 'WBA0002',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      eventDate: new Date('2024-01-20'),
      status: 'processing',
      total: 12000,
      signCount: 3,
      createdAt: new Date('2024-01-02')
    },
    {
      id: 'order3',
      orderNumber: 'WBA0003',
      customerName: 'Bob Johnson',
      customerEmail: 'bob@example.com',
      eventDate: new Date('2024-01-25'),
      status: 'deployed',
      total: 7500,
      signCount: 1,
      createdAt: new Date('2024-01-03')
    }
  ];
  
  return <RecentOrdersList orders={orders} />;
}