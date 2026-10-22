/** The order page's shape while it loads */
export function OrderDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading order" className="animate-pulse">
      <div className="mb-4 h-6 w-20 rounded-control bg-surface-sunken" />
      <div className="mb-6 grid gap-2">
        <div className="h-5 w-40 rounded-control bg-surface-sunken" />
        <div className="h-9 w-64 rounded-control bg-surface-sunken" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-6">
          {[40, 24, 56].map(h => <div key={h} className="rounded-card bg-surface-sunken" style={{ height: `${h / 4}rem` }} />)}
        </div>
        <div className="grid gap-6">
          {[32, 40].map(h => <div key={h} className="rounded-card bg-surface-sunken" style={{ height: `${h / 4}rem` }} />)}
        </div>
      </div>
    </div>
  )
}
