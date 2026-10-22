import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'
import { AuthFrame } from '@/features/auth/components/auth-frame'

export default function SignUpPage() {
  return (
    <AuthFrame
      footer={
        <>
          By creating an account you agree to the{' '}
          <Link href="/terms" className="font-bold text-action-text hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="font-bold text-action-text hover:underline">Privacy Policy</Link>.
        </>
      }
    >
      {/* /routing sends new accounts on to onboarding */}
      <SignUp fallbackRedirectUrl="/routing" signInUrl="/auth/sign-in" />
    </AuthFrame>
  )
}
