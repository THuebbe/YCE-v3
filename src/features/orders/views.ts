// The orders page's filter chips. Client-safe (no server imports).
import type { OrderStatus } from './stateMachine';

export type OrdersView = 'upcoming' | 'out' | 'done' | 'cancelled';

interface ViewDef {
  id: OrdersView;
  label: string;
  statuses: OrderStatus[];
  empty: string;
  /** Soonest work first for live orders, newest first for finished ones */
  sort: (a: any, b: any) => number;
}

const byEventDate = (a: any, b: any) => String(a.event_date).localeCompare(String(b.event_date));
const newestFirst = (field: string) => (a: any, b: any) =>
  String(b[field] ?? b.updated_at ?? '').localeCompare(String(a[field] ?? a.updated_at ?? ''));

export const VIEWS: ViewDef[] = [
  { id: 'upcoming', label: 'Upcoming', statuses: ['pending', 'processing'], empty: 'No orders waiting to go out.', sort: byEventDate },
  { id: 'out', label: 'Out now', statuses: ['deployed'], empty: 'No displays are out right now.', sort: byEventDate },
  { id: 'done', label: 'Done', statuses: ['completed'], empty: 'No finished orders yet.', sort: newestFirst('completed_at') },
  { id: 'cancelled', label: 'Cancelled', statuses: ['cancelled'], empty: 'No cancelled orders.', sort: newestFirst('cancelled_at') },
];

export function parseView(raw: string | undefined): OrdersView {
  return VIEWS.some(v => v.id === raw) ? (raw as OrdersView) : 'upcoming';
}

export function viewOf(id: OrdersView): ViewDef {
  return VIEWS.find(v => v.id === id)!;
}

export function ordersInView(orders: any[], id: OrdersView): any[] {
  const view = viewOf(id);
  return orders.filter(o => view.statuses.includes(o.status)).sort(view.sort);
}

export function viewCounts(orders: any[]): Record<OrdersView, number> {
  return Object.fromEntries(VIEWS.map(v => [v.id, orders.filter(o => v.statuses.includes(o.status)).length])) as Record<OrdersView, number>;
}
