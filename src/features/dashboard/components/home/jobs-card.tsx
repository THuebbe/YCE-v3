import Link from 'next/link';
import { ArrowDownToLine, ArrowUpFromLine, Check, ChevronRight, TriangleAlert } from 'lucide-react';
import { addDays, formatDay } from '@/features/booking/booking-rules';
import { cn } from '@/lib/utils';
import type { Job, JobsOverview } from '../../jobs';

/**
 * Home's main card: displays going up and coming down, by day, for the
 * next week, plus any pickups that are late. A pickup still to do opens
 * check-in directly; everything else opens the order.
 */
export function JobsCard({ overview, slug }: { overview: JobsOverview; slug: string }) {
  const { today, days, overdue } = overview;
  const tomorrow = addDays(today, 1);
  const label = (day: string) => (day === today ? 'Today' : day === tomorrow ? 'Tomorrow' : formatDay(day).split(',')[0]);

  return (
    <section aria-labelledby="jobs-title" className="rounded-card border border-line bg-surface">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <h2 id="jobs-title" className="font-display text-heading font-semibold">Jobs</h2>
        <Link href={`/${slug}/orders`} className="text-fine font-bold text-action-text hover:underline">All orders</Link>
      </div>

      {overdue.length > 0 && (
        <div className="border-b border-line bg-danger-soft px-4 py-3 sm:px-5">
          <h3 className="flex items-center gap-2 text-fine font-bold text-danger">
            <TriangleAlert className="size-4" aria-hidden />
            {overdue.length === 1 ? '1 pickup is late' : `${overdue.length} pickups are late`}
          </h3>
          <ul className="mt-2 grid grid-cols-1 gap-2">
            {overdue.map(job => <JobRow key={`${job.orderId}-late`} job={job} slug={slug} note={`Due ${shortDay(job.day)}`} />)}
          </ul>
        </div>
      )}

      <div className="divide-y divide-line">
        {days.map(({ day, jobs }) => (
          <div key={day} className="px-4 py-4 sm:px-5">
            <h3 className="mb-2 flex items-baseline gap-2">
              <span className="font-bold">{label(day)}</span>
              <span className="text-fine text-fg-muted">{shortDay(day)}</span>
            </h3>
            {jobs.length === 0 ? (
              <p className="text-fine text-fg-muted">Nothing going up or coming down.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2">
                {jobs.map(job => <JobRow key={`${job.orderId}-${job.kind}`} job={job} slug={slug} />)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/** "Oct 24" */
const shortDay = (day: string) => formatDay(day).split(', ')[1];

const KIND = {
  setup: { label: 'Set up', icon: ArrowUpFromLine, chip: 'bg-notice-soft text-notice' },
  pickup: { label: 'Pick up', icon: ArrowDownToLine, chip: 'bg-caution-soft text-caution' },
} as const;

function JobRow({ job, slug, note }: { job: Job; slug: string; note?: string }) {
  const kind = KIND[job.kind];
  const checkIn = job.kind === 'pickup' && !job.done;
  const href = `/${slug}/orders/${job.orderId}${checkIn ? '/check-in' : ''}`;
  const details = [`${job.signs} ${job.signs === 1 ? 'sign' : 'signs'}`, job.timeWindow, note].filter(Boolean).join(' · ');

  return (
    <li>
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-control border border-line bg-surface p-3 transition-colors hover:border-line-strong focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
          job.done && 'bg-surface-sunken',
        )}
      >
        <span className={cn('inline-flex w-24 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control px-2 py-1 text-fine font-bold', job.done ? 'bg-positive-soft text-positive' : kind.chip)}>
          {job.done ? <Check className="size-4" aria-hidden /> : <kind.icon className="size-4" aria-hidden />}
          {job.done ? 'Done' : kind.label}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate font-semibold', job.done && 'text-fg-muted')}>
            {job.done && <span className="sr-only">{kind.label}, done: </span>}
            {job.customerName}
          </span>
          <span className="block truncate text-fine text-fg-muted">{job.address}</span>
          <span className="block text-fine text-fg-muted">{details}</span>
        </span>
        <span className="hidden text-fine font-bold text-action-text sm:inline">{checkIn ? 'Check in' : 'Open'}</span>
        <ChevronRight className="size-5 shrink-0 text-fg-muted" aria-hidden />
      </Link>
    </li>
  );
}
