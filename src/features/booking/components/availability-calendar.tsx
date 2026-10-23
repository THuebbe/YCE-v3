'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayStatus } from '../day-status';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** "2026-11" -> the days of that month as YYYY-MM-DD */
function daysOf(month: string): string[] {
  const [y, m] = month.split('-').map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
}

export const monthOf = (day: string) => day.slice(0, 7);

export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const monthLabel = (month: string) =>
  new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

const dayLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

/**
 * A month of days for the event date. Open days can be picked; full days
 * (not enough signs free for this display) and closed days (the agency's
 * booking rules) are grayed out but still tappable, so the customer can
 * find out why (`onInspect`).
 */
export function AvailabilityCalendar({
  month,
  onMonthChange,
  minMonth,
  maxMonth,
  statusOf,
  selected,
  onSelect,
  onInspect,
  inspected,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  minMonth: string;
  maxMonth: string;
  statusOf: (day: string) => DayStatus;
  selected: string | null;
  onSelect: (day: string) => void;
  onInspect: (day: string) => void;
  inspected: string | null;
}) {
  const days = daysOf(month);
  const lead = new Date(`${days[0]}T12:00:00Z`).getUTCDay();

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(month, -1))}
          disabled={month <= minMonth}
          aria-label="Previous month"
          className="flex size-11 items-center justify-center rounded-control text-fg hover:bg-surface-sunken disabled:opacity-30 focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p className="font-display text-lead font-semibold" aria-live="polite">{monthLabel(month)}</p>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(month, 1))}
          disabled={month >= maxMonth}
          aria-label="Next month"
          className="flex size-11 items-center justify-center rounded-control text-fg hover:bg-surface-sunken disabled:opacity-30 focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div role="grid" aria-label={`Event dates, ${monthLabel(month)}`} className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map(d => (
          <span key={d} role="columnheader" className="pb-1 text-fine font-bold text-fg-muted">{d}</span>
        ))}
        {Array.from({ length: lead }, (_, i) => <span key={`lead-${i}`} aria-hidden />)}
        {days.map(day => {
          const status = statusOf(day);
          const open = status.kind === 'open' || status.kind === 'unknown';
          const isSelected = day === selected;
          const why = status.kind === 'full' ? 'not enough signs free' : status.kind === 'closed' ? 'not available' : null;
          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`${dayLabel(day)}${why ? `, ${why}` : ''}`}
              onClick={() => (open ? onSelect(day) : onInspect(day))}
              className={cn(
                'relative flex h-11 items-center justify-center rounded-control text-copy tabular-nums transition-colors focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
                isSelected
                  ? 'bg-action font-bold text-on-action'
                  : open
                    ? 'font-semibold text-fg hover:bg-surface-sunken'
                    : 'text-fg-muted/50',
                status.kind === 'full' && !isSelected && 'bg-surface-sunken line-through decoration-fg-muted/40',
                day === inspected && !isSelected && 'shadow-[inset_0_0_0_2px_var(--color-line-strong)]',
              )}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-fine text-fg-muted">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-3 rounded-sm bg-surface-sunken" /> Signs taken</span>
        <span>Tap a gray day to see why</span>
      </p>
    </div>
  );
}
