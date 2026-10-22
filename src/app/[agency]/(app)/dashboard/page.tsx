import { requireAgencyPage } from "@/features/dashboard/access";
import { getDashboardMetrics } from "@/features/dashboard/actions";
import { getJobsOverview } from "@/features/dashboard/jobs";
import { getPopularDisplays } from "@/features/dashboard/popular-displays";
import { HomeView } from "@/features/dashboard/components/home/home-view";
import { hasFeature, planOf } from "@/features/billing/entitlements";
import { BillingBanner } from "@/features/billing/components/billing-banner";
import { SetupChecklist } from "@/features/agency/components/setup-checklist";
import { getBookingBlockers } from "@/features/agency/readiness-server";
import { SITE_URL } from "@/lib/site";

// Force dynamic rendering since we use server-side data fetching
export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ agency: string }> }) {
	const { agency: agencySlug } = await params;
	const { agency, user } = await requireAgencyPage(agencySlug);

	const [blockers, jobs, metrics, popular] = await Promise.all([
		getBookingBlockers(agency),
		getJobsOverview(agency),
		getDashboardMetrics(agency.id),
		hasFeature(planOf(agency), "popularDisplays") ? getPopularDisplays(agency.id) : Promise.resolve(null),
	]);

	return (
		<HomeView
			firstName={user.first_name || undefined}
			slug={agencySlug}
			bookingUrl={`${SITE_URL}/${agencySlug}/booking`}
			bookingOpen={blockers.length === 0}
			notices={
				<>
					<BillingBanner agency={agency} slug={agencySlug} />
					<SetupChecklist missing={blockers} slug={agencySlug} />
				</>
			}
			jobs={jobs}
			metrics={metrics}
			popular={popular}
		/>
	);
}
