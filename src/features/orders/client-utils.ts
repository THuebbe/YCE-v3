// Client-safe utility functions for orders (no server-side imports)

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

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(amount) || 0); // orders.total is stored in dollars
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

// Client-side versions of server functions (mock data for demo)
export function shouldAutoRefund(order: any): boolean {
  return isWithinCancellationWindow(order);
}

export function isWithinCancellationWindow(order: any): boolean {
  // Check if order is within 24-hour cancellation window
  const orderTime = new Date(order.created_at);
  const now = new Date();
  const hoursSinceOrder = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceOrder <= 24;
}

export function canCancelOrder(order: any): boolean {
  // Can cancel if not completed or already cancelled
  return !['completed', 'cancelled'].includes(order.status);
}

export function calculateOrderTotal(items: { unitPrice: number; quantity: number }[]): number {
  return items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
}
export interface OrderSignLine {
  signId: string;
  quantity: number;
  sign: { name?: string; image_url?: string; category?: string } | null;
}

/**
 * The signs an order holds. Wizard bookings write `order_signs`; older and
 * seeded orders only have `order_items`. Same rule as yce_order_sign_lines().
 */
export function getOrderSignLines(order: any): OrderSignLine[] {
  const rows: any[] = order?.order_signs?.length ? order.order_signs : order?.order_items ?? [];
  const bySign = new Map<string, OrderSignLine>();
  for (const row of rows) {
    const signId = row.sign_id ?? row.signId;
    const line = bySign.get(signId);
    if (line) line.quantity += row.quantity;
    else bySign.set(signId, { signId, quantity: row.quantity, sign: row.sign ?? null });
  }
  return [...bySign.values()];
}

export function countOrderSigns(order: any): number {
  return getOrderSignLines(order).reduce((sum, line) => sum + line.quantity, 0);
}
