import type { Metadata } from 'next'
import { addDays, todayIn } from '@/features/booking/booking-rules'
import { LabShell } from '../lab-shell'
import { HomeView } from '@/features/dashboard/components/home/home-view'
import { SetupChecklist } from '@/features/agency/components/setup-checklist'
import type { Job, JobsOverview } from '@/features/dashboard/jobs'
import type { ReadinessItem } from '@/features/agency/readiness'

export const metadata: Metadata = { title: 'Dashboard - lab' }

/**
 * The dashboard home inside the app shell, with a demo agency and made-up
 * jobs, for design work without a database (preview and dev only, via the
 * lab layout). Tabs and job links stay inside /lab (the demo slug is "lab").
 *
 *   ?plan=essentials  revenue and popular displays locked
 *   ?setup=2          setup checklist with 2 steps left
 *   ?quiet=1          no jobs at all
 *   ?logo=https://... an agency logo in the top bar
 */
export default async function DashboardLabPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams
  const elite = q.plan !== 'essentials'
  const left = Math.min(4, Number(q.setup) || 0)
  const missing = (['plan', 'payments', 'inventory', 'pricing'] as ReadinessItem[]).slice(4 - left)
  const today = todayIn('America/Chicago')
  const slug = 'lab'

  return (
    <LabShell logoUrl={q.logo}>
      <HomeView
        firstName="Tobi"
        slug={slug}
        bookingUrl="https://yardcard-elite.com/lucky-lawn-signs/booking"
        bookingOpen={missing.length === 0}
        notices={<SetupChecklist missing={missing} slug={slug} />}
        jobs={q.quiet ? { today, days: [{ day: today, jobs: [] }], overdue: [] } : demoJobs(today)}
        metrics={{
          openOrders: 9,
          completedOrdersThisMonth: 14,
          revenueLocked: !elite,
          monthlyRevenue: elite ? 1840 : 0,
          monthlyRevenueChange: elite ? 12.4 : 0,
          last30DaysRevenue: elite ? 2215 : 0,
          averageOrderValue: elite ? 118 : 0,
        }}
        popular={elite ? {
          occasions: [
            { name: 'Happy Birthday', count: 38 },
            { name: 'Congratulations Grad', count: 21 },
            { name: "It's a Girl", count: 9 },
            { name: 'Welcome Home', count: 6 },
            { name: 'Custom message', count: 4 },
          ],
          themes: [
            { name: 'Classic', count: 41 },
            { name: 'Unicorn', count: 12 },
            { name: 'Sports', count: 10 },
          ],
        } : null}
      />
    </LabShell>
  )
}

function demoJobs(today: string): JobsOverview {
  const job = (kind: Job['kind'], day: string, customerName: string, address: string, signs: number, done = false, timeWindow: string | null = null): Job => ({
    kind, day, customerName, address, signs, done, timeWindow, orderNumber: 'YCE-0000',
    // Lands on a /lab/orders demo order: the one that's out for pickups, a new one for setups
    orderId: kind === 'pickup' ? 'demo-3' : 'demo-1',
  })
  const tomorrow = addDays(today, 1)
  const later = addDays(today, 3)
  return {
    today,
    overdue: [job('pickup', addDays(today, -2), 'Marcus Lee', '88 Birch Ct, Springfield', 16)],
    days: [
      { day: today, jobs: [
        job('pickup', today, 'Dana Ortiz', '412 Maple St, Springfield', 18, true),
        job('setup', today, 'The Whitfield Family', '1903 Old Mill Rd, Springfield', 22, false, '6–8 AM'),
        job('setup', today, 'Priya Shah', '7 Cardinal Way, Riverton', 14),
      ] },
      { day: tomorrow, jobs: [job('pickup', tomorrow, 'Whitfield Family', '1903 Old Mill Rd, Springfield', 22)] },
      { day: later, jobs: [job('setup', later, 'Jordan Baker', '230 Elm Ave, Springfield', 12, false, '7–9 AM')] },
    ],
  }
}
