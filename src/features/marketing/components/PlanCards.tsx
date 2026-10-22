import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanCopy } from '../content'

/** The two plans side by side; Elite is the one we point people at */
export function PlanCards({ plans, startLabel }: { plans: PlanCopy[]; startLabel: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plans.map(plan => (
        <section
          key={plan.id}
          className={cn(
            'grid content-start gap-5 rounded-card border bg-surface p-6',
            plan.featured ? 'border-2 border-brand shadow-raised' : 'border-line',
          )}
        >
          <div className="grid gap-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-title font-semibold">{plan.name}</h3>
              {plan.featured && <span className="rounded-control bg-brand px-2 py-1 text-fine font-bold text-on-brand">Most complete</span>}
            </div>
            <p className="text-fg-muted">{plan.tagline}</p>
          </div>
          <p className="flex items-baseline gap-1">
            <span className="font-display text-hero font-semibold tabular-nums">${plan.monthly}</span>
            <span className="text-fg-muted">/month</span>
            <span className="ml-2 text-fine text-fg-muted tabular-nums">or ${plan.annual}/year</span>
          </p>
          <ul className="grid gap-2">
            {plan.features.map(feature => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-positive" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/auth/sign-up"
            className={cn(
              'flex h-12 items-center justify-center rounded-control font-bold',
              plan.featured ? 'bg-action text-on-action hover:bg-action-hover' : 'border border-line-strong bg-surface hover:bg-surface-sunken',
            )}
          >
            {startLabel}
          </Link>
        </section>
      ))}
    </div>
  )
}
