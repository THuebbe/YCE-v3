import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Header } from "@/shared/components/layout/Header";
import { getAgencyBySlug, getUserById } from "@/lib/db/supabase-client";

// Force dynamic rendering since we use server-side data fetching
export const dynamic = "force-dynamic";

interface ReportsPageProps {
	params: Promise<{
		agency: string;
	}>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
	const { userId } = await auth();
	const { agency: agencySlug } = await params;

	if (!userId) {
		redirect("/auth/sign-in");
	}

	// Verify agency access
	try {
		const results = await Promise.all([
			getAgencyBySlug(agencySlug),
			getUserById(userId),
		]);
		const [agency, user] = results;

		if (!agency || !user || user.agency?.slug !== agencySlug) {
			redirect("/routing");
		}
	} catch (error) {
		redirect("/routing");
	}

	return (
		<div className="min-h-screen bg-background-light">
			<Header />
			<main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
				{/* Planning Header */}
				<div className="mb-8 p-6 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
					<h1 className="text-3xl font-bold text-amber-900 mb-2">
						📊 Reports & Analytics - Feature Planning
					</h1>
					<p className="text-amber-800">
						This page documents the planned Reports feature for post-MVP implementation.
						Not currently routed in navigation.
					</p>
				</div>

				<div className="grid gap-8">
					{/* Document Management */}
					<div className="bg-white rounded-lg shadow-default p-6">
						<h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center">
							📄 Document Management
						</h2>
						<div className="space-y-4">
							<div className="border-l-4 border-blue-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Pick Tickets & Order Docs</h3>
								<p className="text-neutral-600">Generate, view, and reprint order documents</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Components to build:
<DocumentGenerator 
  orderId={orderId}
  documentType="pick_ticket" | "order_confirmation" | "delivery_receipt"
  onGenerate={handleDocumentGeneration}
/>

<DocumentHistory 
  agencyId={agencyId}
  filters={{ dateRange, documentType, orderId }}
  onDownload={handleDownload}
  onReprint={handleReprint}
/>`}
								</div>
							</div>

							<div className="border-l-4 border-green-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Bulk Document Operations</h3>
								<p className="text-neutral-600">Generate multiple documents, batch exports</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Bulk operations:
<BulkDocumentGenerator 
  orderIds={selectedOrderIds}
  documentTypes={['pick_ticket', 'confirmation']}
  exportFormat="pdf" | "zip"
/>`}
								</div>
							</div>
						</div>
					</div>

					{/* Financial Analytics */}
					<div className="bg-white rounded-lg shadow-default p-6">
						<h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center">
							💰 Financial Analytics
						</h2>
						<div className="space-y-4">
							<div className="border-l-4 border-emerald-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Revenue Analytics</h3>
								<p className="text-neutral-600">Revenue trends, profit analysis, financial insights</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Financial components:
<RevenueChart 
  timeframe="weekly" | "monthly" | "yearly"
  compareToNext={true}
  showProfitMargins={true}
/>

<FinancialSummary 
  metrics={{
    totalRevenue, grossProfit, netProfit,
    averageOrderValue, customerLifetimeValue
  }}
/>

<TaxReporting 
  taxYear={2024}
  includeDeductions={true}
  exportFormat="csv" | "pdf"
/>`}
								</div>
							</div>

							<div className="border-l-4 border-purple-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Payment Analytics</h3>
								<p className="text-neutral-600">Transaction analysis, refund tracking, payment method insights</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Payment insights:
<PaymentAnalytics 
  metrics={{
    successRate, averageProcessingTime,
    refundRate, chargebackRate
  }}
  paymentMethods={stripePaymentMethods}
/>`}
								</div>
							</div>
						</div>
					</div>

					{/* Operational Reports */}
					<div className="bg-white rounded-lg shadow-default p-6">
						<h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center">
							📈 Operational Analytics
						</h2>
						<div className="space-y-4">
							<div className="border-l-4 border-orange-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Sign Performance</h3>
								<p className="text-neutral-600">Popular signs, inventory utilization, seasonal trends</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Performance tracking:
<SignPerformanceChart 
  timeframe="month" | "quarter" | "year"
  metrics={["popularity", "revenue", "utilization"]}
  showSeasonalTrends={true}
/>

<InventoryUtilization 
  showLowStock={true}
  showOverstock={true}
  recommendOptimizations={true}
/>`}
								</div>
							</div>

							<div className="border-l-4 border-red-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Deployment Efficiency</h3>
								<p className="text-neutral-600">Delivery times, setup efficiency, check-in analytics</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Operational efficiency:
<DeploymentMetrics 
  averageSetupTime={deploymentData.avgSetupTime}
  onTimeDeliveryRate={deploymentData.onTimeRate}
  damageRate={deploymentData.damageRate}
/>

<SeasonalDemand 
  predictiveAnalytics={true}
  inventoryRecommendations={true}
/>`}
								</div>
							</div>
						</div>
					</div>

					{/* Export & Sharing */}
					<div className="bg-white rounded-lg shadow-default p-6">
						<h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center">
							📤 Export & Sharing Features
						</h2>
						<div className="space-y-3">
							<div className="bg-gray-50 p-4 rounded">
								<h4 className="font-semibold mb-2">Automated Report Generation</h4>
								<div className="font-mono text-sm text-gray-700">
									{`// Scheduled reporting:
<ScheduledReports 
  frequency="daily" | "weekly" | "monthly"
  recipients={emailList}
  reportTypes={["financial_summary", "operational_metrics"]}
  deliveryFormat="email" | "dashboard_notification"
/>`}
								</div>
							</div>

							<div className="bg-gray-50 p-4 rounded">
								<h4 className="font-semibold mb-2">Custom Report Builder</h4>
								<div className="font-mono text-sm text-gray-700">
									{`// Drag-and-drop report builder:
<ReportBuilder 
  availableMetrics={allMetrics}
  chartTypes={["line", "bar", "pie", "table"]}
  onSave={saveCustomReport}
  onShare={shareReport}
/>`}
								</div>
							</div>
						</div>
					</div>

					{/* Implementation Notes */}
					<div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
						<h3 className="text-lg font-semibold text-blue-900 mb-3">🛠️ Implementation Notes</h3>
						<ul className="space-y-2 text-blue-800">
							<li>• Use Chart.js or Recharts for data visualization</li>
							<li>• Integrate with existing dashboard API for data consistency</li>
							<li>• Implement role-based access (admin vs staff report access)</li>
							<li>• Add PDF export using existing PDFKit integration</li>
							<li>• Consider real-time updates for live operational metrics</li>
							<li>• Include date range pickers for flexible time period analysis</li>
						</ul>
					</div>
				</div>
			</main>
		</div>
	);
}