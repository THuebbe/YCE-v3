// Server only: never import this from a 'use client' file.
//
// Demo invites (DEMO.md "Flow"): the owner creates a link for a prospect's
// email; the prospect opens it, gets a code at that email, and the code
// borrows them a loaner. Only hashes of the link token and code are stored.
import { supabase } from '@/lib/db/supabase-client';
import { sendDemoCodeEmail } from '@/lib/email';
import { CODE_ATTEMPTS, CODE_SENDS, CONSENT_TEXT, isDemoMode } from './config';
import { codeMatches, hashSecret, isInviteToken, newAccessCode, newInviteToken } from './tokens';
import { endLoan, lendLoaner, loanerForAgency, signInUrlFor, type Loaner } from './loaners';

export interface Invite {
  id: string;
  email: string | null;
  note: string | null;
  created_at: string;
  expires_at: string;
  code_sent_at: string | null;
  code_attempts: number;
  code_sends: number;
  code_hash: string | null;
  used_at: string | null;
  loaner_id: number | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (value: string) => EMAIL_RE.test(value) && value.length <= 254;

function demoOnly() {
  if (!isDemoMode()) throw new Error('demo: not the demo site');
}

async function inviteByToken(token: string): Promise<Invite | null> {
  if (!isInviteToken(token)) return null;
  const { data } = await supabase.from('demo_invites').select('*').eq('token_hash', hashSecret(token)).maybeSingle();
  return (data as Invite | null) ?? null;
}

/** The owner makes a link for one prospect's email. The token is shown once and never stored. */
export async function createInvite(email: string, note: string | null, siteUrl: string): Promise<{ id: string; link: string }> {
  demoOnly();
  const clean = email.trim().toLowerCase();
  if (!isEmail(clean)) throw new Error('That email address doesn’t look right');
  const token = newInviteToken();
  const { data, error } = await supabase.from('demo_invites')
    .insert({ token_hash: hashSecret(token), email: clean, note: note?.trim() || null })
    .select('id').single();
  if (error || !data) throw new Error(`demo invite: ${error?.message}`);
  return { id: data.id as string, link: `${siteUrl.replace(/\/$/, '')}/start/${token}` };
}

export type InviteState =
  | { state: 'invalid' }                     // no such link (or a mangled one)
  | { state: 'expired' }                     // unused for 7 days
  | { state: 'ended' }                       // its demo ran and is over
  | { state: 'ready'; email: string; codeSent: boolean; locked: boolean }  // waiting for a code
  | { state: 'running'; email: string };     // demo in progress: the code signs in again

/** What the start page shows for a link */
export async function inviteState(token: string): Promise<InviteState> {
  demoOnly();
  const invite = await inviteByToken(token);
  if (!invite || !invite.email) return { state: 'invalid' };
  if (invite.used_at) {
    const loaner = invite.loaner_id ? await loanerOfInvite(invite) : null;
    return loaner ? { state: 'running', email: invite.email } : { state: 'ended' };
  }
  if (new Date(invite.expires_at) <= new Date()) return { state: 'expired' };
  return { state: 'ready', email: invite.email, codeSent: !!invite.code_sent_at, locked: invite.code_attempts >= CODE_ATTEMPTS };
}

/** The loaner still lent on this invite, if its demo hasn't ended */
async function loanerOfInvite(invite: Invite): Promise<Loaner | null> {
  const { data } = await supabase.from('demo_loaners').select('*').eq('id', invite.loaner_id!).maybeSingle();
  const loaner = data as Loaner | null;
  if (!loaner || loaner.invite_id !== invite.id || loaner.status !== 'lent') return null;
  return loaner.expires_at && new Date(loaner.expires_at) > new Date() ? loaner : null;
}

/** Emails a fresh code to the invite's own address (never one the visitor types) */
export async function sendCode(token: string): Promise<{ ok: true } | { ok: false; error: string }> {
  demoOnly();
  const invite = await inviteByToken(token);
  if (!invite || !invite.email) return { ok: false, error: 'This demo link isn’t valid.' };
  if (!invite.used_at && new Date(invite.expires_at) <= new Date()) return { ok: false, error: 'This demo link has expired. Ask us for a new one.' };
  if (invite.code_attempts >= CODE_ATTEMPTS) return { ok: false, error: 'Too many wrong codes. Ask us for a new link.' };

  // Throttle: at most CODE_SENDS codes per link, and one a minute
  const { count } = await supabase.from('demo_invites').select('id', { count: 'exact', head: true })
    .eq('id', invite.id).gte('code_sent_at', new Date(Date.now() - 60_000).toISOString());
  if ((count ?? 0) > 0) return { ok: false, error: 'A code was just sent. Check your inbox, or try again in a minute.' };
  if (invite.code_sends >= CODE_SENDS) return { ok: false, error: 'We’ve sent this link’s codes already. Ask us for a new link.' };

  const code = newAccessCode();
  // A new code replaces the old one. That's safe mid-demo: tabs already signed
  // in don't use the code again. Wrong-code count resets only before the demo starts.
  if (!invite.used_at) {
    const { error } = await supabase.from('demo_invites')
      .update({ code_hash: hashSecret(code), code_email: invite.email, code_sent_at: new Date().toISOString(), code_attempts: 0, code_sends: invite.code_sends + 1 })
      .eq('id', invite.id);
    if (error) return { ok: false, error: 'We couldn’t send a code. Please try again.' };
  } else {
    const { error } = await supabase.from('demo_invites')
      .update({ code_hash: hashSecret(code), code_sent_at: new Date().toISOString(), code_sends: invite.code_sends + 1 })
      .eq('id', invite.id);
    if (error) return { ok: false, error: 'We couldn’t send a code. Please try again.' };
  }
  const sent = await sendDemoCodeEmail({ to: invite.email, code });
  if (!sent.success) return { ok: false, error: 'We couldn’t send the email. Please try again.' };
  return { ok: true };
}

/**
 * Checks the code and signs the prospect in: the first time, a loaner is
 * borrowed and reset for them (the 4 hours start); later, within the 4
 * hours, the same code signs them into the same loaner again.
 */
export async function startDemo(token: string, typedCode: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  demoOnly();
  const invite = await inviteByToken(token);
  if (!invite || !invite.email) return { ok: false, error: 'This demo link isn’t valid.' };
  if (invite.code_attempts >= CODE_ATTEMPTS) return { ok: false, error: 'Too many wrong codes. Ask us for a new link.' };

  if (!codeMatches(typedCode, invite.code_hash)) {
    await supabase.from('demo_invites').update({ code_attempts: invite.code_attempts + 1 }).eq('id', invite.id);
    const left = CODE_ATTEMPTS - invite.code_attempts - 1;
    return { ok: false, error: left > 0 ? `That code doesn’t match. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong codes. Ask us for a new link.' };
  }

  // Coming back to a demo that's still running
  if (invite.used_at) {
    const loaner = await loanerOfInvite(invite);
    if (!loaner) return { ok: false, error: 'This demo has ended. Ask us for a new link to start a fresh one.' };
    return { ok: true, url: await signInUrlFor(loaner) };
  }
  if (new Date(invite.expires_at) <= new Date()) return { ok: false, error: 'This demo link has expired. Ask us for a new one.' };

  const loaner = await lendLoaner(invite.id, invite.email);
  if (!loaner) return { ok: false, error: 'All our demos are in use right now. Please try again in a little while.' };

  const now = new Date().toISOString();
  await supabase.from('demo_invites').update({ used_at: now, loaner_id: loaner.id }).eq('id', invite.id);
  await recordLead(invite.email);
  return { ok: true, url: await signInUrlFor(loaner) };
}

async function recordLead(email: string) {
  const { data } = await supabase.from('demo_leads').select('demo_count').eq('email', email).maybeSingle();
  const now = new Date().toISOString();
  if (data) {
    await supabase.from('demo_leads').update({ demo_count: (data.demo_count as number) + 1, last_demo_at: now }).eq('email', email);
  } else {
    await supabase.from('demo_leads').insert({ email, consent_text: CONSENT_TEXT, first_demo_at: now, last_demo_at: now });
  }
}

/** The prospect's own "End demo" button: only their own, running loaner */
export async function endOwnDemo(agencyId: string): Promise<void> {
  const loaner = await loanerForAgency(agencyId);
  if (loaner?.active) await endLoan(loaner.id);
}

export async function listInvites(limit = 50): Promise<Invite[]> {
  demoOnly();
  const { data } = await supabase.from('demo_invites')
    .select('id, email, note, created_at, expires_at, code_sent_at, code_attempts, code_sends, used_at, loaner_id')
    .order('created_at', { ascending: false }).limit(limit);
  return (data ?? []) as Invite[];
}
