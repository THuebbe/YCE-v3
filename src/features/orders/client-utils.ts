// Client-safe utility functions for orders (no server-side imports)

export function formatOrderNumber(orderNumber: string): string {
  // If it's already formatted, return as-is
  if (orderNumber.includes('-')) {
    return orderNumber;
  }
  
  // Otherwise, format it nicely
  return orderNumber.replace(/(\w{3})(\d{4})/, '$1-$2');
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

// Client-side versions of server functions
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

/** Minutes a time zone is ahead of UTC at a moment (-300 for Chicago in summer) */
function zoneOffsetMinutes(at: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
      .formatToParts(at).map(p => [p.type, Number(p.value)]),
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return Math.round((asUtc - Math.floor(at.getTime() / 60_000) * 60_000) / 60_000);
}

/** The moment a calendar day starts in a time zone (local midnight), DST included */
export function startOfDayIn(year: number, month: number, day: number, timeZone: string): Date {
  const utcMidnight = Date.UTC(year, month - 1, day);
  let start = utcMidnight - zoneOffsetMinutes(new Date(utcMidnight), timeZone) * 60_000;
  // Across a DST change the offset at midnight differs from the first guess
  start = utcMidnight - zoneOffsetMinutes(new Date(start), timeZone) * 60_000;
  return new Date(start);
}

/**
 * Hours from `now` until delivery (start of the event day minus the extra
 * days before, in the agency's time zone), the point cancellation notice is
 * measured from (PRODUCT.md). Negative once delivery day has started.
 * Without a time zone (or an unknown one) it falls back to this machine's.
 */
export function hoursUntilDelivery(
  order: { event_date?: string | null; extraDaysBefore?: number | null },
  timeZone?: string,
  now: Date = new Date(),
): number {
  if (!order.event_date) return Infinity;
  const [y, m, d] = String(order.event_date).slice(0, 10).split('-').map(Number);
  const day = d - (Number(order.extraDaysBefore) || 0);
  let delivery: Date;
  try {
    // Date.UTC normalizes a day of 0 or less into the month before
    const key = new Date(Date.UTC(y, m - 1, day));
    delivery = timeZone
      ? startOfDayIn(key.getUTCFullYear(), key.getUTCMonth() + 1, key.getUTCDate(), timeZone)
      : new Date(y, m - 1, day);
  } catch {
    delivery = new Date(y, m - 1, day);
  }
  return (delivery.getTime() - now.getTime()) / 3_600_000;
}

export function canCancelOrder(order: any): boolean {
  // Deployed orders end with check-in, not a cancel (yce_cancel_order agrees)
  return ['pending', 'processing'].includes(order.status);
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

/**
 * Event address as one line. Wizard orders store plain text; older and
 * seeded orders store a JSON string ({street, city, state, zip}).
 */
export function formatAddress(address: unknown): string {
  if (!address) return 'Not provided';
  let value: any = address;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return value; }
    if (typeof value !== 'object' || value === null) return address as string;
  }
  if (typeof value === 'object' && value !== null) {
    const parts = [value.street, value.city, value.state, value.zip].filter(Boolean);
    if (parts.length) return parts.join(', ');
  }
  return 'Not provided';
}

/** The delivery window the customer picked ("morning" -> "Morning"), or null */
export function formatTimeWindow(order: { delivery_time?: string | null; timeWindow?: string | null }): string | null {
  const raw = (order.delivery_time || order.timeWindow || '').trim();
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : null;
}
