import { MetricsGrid } from "./metrics-grid";
import { getDashboardMetrics } from "../actions";

export async function DashboardMetrics({ agencyId }: { agencyId: string }) {
  const metrics = await getDashboardMetrics(agencyId);
  
  return <MetricsGrid metrics={metrics} />;
}