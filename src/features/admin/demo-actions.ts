'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from './access';
import { createDemoInvite, demoSiteConfigured, endDemoLoan } from './demo-client';

export type CreateInviteResult = { ok: true; link: string; email: string } | { ok: false; error: string };

/** The owner makes a demo link for one prospect's email (DEMO.md) */
export async function createInviteAction(_prev: CreateInviteResult | null, form: FormData): Promise<CreateInviteResult> {
  await requireAdmin();
  if (!demoSiteConfigured()) return { ok: false, error: 'The demo site isn’t connected yet.' };
  const email = String(form.get('email') ?? '').trim();
  const note = String(form.get('note') ?? '').trim();
  if (!email) return { ok: false, error: 'Enter the prospect’s email.' };
  try {
    const { link } = await createDemoInvite(email, note);
    revalidatePath('/admin/demo');
    return { ok: true, link, email };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'The demo site didn’t answer.' };
  }
}

/** Ends a running demo now; the loaner is reset when it's next lent */
export async function endDemoAction(form: FormData): Promise<void> {
  await requireAdmin();
  const loanerId = Number(form.get('loanerId'));
  if (!Number.isInteger(loanerId) || loanerId < 1) return;
  await endDemoLoan(loanerId);
  revalidatePath('/admin/demo');
}
