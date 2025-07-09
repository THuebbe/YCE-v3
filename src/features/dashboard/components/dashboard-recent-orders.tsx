import { RecentOrdersList } from "./recent-orders-list";
import { getRecentOrders } from "../actions";

export async function DashboardRecentOrders({ agencyId }: { agencyId: string }) {
  const orders = await getRecentOrders(agencyId);
  
  return <RecentOrdersList orders={orders} />;
}