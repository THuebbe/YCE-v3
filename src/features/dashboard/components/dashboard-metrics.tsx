import { MetricsGrid } from "./metrics-grid";
import { getDashboardMetrics } from "../actions";

export async function DashboardMetrics() {
  const metrics = await getDashboardMetrics();
  
  return <MetricsGrid metrics={metrics} />;
}