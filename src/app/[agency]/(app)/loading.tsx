/** Shown inside the app shell while a page loads, so the tabs stay put */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="grid animate-pulse gap-6">
      <div className="h-9 w-48 rounded-control bg-surface-sunken" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-72 rounded-card bg-surface-sunken" />
        <div className="h-40 rounded-card bg-surface-sunken" />
      </div>
    </div>
  )
}
