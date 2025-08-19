import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Header } from "@/shared/components/layout/Header";
import { getAgencyBySlug, getUserById } from "@/lib/db/supabase-client";

// Force dynamic rendering since we use server-side data fetching
export const dynamic = "force-dynamic";

interface CustomersPageProps {
	params: Promise<{
		agency: string;
	}>;
}

export default async function CustomersPage({ params }: CustomersPageProps) {
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
				<div className="mb-8 p-6 bg-purple-50 border-l-4 border-purple-400 rounded-lg">
					<h1 className="text-3xl font-bold text-purple-900 mb-2">
						👥 Customer Management - Feature Planning
					</h1>
					<p className="text-purple-800">
						This page documents the planned Customer Management feature for post-MVP implementation.
						Not currently routed in navigation.
					</p>
				</div>

				<div className="grid gap-8">
					{/* Customer Database */}
					<div className="bg-white rounded-lg shadow-default p-6">
						<h2 className="text-2xl font-bold text-neutral-900 mb-4">
							🗃️ Customer Database Management
						</h2>
						<div className="space-y-4">
							<div className="border-l-4 border-blue-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Customer Profiles</h3>
								<p className="text-neutral-600">Comprehensive customer information and order history</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Customer management components:
<CustomerList 
  searchFilters={{
    name, email, phone, orderCount, 
    totalSpent, lastOrderDate, customerSince
  }}
  sortBy="lastOrder" | "totalSpent" | "orderCount" | "name"
  pagination={{ page, limit, total }}
/>

<CustomerProfile 
  customerId={customerId}
  sections={{
    personalInfo, contactDetails, orderHistory,
    preferences, notes, communicationHistory
  }}
  onEdit={handleCustomerUpdate}
  onMerge={handleCustomerMerge}
/>`}
								</div>
							</div>

							<div className="border-l-4 border-green-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Advanced Search & Segmentation</h3>
								<p className="text-neutral-600">Find customers by behavior, preferences, and purchase patterns</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Advanced customer segmentation:
<CustomerSegmentation 
  segments={{
    highValue: { totalSpent: ">$1000", orderCount: ">5" },
    frequent: { ordersPerYear: ">3" },
    seasonal: { orderMonths: ["Oct", "Nov", "Dec"] },
    inactive: { lastOrder: ">6months" }
  }}
  onCreateMailingList={handleMailingListCreation}
/>`}
								</div>
							</div>
						</div>
					</div>

					{/* Customer Analytics */}
					<div className="bg-white rounded-lg shadow-default p-6">
						<h2 className="text-2xl font-bold text-neutral-900 mb-4">
							📊 Customer Analytics & Insights
						</h2>
						<div className="space-y-4">
							<div className="border-l-4 border-emerald-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Lifetime Value Analysis</h3>
								<p className="text-neutral-600">Track customer value, repeat rates, and growth patterns</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Customer value analytics:
<CustomerValueMetrics 
  metrics={{
    averageLifetimeValue,
    repeatCustomerRate,
    customerRetentionRate,
    averageOrderFrequency
  }}
  timeframes={["30days", "3months", "1year", "allTime"]}
/>

<CustomerGrowthChart 
  showNewCustomers={true}
  showReturningCustomers={true}
  segmentBy="acquisitionChannel" | "orderValue" | "seasonality"
/>`}
								</div>
							</div>

							<div className="border-l-4 border-indigo-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Behavior & Preferences</h3>
								<p className="text-neutral-600">Sign preferences, booking patterns, seasonal behavior</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Behavioral analytics:
<PreferenceAnalysis 
  insights={{
    preferredSignTypes, popularHolidays,
    averageOrderSize, preferredDeliveryTimes,
    bookingLeadTime, seasonalPatterns
  }}
/>

<CustomizationTrends 
  showPopularCustomizations={true}
  showSeasonalTrends={true}
  predictFutureNeeds={true}
/>`}
								</div>
							</div>
						</div>
					</div>

					{/* Communication Tools */}
					<div className="bg-white rounded-lg shadow-default p-6">
						<h2 className="text-2xl font-bold text-neutral-900 mb-4">
							📢 Customer Communication
						</h2>
						<div className="space-y-4">
							<div className="border-l-4 border-pink-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Automated Communications</h3>
								<p className="text-neutral-600">Email/SMS campaigns, booking reminders, follow-ups</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Communication automation:
