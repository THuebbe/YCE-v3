import type { Metadata } from 'next'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { SignsTabs, parseSignsTab } from '@/features/inventory/components/signs-tabs'
import { MySigns } from '@/features/inventory/components/my-signs'
import { SignLibrary } from '@/features/inventory/components/sign-library'
import { CustomSigns } from '@/features/inventory/components/custom-signs'
import type { InventoryItem, Sign } from '@/features/inventory/types'
import { LabShell } from '../lab-shell'

export const metadata: Metadata = { title: 'Signs - lab' }

const sign = (id: string, name: string, category: string, image_url: string, is_platform = true): Sign => ({
  id, name, category, image_url, is_platform, themes: [], holidays: [], keywords: [], rental_price: 0, created_at: '', updated_at: '',
})

// A slice of the real library: classic red letters, a few numbers and placeholder decorations
const LIBRARY: Sign[] = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => sign(`L${c}`, `${c} (classic/red)`, 'Letters', `/sign-assets/classic/red/${c}.png`)),
  ...'0123456789'.split('').map(n => sign(`N${n}`, `${n} (classic/red)`, 'Numbers', `/sign-assets/classic/red/${n}.png`)),
  ...['balloon', 'baseball', 'basketball', 'bow'].map(d => sign(`D${d}`, d[0].toUpperCase() + d.slice(1), 'Decorations', `/sign-assets/placeholder/mock-decoration-${d}.png`)),
]
const CUSTOM: Sign[] = [sign('C1', 'Soccer ball (Victory)', 'Sports', '/sign-assets/placeholder/mock-decoration-baseball.png', false)]
const OWNED: Record<string, number> = { LA: 4, LE: 4, LH: 2, LP: 3, LY: 2, LB: 2, LI: 2, LR: 2, LT: 2, LD: 2, N1: 2, N6: 1, Dballoon: 6, C1: 2 }

/**
 * The Signs page with demo stock (preview and dev only). Saving and adding
 * call the real server actions, which refuse here.
 *   ?tab=library|custom   the sections
 *   ?empty=1              no signs owned
 */
export default async function SignsLabPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams
  const tab = parseSignsTab(q.tab)
  const owned = q.empty ? {} : OWNED
  const items: InventoryItem[] = Object.entries(owned).map(([signId, quantity]) => ({
    id: `inv-${signId}`, agency_id: 'lab', sign_id: signId, quantity, available_quantity: quantity, allocated_quantity: 0, deployed_quantity: 0,
    created_at: '', updated_at: '', sign: [...LIBRARY, ...CUSTOM].find(s => s.id === signId),
  }))
  return (
    <LabShell>
      <PageHeader title="Signs" description="What you own. Customers can book displays built from these." />
      <SignsTabs tab={tab} slug="lab" />
      {tab === 'mine' && <MySigns items={items} slug="lab" />}
      {tab === 'library' && <SignLibrary signs={LIBRARY} owned={owned} searchLabel="Search the library" empty={null} />}
      {tab === 'custom' && <CustomSigns signs={CUSTOM} owned={owned} />}
    </LabShell>
  )
}
