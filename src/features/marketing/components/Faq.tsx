/** Questions as native disclosure widgets: work without JavaScript, keyboard and screen reader friendly */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="grid gap-2">
      {items.map(item => (
        <details key={item.q} className="group rounded-card border border-line bg-surface px-4 open:pb-4 sm:px-6">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
            {item.q}
            <span aria-hidden className="text-lead text-fg-muted transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="max-w-prose text-fg-muted">{item.a}</p>
        </details>
      ))}
    </div>
  )
}
