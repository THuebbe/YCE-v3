/** Chips and a few cards while the orders load */
export function OrdersBoardSkeleton() {
  return (
    <div role="status" aria-label="Loading orders" className="animate-pulse">
      <div className="mb-4 flex gap-2">
        {[7, 6, 5, 7].map((w, i) => <div key={i} className="h-11 rounded-full bg-surface-sunken" style={{ width: `${w}rem` }} />)}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-40 rounded-card bg-surface-sunken" />)}
      </div>
    </div>
  )
}
