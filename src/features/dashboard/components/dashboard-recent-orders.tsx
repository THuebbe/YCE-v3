import { RecentOrdersList } from "./recent-orders-list";
import { getRecentOrders } from "../actions";

export async function DashboardRecentOrders() {
  const orders = await getRecentOrders();
  
  return <RecentOrdersList orders={orders} />;
}