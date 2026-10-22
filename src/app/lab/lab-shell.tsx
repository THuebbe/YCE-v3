import { AppShell } from '@/features/dashboard/components/app-shell'

/** The app shell with a demo agency whose slug is "lab", so tabs and order links stay inside /lab */
export function LabShell({ logoUrl, children }: { logoUrl?: string; children: React.ReactNode }) {
  return (
    <AppShell
      slug="lab"
      agencyName="Lucky Lawn Signs"
      logoUrl={logoUrl?.startsWith('https://') ? logoUrl : undefined}
      bookingUrl="https://yardcard-elite.com/lucky-lawn-signs/booking"
      account={<span aria-hidden className="size-9 rounded-full bg-highlight" />}
    >
      {children}
    </AppShell>
  )
}
