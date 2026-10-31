'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { CopyLinkButton } from '@/features/dashboard/components/copy-link-button';
import { createInviteAction, type CreateInviteResult } from '../demo-actions';

/** Email (required) and a note; shows the new link once, ready to copy */
export function CreateInviteForm() {
  const [result, action, pending] = useActionState<CreateInviteResult | null, FormData>(createInviteAction, null);
  return (
    <form action={action} className="rounded-card border border-line bg-surface p-4">
      <div className="grid gap-3 md:grid-cols-[2fr_2fr_auto] md:items-end">
        <label className="grid gap-1 text-fine font-semibold">
          Prospect’s email
          <input name="email" type="email" required autoComplete="off" placeholder="owner@theirbusiness.com"
            className="h-12 rounded-control border border-line-strong bg-surface px-3 text-copy font-normal focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none" />
        </label>
        <label className="grid gap-1 text-fine font-semibold">
          Note <span className="font-normal text-fg-muted">(only you see it)</span>
          <input name="note" maxLength={200} placeholder="Victory Store, Tuesday pitch"
            className="h-12 rounded-control border border-line-strong bg-surface px-3 text-copy font-normal focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none" />
        </label>
        <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create link'}</Button>
      </div>
      {result && !result.ok && <p role="alert" className="mt-3 text-fine text-danger">{result.error}</p>}
      {result?.ok && (
        <div className="mt-4 rounded-control bg-positive-soft p-3">
          <p className="text-fine font-semibold text-positive">Link for {result.email}. It’s shown only now, so copy it before leaving this page.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-control bg-surface px-2 py-1 text-fine">{result.link}</code>
            <CopyLinkButton url={result.link} label="Copy link" />
          </div>
          <p className="mt-2 text-fine text-fg-muted">Works for 7 days if unused. The code goes only to {result.email}.</p>
        </div>
      )}
    </form>
  );
}
