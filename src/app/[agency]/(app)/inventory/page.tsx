import { requireAgencyPage } from "@/features/dashboard/access";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { getAgencyInventory, getCustomSigns, getPlatformSignLibrary } from "@/features/inventory/actions";
import { SignsTabs, parseSignsTab } from "@/features/inventory/components/signs-tabs";
import { MySigns } from "@/features/inventory/components/my-signs";
import { SignLibrary } from "@/features/inventory/components/sign-library";
import { CustomSigns } from "@/features/inventory/components/custom-signs";
import type { InventoryItem } from "@/features/inventory/types";

// Force dynamic rendering since we use server-side data fetching
export const dynamic = "force-dynamic";

const ownedById = (items: InventoryItem[]) => Object.fromEntries(items.map(i => [i.sign_id, i.quantity]));

export default async function AgencyInventoryPage({ params, searchParams }: {
	params: Promise<{ agency: string }>;
	searchParams: Promise<{ tab?: string }>;
}) {
	const { agency: agencySlug } = await params;
	const tab = parseSignsTab((await searchParams).tab);
	await requireAgencyPage(agencySlug);

	const inventory = await getAgencyInventory();

	return (
		<>
			<PageHeader title="Signs" description="What you own. Customers can book displays built from these." />
			<SignsTabs tab={tab} slug={agencySlug} />
			{tab === "mine" && <MySigns items={inventory} slug={agencySlug} />}
			{tab === "library" && (
				<SignLibrary
					signs={await getPlatformSignLibrary()}
					owned={ownedById(inventory)}
					searchLabel="Search the library"
					empty={<p className="text-fg-muted">The library is empty right now.</p>}
				/>
			)}
			{tab === "custom" && <CustomSigns signs={await getCustomSigns()} owned={ownedById(inventory)} />}
		</>
	);
}
