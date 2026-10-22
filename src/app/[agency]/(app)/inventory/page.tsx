import { InventoryPage } from "@/features/inventory/components/inventory-page";
import { requireAgencyPage } from "@/features/dashboard/access";
import { PageHeader } from "@/features/dashboard/components/page-header";

// Force dynamic rendering since we use server-side data fetching
export const dynamic = "force-dynamic";

export default async function AgencyInventoryPage({ params }: { params: Promise<{ agency: string }> }) {
	const { agency: agencySlug } = await params;
	await requireAgencyPage(agencySlug);

	return (
		<>
			<PageHeader title="Signs" description="The signs you own, and the platform library to add from." />
			<InventoryPage />
		</>
	);
}
