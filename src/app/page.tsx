import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// Force this page to be dynamic (not statically generated)
export const dynamic = "force-dynamic";

export default async function HomePage() {
	console.log("🏠 Root page: Starting load");

	try {
		const { userId } = await auth();
		console.log("🏠 Root page: Auth result", { userId });

		if (userId) {
			console.log(
				"🏠 Root page: User authenticated, redirecting to routing page"
			);
			redirect("/routing");
		} else {
			console.log("🏠 Root page: No user ID, showing marketing homepage");
		}
	} catch (authError) {
		// Re-throw redirect errors so they work properly
		if (authError instanceof Error && authError.message === "NEXT_REDIRECT") {
			throw authError;
		}

		console.error("🏠 Root page: Authentication error:", authError);
		// If auth fails, fall through to show marketing homepage
	}

	console.log("🏠 Root page: Showing marketing homepage");

	// Marketing homepage styled per YCE style guide
	return (
		<div className="min-h-screen font-['Inter'] bg-gradient-to-br from-[#F0E9FF] to-[#FFFFFF]">
			{/* Header - following style guide navigation specs */}
			<header
				className="bg-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
				style={{ height: "64px" }}
			>
				<div className="max-w-[1200px] mx-auto px-8">
					<div className="flex justify-between items-center h-16">
						<div
							className="flex items-center"
							style={{ width: "200px" }}
						>
							<h1 className="text-[18px] leading-[26px] font-medium tracking-[-0.01em] text-[#111827]">
								YardCard Elite
							</h1>
						</div>
						<nav className="hidden md:flex space-x-8">
							<Link
								href="/pricing"
								className="text-[#6B7280] hover:text-[#7B3FF2] transition-colors duration-200"
							>
								Pricing
							</Link>
							<Link
								href="#features"
								className="text-[#6B7280] hover:text-[#7B3FF2] transition-colors duration-200"
							>
								Features
							</Link>
						</nav>
						<div className="flex items-center space-x-4">
							<Link
								href="/auth/sign-in"
								className="text-[#7B3FF2] font-medium hover:text-[#9D6FFF] transition-colors duration-200"
							>
								Sign In
							</Link>
							<Link
								href="/auth/sign-up"
								className="bg-[#7B3FF2] text-[#FFFFFF] px-6 py-3 rounded-[10px] font-medium text-[15px] leading-[24px] tracking-[0.02em] hover:bg-[#9D6FFF] transition-colors duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
								style={{ height: "40px" }}
							>
								Get Started
							</Link>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-[1200px] mx-auto">
				{/* Hero Section */}
				<section className="px-8 py-16">
					<div className="grid gap-12 lg:grid-cols-2 items-center">
						<div className="flex flex-col justify-center space-y-6">
							<div className="space-y-4">
								<h1 className="text-[32px] leading-[40px] font-bold tracking-[-0.025em] text-[#111827] sm:text-[40px] sm:leading-[48px] lg:text-[48px] lg:leading-[56px]">
									Transform Your Yard Card Business with YardCard Elite
								</h1>
								<p className="text-[18px] leading-[28px] text-[#374151] max-w-[600px]">
									Delight your customers with a seamless booking experience that
									increases conversions, boosts retention, and saves you
									valuable time.
								</p>
							</div>
							<div className="flex flex-col gap-4 min-[400px]:flex-row">
								<Link
									href="/auth/sign-up"
									className="bg-[#7B3FF2] text-[#FFFFFF] px-6 py-3 rounded-[10px] font-medium text-[15px] leading-[24px] tracking-[0.02em] hover:bg-[#9D6FFF] transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1)] w-full min-[400px]:w-auto text-center"
									style={{ height: "44px" }}
								>
									Sign Up Free
								</Link>
								<Link
									href="/auth/sign-in"
									className="bg-[#FFFFFF] text-[#7B3FF2] border-[1.5px] border-[#7B3FF2] px-6 py-3 rounded-[10px] font-medium text-[15px] leading-[24px] tracking-[0.02em] hover:bg-[#F0E9FF] transition-all duration-200 w-full min-[400px]:w-auto text-center"
									style={{ height: "44px" }}
								>
									Sign In
								</Link>
							</div>
						</div>
						<div className="flex items-center justify-center">
							<div className="relative h-[350px] w-[350px] sm:h-[400px] sm:w-[400px] lg:h-[500px] lg:w-[500px]">
								<img
									src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80"
									alt="Yard card celebration display"
									className="rounded-[20px] object-cover shadow-[0_20px_25px_rgba(0,0,0,0.1),0_10px_10px_rgba(0,0,0,0.04)] w-full h-full"
								/>
							</div>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section className="px-8 py-16 bg-[#F9FAFB] rounded-[16px] mx-8">
					<div className="text-center mb-12">
						<h2 className="text-[28px] leading-[36px] font-bold tracking-[-0.025em] text-[#111827] sm:text-[32px] sm:leading-[40px]">
							Elevate Your Customer Experience
						</h2>
						<p className="mt-6 text-[18px] leading-[28px] text-[#374151] max-w-[900px] mx-auto">
							Say goodbye to confusing surveys and manual payments. Give your
							customers the power to design exactly what they want.
						</p>
					</div>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
						{features.map((feature) => (
							<div
								key={feature.title}
								className="bg-[#FFFFFF] rounded-[16px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.05)] transition-all duration-200 flex flex-col items-center text-center space-y-4"
							>
								<div
									className="rounded-full bg-[#F0E9FF] p-3 flex items-center justify-center"
									style={{ width: "48px", height: "48px" }}
								>
									{feature.icon}
								</div>
								<h3 className="text-[20px] leading-[28px] font-semibold tracking-[-0.015em] text-[#111827]">
									{feature.title}
								</h3>
								<p className="text-[16px] leading-[24px] text-[#374151]">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* How It Works Section */}
				<section className="px-8 py-16">
					<div className="text-center mb-12">
						<h2 className="text-[28px] leading-[36px] font-bold tracking-[-0.025em] text-[#111827] sm:text-[32px] sm:leading-[40px]">
							How YardCard Elite Works
						</h2>
						<p className="mt-6 text-[18px] leading-[28px] text-[#374151] max-w-[900px] mx-auto">
							A simple, intuitive process that delights customers and saves you
							time
						</p>
					</div>
					<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
						{howItWorks.map((step, index) => (
							<div
								key={index}
								className="flex flex-col items-center text-center space-y-4 p-6"
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7B3FF2] text-[#FFFFFF] text-[18px] leading-[26px] font-medium">
									{index + 1}
								</div>
								<h3 className="text-[20px] leading-[28px] font-semibold tracking-[-0.015em] text-[#111827]">
									{step.title}
								</h3>
								<p className="text-[16px] leading-[24px] text-[#374151]">
									{step.description}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* Problem Solution Section */}
				<section className="px-8 py-16 bg-[#F9FAFB] rounded-[16px] mx-8">
					<div className="grid gap-12 lg:grid-cols-2">
						<div className="space-y-6">
							<h2 className="text-[28px] leading-[36px] font-bold tracking-[-0.025em] text-[#111827] sm:text-[32px] sm:leading-[40px]">
								The Problem
							</h2>
							<p className="text-[18px] leading-[28px] text-[#374151]">
								Currently, Yard Card Rental businesses rely on customers filling
								out confusing surveys that only get them close to what they
								want. This leads to:
							</p>
							<ul className="space-y-3 text-[16px] leading-[24px] text-[#374151]">
								{problemPoints.map((point, index) => (
									<li
										key={index}
										className="flex items-start"
									>
										<svg
											className="mr-3 h-5 w-5 flex-shrink-0 text-[#DC2626] mt-0.5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<span>{point}</span>
									</li>
								))}
							</ul>
						</div>
						<div className="space-y-6">
							<h2 className="text-[28px] leading-[36px] font-bold tracking-[-0.025em] text-[#111827] sm:text-[32px] sm:leading-[40px]">
								Our Solution
							</h2>
							<p className="text-[18px] leading-[28px] text-[#374151]">
								YardCard Elite transforms this process with a visual,
								customer-driven approach that delivers:
							</p>
							<ul className="space-y-3 text-[16px] leading-[24px] text-[#374151]">
								{solutionPoints.map((point, index) => (
									<li
										key={index}
										className="flex items-start"
									>
										<svg
											className="mr-3 h-5 w-5 flex-shrink-0 text-[#059669] mt-0.5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span>{point}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="px-8 py-16">
					<div className="text-center space-y-8">
						<div className="space-y-4">
							<h2 className="text-[28px] leading-[36px] font-bold tracking-[-0.025em] text-[#111827] sm:text-[32px] sm:leading-[40px]">
								Ready to Elevate Your Yard Card Business?
							</h2>
							<p className="text-[18px] leading-[28px] text-[#374151] max-w-[900px] mx-auto">
								Join forward-thinking Yard Card Rental businesses using YardCard
								Elite to delight customers and grow their business.
							</p>
						</div>
						<div className="flex flex-col gap-4 min-[400px]:flex-row justify-center">
							<Link
								href="/auth/sign-up"
								className="bg-[#7B3FF2] text-[#FFFFFF] px-6 py-3 rounded-[10px] font-medium text-[15px] leading-[24px] tracking-[0.02em] hover:bg-[#9D6FFF] transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1)] w-full min-[400px]:w-auto text-center"
								style={{ height: "44px" }}
							>
								Create Your Account
							</Link>
							<Link
								href="/auth/sign-in"
								className="bg-[#FFFFFF] text-[#7B3FF2] border-[1.5px] border-[#7B3FF2] px-6 py-3 rounded-[10px] font-medium text-[15px] leading-[24px] tracking-[0.02em] hover:bg-[#F0E9FF] transition-all duration-200 w-full min-[400px]:w-auto text-center"
								style={{ height: "44px" }}
							>
								Sign In
							</Link>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}

const features = [
	{
		title: "Visual Customization",
		description:
			"Let customers design exactly what they want with an intuitive visual interface.",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-6 w-6 text-[#7B3FF2]"
			>
				<path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
				<path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
				<path d="M12 2v2" />
				<path d="M12 22v-2" />
				<path d="m17 20.66-1-1.73" />
				<path d="M11 10.27 7 3.34" />
				<path d="m20.66 17-1.73-1" />
				<path d="m3.34 7 1.73 1" />
				<path d="M14 12h8" />
				<path d="M2 12h2" />
				<path d="m20.66 7-1.73 1" />
				<path d="m3.34 17 1.73-1" />
				<path d="m17 3.34-1 1.73" />
				<path d="m11 13.73-4 6.93" />
			</svg>
		),
	},
	{
		title: "Seamless Payment Processing",
		description:
			"Accept payments directly through the booking flow, eliminating manual collection.",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-6 w-6 text-[#7B3FF2]"
			>
				<rect
					width="20"
					height="14"
					x="2"
					y="5"
					rx="2"
				/>
				<line
					x1="2"
					x2="22"
					y1="10"
					y2="10"
				/>
			</svg>
		),
	},
	{
		title: "Automated Layout Generation",
		description:
			"Generate yard card layouts automatically based on customer preferences with one click.",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-6 w-6 text-[#7B3FF2]"
			>
				<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
				<polyline points="3.29 7 12 12 20.71 7" />
				<line
					x1="12"
					y1="22"
					y2="12"
					x2="12"
				/>
			</svg>
		),
	},
	{
		title: "Instant Confirmations",
		description:
			"Send automated confirmations to customers and your team, reducing administrative work.",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-6 w-6 text-[#7B3FF2]"
			>
				<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
			</svg>
		),
	},
	{
		title: "Customer Satisfaction Insights",
		description:
			"Track customer satisfaction and preferences to continuously improve your offerings.",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-6 w-6 text-[#7B3FF2]"
			>
				<path d="M3 3v18h18" />
				<path d="m19 9-5 5-4-4-3 3" />
			</svg>
		),
	},
	{
		title: "Time-Saving Automation",
		description:
			"Reduce manual work and focus on creating amazing yard card displays for your customers.",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-6 w-6 text-[#7B3FF2]"
			>
				<circle
					cx="12"
					cy="12"
					r="10"
				/>
				<polyline points="12 6 12 12 16 14" />
			</svg>
		),
	},
];

const howItWorks = [
	{
		title: "Simple Customer Information",
		description:
			"Collect basic details about the customer, event date, and location.",
	},
	{
		title: "Personalized Customization",
		description:
			"Customers select event messages, colors, and themes based on your inventory.",
	},
	{
		title: "Instant Layout Generation",
		description:
			"One-click generation of yard card layouts that customers can refine until perfect.",
	},
	{
		title: "Seamless Booking Extension",
		description:
			"Customers can easily add extra days before or after the main event.",
	},
	{
		title: "Integrated Payment",
		description: "Secure payment processing right within the booking flow.",
	},
	{
		title: "Automated Confirmations",
		description:
			"Instant confirmations for customers and notifications for your team.",
	},
];

const problemPoints = [
	"Time-consuming back-and-forth conversations",
	"Manual payment collection",
	"Customers receiving products they've never seen",
	"Uncertainty about what to expect",
];

const solutionPoints = [
	"Minimal questions with maximum customization",
	"Visual layout generation based on customer preferences",
	"Integrated payment processing",
	"Automated order confirmations for both customers and agencies",
];
