import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<main className="flex-1">
				{/* Hero Section */}
				<section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
					<div className="container px-4 md:px-6">
						<div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
							<div className="flex flex-col justify-center space-y-4">
								<div className="space-y-2">
									<h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
										Transform Your Yard Card Business with YardCard Elite
									</h1>
									<p className="max-w-[600px] text-muted-foreground md:text-xl">
										Delight your customers with a seamless booking experience
										that increases conversions, boosts retention, and saves you
										valuable time.
									</p>
								</div>
								<div className="flex flex-col gap-2 min-[400px]:flex-row">
									<Link href="/signup">
										<Button
											size="lg"
											className="w-full min-[400px]:w-auto"
										>
											Sign Up Free
										</Button>
									</Link>
									<Link href="/login">
										<Button
											size="lg"
											variant="outline"
											className="w-full min-[400px]:w-auto"
										>
											Sign In
										</Button>
									</Link>
								</div>
							</div>
							<div className="flex items-center justify-center">
								<div className="relative h-[350px] w-[350px] sm:h-[400px] sm:w-[400px] lg:h-[500px] lg:w-[500px]">
									<Image
										src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80"
										alt="Yard card celebration display"
										fill
										className="rounded-lg object-cover shadow-xl"
									/>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
					<div className="container px-4 md:px-6">
						<div className="flex flex-col items-center justify-center space-y-4 text-center">
							<div className="space-y-2">
								<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
									Elevate Your Customer Experience
								</h2>
								<p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
									Say goodbye to confusing surveys and manual payments. Give
									your customers the power to design exactly what they want.
								</p>
							</div>
						</div>
						<div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
							{features.map((feature) => (
								<div
									key={feature.title}
									className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md"
								>
									<div className="rounded-full bg-primary/10 p-3">
										{feature.icon}
									</div>
									<h3 className="text-xl font-bold">{feature.title}</h3>
									<p className="text-center text-muted-foreground">
										{feature.description}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* How It Works Section */}
				<section className="w-full py-12 md:py-24 lg:py-32">
					<div className="container px-4 md:px-6">
						<div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
							<div className="space-y-2">
								<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
									How YardCard Elite Works
								</h2>
								<p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
									A simple, intuitive process that delights customers and saves
									you time
								</p>
							</div>
						</div>
						<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
							{howItWorks.map((step, index) => (
								<div
									key={index}
									className="flex flex-col items-center text-center space-y-3 p-4"
								>
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white text-xl font-bold">
										{index + 1}
									</div>
									<h3 className="text-xl font-bold">{step.title}</h3>
									<p className="text-muted-foreground">{step.description}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Problem Solution Section */}
				<section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
					<div className="container px-4 md:px-6">
						<div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
							<div className="space-y-4">
								<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
									The Problem
								</h2>
								<p className="text-muted-foreground md:text-xl">
									Currently, Yard Card Rental businesses rely on customers
									filling out confusing surveys that only get them close to what
									they want. This leads to:
								</p>
								<ul className="space-y-2 text-muted-foreground md:text-lg">
									<li className="flex items-start">
										<svg
											className="mr-2 h-6 w-6 flex-shrink-0 text-primary"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
											></path>
										</svg>
										<span>Time-consuming back-and-forth conversations</span>
									</li>
									<li className="flex items-start">
										<svg
											className="mr-2 h-6 w-6 flex-shrink-0 text-primary"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
											></path>
										</svg>
										<span>Manual payment collection</span>
									</li>
									<li className="flex items-start">
										<svg
											className="mr-2 h-6 w-6 flex-shrink-0 text-primary"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
											></path>
										</svg>
										<span>Customers receiving products they've never seen</span>
									</li>
									<li className="flex items-start">
										<svg
											className="mr-2 h-6 w-6 flex-shrink-0 text-primary"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
											></path>
										</svg>
										<span>Uncertainty about what to expect</span>
									</li>
								</ul>
							</div>
							<div className="space-y-4">
								<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
									Our Solution
								</h2>
								<p className="text-muted-foreground md:text-xl">
									YardCard Elite transforms this process with a visual,
									customer-driven approach that delivers:
								</p>
								<ul className="space-y-2 text-muted-foreground md:text-lg">
									<li className="flex items-start">
										<svg
											className="mr-2 h-6 w-6 flex-shrink-0 text-primary"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											></path>
										</svg>
										<span>Minimal questions with maximum customization</span>
									</li>
									<li className="flex items-start">
										<svg
											className="mr-2 h-6 w-6 flex-shrink-0 text-primary"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											></path>
										</svg>
										<span>
											Visual layout generation based on customer preferences
										</span>
									</li>
									<li className="flex items-start">
										<svg
											className="mr-2 h-6 w-6 flex-shrink-0 text-primary"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											></path>
										</svg>
										<span>Integrated payment processing</span>
									</li>
									<li className="flex items-start">
										<svg
											className="mr-2 h-6 w-6 flex-shrink-0 text-primary"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											></path>
										</svg>
										<span>
											Automated order confirmations for both customers and
											agencies
										</span>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="w-full py-12 md:py-24 lg:py-32">
					<div className="container px-4 md:px-6">
						<div className="flex flex-col items-center justify-center space-y-4 text-center">
							<div className="space-y-2">
								<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
									Ready to Elevate Your Yard Card Business?
								</h2>
								<p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
									Join forward-thinking Yard Card Rental businesses using
									YardCard Elite to delight customers and grow their business.
								</p>
							</div>
							<div className="flex flex-col gap-2 min-[400px]:flex-row">
								<Link href="/signup">
									<Button
										size="lg"
										className="w-full min-[400px]:w-auto"
									>
										Create Your Account
									</Button>
								</Link>
								<Link href="/login">
									<Button
										size="lg"
										variant="outline"
										className="w-full min-[400px]:w-auto"
									>
										Sign In
									</Button>
								</Link>
							</div>
						</div>
					</div>
				</section>
			</main>
			<Footer />
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
				className="h-6 w-6"
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
				className="h-6 w-6"
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
				className="h-6 w-6"
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
				className="h-6 w-6"
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
				className="h-6 w-6"
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
				className="h-6 w-6"
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