<EmailCampaignBuilder 
  templates={{
    welcomeNew, orderReminder, feedbackRequest,
    seasonalPromotion, winBackInactive
  }}
  triggers={{
    newCustomer, orderConfirmation, postDelivery,
    inactivityThreshold, holidayApproaching
  }}
/>

<CommunicationHistory 
  customerId={customerId}
  channels={["email", "sms", "phone"]}
  showDeliveryStatus={true}
  showEngagementMetrics={true}
/>`}
								</div>
							</div>

							<div className="border-l-4 border-cyan-400 pl-4">
								<h3 className="font-semibold text-neutral-800">Customer Portal Integration</h3>
								<p className="text-neutral-600">Self-service portal, order tracking, rebooking</p>
								<div className="bg-gray-50 p-3 mt-2 rounded font-mono text-sm">
									{`// Customer portal features:
<CustomerPortal 
  features={{
    orderTracking, profileManagement, 
    rebookingShortcuts, feedbackSubmission,
    documentDownloads, preferenceSettings
  }}
  brandedExperience={agency.branding}
/>

<CustomerSupportTicketing 
  integrationWith="existing_support_system"
  autoAssignment={true}
  escalationRules={supportEscalationMatrix}
/>`}
								</div>
							</div>
						</div>
					</div>

					{/* Data Management */}
					<div className="bg-white rounded-lg shadow-default p-6">
						<h2 className="text-2xl font-bold text-neutral-900 mb-4">
							🔒 Data Management & Privacy
						</h2>
						<div className="space-y-3">
							<div className="bg-gray-50 p-4 rounded">
								<h4 className="font-semibold mb-2">Data Export & Backup</h4>
								<div className="font-mono text-sm text-gray-700">
									{`// Data management:
<CustomerDataExport 
  formats={["csv", "excel", "json"]}
  includeOrderHistory={true}
  includePreferences={true}
  includeNotes={true}
  anonymizeData={optional}
/>

<DataRetentionSettings 
  policies={{
    activeCustomers: "indefinite",
    inactiveCustomers: "3years",
    completedOrders: "7years",
    cancelledOrders: "1year"
  }}
  gdprCompliance={true}
/>`}
								</div>
							</div>

							<div className="bg-gray-50 p-4 rounded">
								<h4 className="font-semibold mb-2">Privacy & Compliance</h4>
								<div className="font-mono text-sm text-gray-700">
									{`// Privacy features:
<PrivacyCenter 
  gdprRequests={{
    dataExport, dataCorrection, 
    dataDeletion, dataPortability
  }}
  consentManagement={true}
  auditTrail={true}
/>`}
								</div>
							</div>
						</div>
					</div>

					{/* Implementation Priority */}
					<div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
						<h3 className="text-lg font-semibold text-yellow-900 mb-3">⭐ Implementation Priority (Post-MVP)</h3>
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<h4 className="font-semibold text-yellow-800 mb-2">Phase 1 (Essential)</h4>
								<ul className="space-y-1 text-yellow-700 text-sm">
									<li>• Basic customer list and search</li>
									<li>• Customer profiles with order history</li>
									<li>• Contact information management</li>
									<li>• Simple customer notes</li>
								</ul>
							</div>
							<div>
								<h4 className="font-semibold text-yellow-800 mb-2">Phase 2 (Advanced)</h4>
								<ul className="space-y-1 text-yellow-700 text-sm">
									<li>• Customer analytics and lifetime value</li>
									<li>• Automated communication campaigns</li>
									<li>• Customer portal integration</li>
									<li>• Advanced segmentation and targeting</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}