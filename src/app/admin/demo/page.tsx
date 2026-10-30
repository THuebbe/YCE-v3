import { requireAdmin } from '@/features/admin/access';
import { demoSiteConfigured, listDemo, type DemoInviteRow, type DemoLoanerRow } from '@/features/admin/demo-client';
import { endDemoAction } from '@/features/admin/demo-actions';
import { CreateInviteForm } from '@/features/admin/components/create-invite-form';
import { Pill, formatDate } from '@/features/admin/components/bits';
import { PageHeader } from '@/features/dashboard/components/page-header';

export const dynamic = 'force-dynamic';

const time = (iso: string | null) => iso
  ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })
  : '—';

function inviteStatus(i: DemoInviteRow): { tone: 'positive' | 'notice' | 'neutral' | 'caution'; label: string } {
  if (i.used_at) return { tone: 'positive', label: `Started ${time(i.used_at)}` };
  if (new Date(i.expires_at) <= new Date()) return { tone: 'neutral', label: 'Expired unused' };
  if (i.code_sent_at) return { tone: 'notice', label: 'Code sent' };
  return { tone: 'caution', label: 'Not opened yet' };
}

export default async function AdminDemoPage() {
  await requireAdmin();
  if (!demoSiteConfigured()) {
    return (
      <>
        <PageHeader title="Demo links" />
        <p className="text-copy text-fg-muted">The demo site isn’t connected to this admin yet. It needs <code>DEMO_SITE_URL</code> and <code>DEMO_ADMIN_SECRET</code> in this deployment (DEMO.md).</p>
      </>
    );
  }

  let data: { invites: DemoInviteRow[]; loaners: DemoLoanerRow[] } | null = null;
  let error: string | null = null;
  try { data = await listDemo(); } catch (e) { error = e instanceof Error ? e.message : 'The demo site didn’t answer.'; }

  const running = (l: DemoLoanerRow) => l.status === 'lent' && !!l.expires_at && new Date(l.expires_at) > new Date();

  return (
    <>
      <PageHeader title="Demo links" description="One link per prospect. The code goes to the email you enter; their 4 hours start when they sign in." />
      <CreateInviteForm />

      {error && <p role="alert" className="mt-6 text-copy text-danger">Couldn’t reach the demo site: {error}</p>}

      {data && (
        <>
          <section className="mt-8">
            <h2 className="font-display text-heading font-semibold">Demo accounts</h2>
            <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
              {data.loaners.map(l => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">Lucky Lawn {l.id}</p>
                    <p className="truncate text-fine text-fg-muted">
                      {running(l) ? <>{l.lent_email} · until {time(l.expires_at)}</> : l.lent_at ? <>last used {time(l.lent_at)}</> : 'not used yet'}
                    </p>
                  </div>
                  {running(l) ? (
                    <form action={endDemoAction} className="flex items-center gap-2">
                      <Pill tone="positive">In use</Pill>
                      <input type="hidden" name="loanerId" value={l.id} />
                      <button type="submit" className="rounded-control border border-line-strong px-3 py-1.5 text-fine hover:bg-surface-sunken">End now</button>
                    </form>
                  ) : <Pill tone="neutral">Free</Pill>}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-heading font-semibold">Recent links</h2>
            {data.invites.length === 0 ? <p className="mt-2 text-copy text-fg-muted">No links yet.</p> : (
              <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
                {data.invites.map(i => {
                  const s = inviteStatus(i);
                  return (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{i.email}</p>
                        <p className="truncate text-fine text-fg-muted">{i.note ? `${i.note} · ` : ''}made {formatDate(i.created_at)}</p>
                      </div>
                      <Pill tone={s.tone}>{s.label}</Pill>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
