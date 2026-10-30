import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isDemoMode } from '@/features/demo/config';
import { createInvite, listInvites } from '@/features/demo/invites';
import { endLoan, listLoaners } from '@/features/demo/loaners';
import { SITE_URL } from '@/lib/site';

/**
 * The demo site's private door for the owner's admin on the live site
 * (DEMO.md: demo links live in the one admin). Three actions, one shared
 * secret (DEMO_ADMIN_SECRET in both Vercel projects). Anywhere else, or
 * without the secret, it is a plain 404.
 */
export const runtime = 'nodejs';

function authorized(request: Request): boolean {
  const secret = process.env.DEMO_ADMIN_SECRET;
  const sent = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!secret || secret.length < 32 || !sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

const notFound = () => new NextResponse('Not found', { status: 404 });

export async function POST(request: Request) {
  if (!isDemoMode() || !authorized(request)) return notFound();

  let body: { action?: string; email?: string; note?: string; loanerId?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }

  try {
    switch (body.action) {
      case 'create': {
        const invite = await createInvite(String(body.email ?? ''), body.note ? String(body.note).slice(0, 200) : null, SITE_URL);
        return NextResponse.json(invite);
      }
      case 'list': {
        const [invites, loaners] = await Promise.all([listInvites(), listLoaners()]);
        return NextResponse.json({ invites, loaners });
      }
      case 'end': {
        const id = Number(body.loanerId);
        if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: 'Bad loaner' }, { status: 400 });
        await endLoan(id);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    // createInvite's own message is meant for the owner ("doesn't look right"); keep internals out
    const safe = message.startsWith('demo') ? 'The demo site couldn’t do that. Try again.' : message;
    console.error('demo admin:', body.action, message);
    return NextResponse.json({ error: safe }, { status: 500 });
  }
}
