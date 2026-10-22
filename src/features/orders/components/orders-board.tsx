import { getOrdersByAgency } from '../data';
import type { OrdersView } from '../views';
import type { Plan } from '@/features/billing/entitlements';
import { EmptyOrdersState } from './empty-orders-state';
import { OrdersViewList } from './orders-view';

/** The orders page body: every order for the agency, filtered by the chip in the URL */
export async function OrdersBoard({ agencySlug, plan, view }: { agencySlug: string; plan: Plan; view: OrdersView }) {
  const orders = await getOrdersByAgency();
  if (orders.length === 0) return <EmptyOrdersState agencySlug={agencySlug} />;
  return <OrdersViewList orders={orders} view={view} slug={agencySlug} plan={plan} />;
}
