import { cn } from '@/lib/utils';

/**
 * An agency's logo, or its initials on the accent color until it uploads
 * one. Used in the booking page header and the dashboard top bar.
 */
export function AgencyMark({ name, logoUrl, className }: { name: string; logoUrl?: string; className?: string }) {
  if (logoUrl) {
    // Agency-supplied image from any https host, so a plain img (no next/image domain list)
    return <img src={logoUrl} alt="" className={cn('h-10 w-auto max-w-[9rem] rounded-control bg-surface object-contain p-1', className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn('flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-accent font-display text-heading font-semibold text-brand', className)}
    >
      {initials(name)}
    </span>
  );
}

/** "Lucky Lawn Signs" -> "LL" */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(w => /[a-z0-9]/i.test(w));
  return (words.slice(0, 2).map(w => w[0]).join('') || '?').toUpperCase();
}
