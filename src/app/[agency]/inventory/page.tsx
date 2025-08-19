import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Header } from "@/shared/components/layout/Header";
import { InventoryPage } from "@/features/inventory/components/inventory-page";
import { getAgencyBySlug, getUserById } from "@/lib/db/supabase-client";

// Force dynamic rendering since we use server-side data fetching
export const dynamic = "force-dynamic";

interface InventoryPageProps {
	params: Promise<{
		agency: string;
	}>;
}

export default async function AgencyInventoryPage({ params }: InventoryPageProps) {
	const { userId } = await auth();
	const { agency: agencySlug } = await params;

	console.log("📦 Inventory: Loading for agency:", agencySlug);

	if (!userId) {
		console.log("📦 Inventory: No user ID, redirecting to sign-in");
		redirect("/auth/sign-in");
	}

	// Verify the agency exists and the user has access to it
	let agency, user;
	try {
		const results = await Promise.all([
			getAgencyBySlug(agencySlug),
			getUserById(userId),
		]);
		agency = results[0];
		user = results[1];

		if (!agency) {
			console.log("📦 Inventory: Agency not found:", agencySlug);
			redirect("/routing");
		}

		if (!user || user.agency?.slug !== agencySlug) {
			console.log(
				"📦 Inventory: User does not have access to agency:",
				agencySlug
			);
			redirect("/routing");
		}

		console.log(
			"📦 Inventory: Access verified for agency:",
			agencySlug,
			"user:",
			user.id
		);
	} catch (error) {
		console.error("📦 Inventory: Error verifying agency access:", error);
		redirect("/routing");
	}

	return (
		<div className="min-h-screen bg-background-light">
			<Header />
			<main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
				{/* Page Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-neutral-900 tracking-tight">
						Inventory
					</h1>
					<p className="mt-3 text-lg text-neutral-600">
						Manage your sign inventory and browse the platform library.
					</p>
				</div>

				{/* Inventory Management */}
				<InventoryPage />
			</main>
		</div>
	);
}