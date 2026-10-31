// Server only: never import this from a 'use client' file.
//
// The live admin's side of demo links: it asks the demo site (DEMO.md) and
// never touches the demo database itself. Off unless DEMO_SITE_URL and
// DEMO_ADMIN_SECRET are set in this deployment.

export interface DemoInviteRow {
  id: string;
  email: string | null;
  note: string | null;
  created_at: string;
  expires_at: string;
  code_sent_at: string | null;
  used_at: string | null;
  loaner_id: number | null;
}

export interface DemoLoanerRow {
  id: number;
  status: 'free' | 'lent';
  lent_email: string | null;
  lent_at: string | null;
  expires_at: string | null;
}

export const demoSiteConfigured = () => !!process.env.DEMO_SITE_URL && (process.env.DEMO_ADMIN_SECRET?.length ?? 0) >= 32;

async function call<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${process.env.DEMO_SITE_URL!.replace(/\/$/, '')}/api/demo/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEMO_ADMIN_SECRET}` },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `The demo site answered ${res.status}`);
  return data as T;
}

export const createDemoInvite = (email: string, note: string) => call<{ id: string; link: string }>({ action: 'create', email, note });
export const listDemo = () => call<{ invites: DemoInviteRow[]; loaners: DemoLoanerRow[] }>({ action: 'list' });
export const endDemoLoan = (loanerId: number) => call<{ ok: true }>({ action: 'end', loanerId });
