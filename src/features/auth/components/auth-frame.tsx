import Link from 'next/link';
import { Logo } from '@/shared/components/brand/Logo';

/** Sign-in and sign-up: our logo, the Clerk widget, a line under it */
export function AuthFrame({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-canvas px-4 py-10 font-body text-fg">
      <Link href="/" className="mb-8 block w-full max-w-[14rem]" aria-label="YardCard Elite home">
        <Logo className="h-auto w-full" title="" />
      </Link>
      <main className="flex w-full max-w-md flex-col items-center gap-6">
        {children}
        {footer && <p className="text-center text-fine text-fg-muted">{footer}</p>}
      </main>
    </div>
  );
}
