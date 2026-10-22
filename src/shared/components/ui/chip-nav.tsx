'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * A sideways-scrolling row of link chips (no scrollbar). On a phone the
 * current chip can sit past the edge, so the row scrolls it into view.
 */
export function ChipNav({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current) return;
    const overflow = current.offsetLeft + current.offsetWidth - (nav.scrollLeft + nav.clientWidth);
    if (overflow > 0) nav.scrollLeft += overflow + 16;
    else if (current.offsetLeft < nav.scrollLeft) nav.scrollLeft = current.offsetLeft - 16;
  }); // every render: switching chips re-renders without remounting
  return (
    <nav ref={ref} aria-label={label} className={cn('relative -mx-4 overflow-x-auto scrollbar-none px-4 sm:mx-0 sm:px-0', className)}>
      {children}
    </nav>
  );
}
