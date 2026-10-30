import type { Metadata } from 'next';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Logo } from '@/shared/components/brand/Logo';
import { requireAdmin } from '@/features/admin/access';

export const metadata: Metadata = { title: 'Admin - YardCard Elite', robots: { index: false, follow: false } };

/** The platform owner's pages. Each page calls requireAdmin() too: a layout doesn't guard navigations. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2" aria-label="Admin overview">
            <Logo variant="icon" title="" className="h-8 w-auto" />
            <span className="font-display text-heading font-semibold">Admin</span>
          </Link>
          <nav className="flex gap-1 text-copy">
            <Link href="/admin" className="rounded-control px-3 py-2 hover:bg-surface-sunken">Overview</Link>
            <Link href="/admin/agencies" className="rounded-control px-3 py-2 hover:bg-surface-sunken">Agencies</Link>
          </nav>
          <div className="ml-auto"><UserButton /></div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
