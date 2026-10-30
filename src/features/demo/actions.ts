'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/db/supabase-client';
import { isDemoMode } from './config';
import { endOwnDemo, sendCode, startDemo } from './invites';

type Result = { ok: true } | { ok: false; error: string };

/** Start page: email this link's code to the address the owner entered */
export async function sendCodeAction(token: string): Promise<Result> {
  if (!isDemoMode()) return { ok: false, error: 'Not available.' };
  return sendCode(token);
}

/** Start page: check the code; on success, where to go to sign in */
export async function startDemoAction(token: string, code: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isDemoMode()) return { ok: false, error: 'Not available.' };
  return startDemo(token, code);
}

/** Dashboard: the prospect ends their own demo */
export async function endDemoAction(): Promise<void> {
  if (!isDemoMode()) return;
  const { userId } = await auth();
  if (userId) {
    const user = await getUserById(userId);
    if (user?.agency?.id) await endOwnDemo(user.agency.id);
  }
  redirect('/demo/ended');
}
