import Link from 'next/link';
import { ClipboardList, ExternalLink } from 'lucide-react';

/** No orders at all yet: what happens when the first one comes in */
export function EmptyOrdersState({ agencySlug }: { agencySlug: string }) {
  return (
    <section className="rounded-card border border-line bg-surface p-6 text-center sm:p-10">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-sunken text-fg-muted">
        <ClipboardList className="size-7" aria-hidden />
      </span>
      <h2 className="mt-4 font-display text-heading font-semibold">No orders yet</h2>
      <p className="mx-auto mt-2 max-w-md text-fg-muted">
        When a customer books on your page, the order shows up here with every sign listed. You get an email too.
      </p>
      <ol className="mx-auto mt-6 grid max-w-sm gap-2 text-left text-fine">
        {['A customer books and pays on your page', 'Get the signs ready, then set them up', 'Pick them up and check them in'].map((step, i) => (
          <li key={step} className="flex items-center gap-3 rounded-control bg-surface-sunken p-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-on-brand">{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <Link
        href={`/${agencySlug}/booking`}
        target="_blank"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-control border border-line-strong bg-surface px-4 font-bold transition-colors hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
      >
        <ExternalLink className="size-4" aria-hidden /> See your booking page
      </Link>
    </section>
  );
}
