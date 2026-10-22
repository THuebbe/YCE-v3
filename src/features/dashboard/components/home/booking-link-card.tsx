'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Share2 } from 'lucide-react';
import { CopyLinkButton } from '../copy-link-button';

/** The agency's booking link, with copy, share (phones) and open */
export function BookingLinkCard({ url, open }: { url: string; open: boolean }) {
  // navigator.share only exists in the browser, mostly on phones
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function'), []);

  const display = url.replace(/^https?:\/\//, '');
  return (
    <section aria-labelledby="link-title" className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <h2 id="link-title" className="font-display text-heading font-semibold">Your booking page</h2>
      <p className="mt-1 text-fine text-fg-muted">
        {open ? 'Share it anywhere customers find you.' : 'Closed to customers until setup is done.'}
      </p>
      <p className="mt-3 truncate rounded-control bg-surface-sunken px-3 py-2 font-semibold" title={url}>{display}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyLinkButton url={url} className="flex-1" />
        {canShare && (
          <button
            type="button"
            onClick={() => navigator.share({ url, title: 'Book your yard display' }).catch(() => {})}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-control border border-line-strong bg-surface px-3 text-fine font-bold transition-colors hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
          >
            <Share2 className="size-4" aria-hidden /> Share
          </button>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-control px-3 text-fine font-bold text-action-text transition-colors hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
        >
          <ExternalLink className="size-4" aria-hidden /> Open<span className="sr-only"> booking page in a new tab</span>
        </a>
      </div>
    </section>
  );
}
