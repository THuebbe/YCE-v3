import { MetricsGrid } from "./metrics-grid";

export async function DashboardMetrics() {
  // Mock metrics data for testing
  const metrics = {
    openOrders: 5,
    monthlyRevenue: 145000,
    monthlyRevenueChange: 12.5,
    popularSigns: [
      {
        id: '1',
        name: 'Happy Birthday',
        category: 'Birthday',
        imageUrl: '/api/placeholder/150/100',
        totalOrdered: 45,
        revenue: 112500,
        isMySign: true
      },
      {
        id: '2',
        name: 'Graduation',
        category: 'Graduation',
        imageUrl: '/api/placeholder/150/100',
        totalOrdered: 32,
        revenue: 96000,
        isMySign: true
      }
    ],
    upcomingDeployments: [
      {
        id: '1',
        orderNumber: 'WBA0001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        eventDate: new Date('2024-01-15'),
        deliveryTime: '10:00 AM',
        status: 'pending',
        signCount: 3,
        address: '123 Main St, Anytown, ST 12345',
        total: 7500
      }
    ],
    completedOrdersThisMonth: 28,
    averageOrderValue: 8750,
    pendingOrdersCount: 2,
    processingOrdersCount: 2,
    deployedOrdersCount: 1
  };
  
  return <MetricsGrid metrics={metrics} />;
}