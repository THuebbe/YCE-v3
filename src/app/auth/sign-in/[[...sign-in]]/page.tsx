import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { AuthFrame } from "@/features/auth/components/auth-frame";

export default function SignInPage() {
	return (
		<AuthFrame
			// No account yet: the plans first, then sign up (decided 2026-10-19)
			footer={
				<>
					New to YardCard Elite?{" "}
					<Link href="/pricing" className="font-bold text-action-text hover:underline">
						See plans and start a free trial
					</Link>
				</>
			}
		>
			{/* /routing sends them to their agency, or to onboarding */}
			<SignIn fallbackRedirectUrl="/routing" signUpUrl="/auth/sign-up" />
		</AuthFrame>
	);
}
