'use client';

import { useEffect, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Copies a link (the agency's booking link by default). `compact` shows the icon only below md. */
export function CopyLinkButton({ url, compact = false, className, label: idleLabel = 'Copy booking link' }: { url: string; compact?: boolean; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard blocked (old browser, insecure context): let them copy it by hand
      window.prompt('Copy this link', url);
    }
  }

  const label = copied ? 'Copied' : idleLabel;
  return (
    <>
    <button
      type="button"
      onClick={copy}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-control border border-line-strong bg-surface px-3 text-fine font-bold text-fg transition-colors hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
        compact && 'w-11 px-0 md:w-auto md:px-3',
        className,
      )}
    >
      {copied ? <Check className="size-4 text-positive" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
      <span className={cn(compact && 'sr-only md:not-sr-only')}>{label}</span>
    </button>
    <span aria-live="polite" className="sr-only">{copied ? 'Booking link copied' : ''}</span>
    </>
  );
}
