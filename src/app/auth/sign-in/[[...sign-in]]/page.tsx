import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { headers } from "next/headers";

export default async function SignInPage() {
	const headersList = await headers();
	const hostname = headersList.get("host") || "";

	// Redirect to routing page to handle user flow after authentication
	const redirectUrl =
		hostname.includes(".localhost") || hostname.includes("localhost")
			? `http://${hostname}/routing`
			: `https://${hostname}/routing`;
	return (
		<div className="flex min-h-screen items-center justify-center bg-background-white px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div className="mt-8">
					<SignIn
						fallbackRedirectUrl="/routing"
						signUpUrl="/auth/sign-up"
						appearance={{
							elements: {
								formButtonPrimary:
									"bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200",
								card: "shadow-xl border border-neutral-200 rounded-xl",
								headerTitle: "text-2xl font-bold text-neutral-900",
								headerSubtitle: "text-neutral-600",
								socialButtonsBlockButton:
									"border border-neutral-300 hover:border-neutral-400 text-neutral-700 hover:bg-neutral-50 transition-colors duration-200",
								formFieldInput:
									"border border-neutral-300 focus:border-primary focus:ring-primary rounded-lg",
								footerActionLink: "text-primary hover:text-primary-dark",
							},
						}}
					/>
				</div>
				{/* No account yet: the plans first, then sign up (decided 2026-10-19) */}
				<p className="text-center text-sm text-neutral-600">
					New to YardCard Elite?{" "}
					<Link href="/pricing" className="font-medium text-primary hover:text-primary-dark">
						See plans and start a free trial
					</Link>
				</p>
			</div>
		</div>
	);
}
