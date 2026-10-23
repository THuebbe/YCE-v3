'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The building blocks every booking step shares, on the brand tokens
 * (DESIGN.md), so the steps stay consistent and mobile first.
 */

/** Slides a step in from the side it came from; just fades with reduced motion */
export function StepMotion({ custom, children }: { custom?: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const offset = reduce ? 0 : custom === 'backward' ? -24 : 24;
  return (
    <motion.div
      initial={{ opacity: 0, x: offset }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -offset }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="grid gap-6"
    >
      {children}
    </motion.div>
  );
}

/**
 * Progressive reveal: a field slides down from behind the one above once
 * that one is filled (PRODUCT.md "Booking configurator"). Just fades with
 * reduced motion.
 */
export function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -16 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto', y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** One line under the progress bar saying what this step is for */
export function StepIntro({ children }: { children: React.ReactNode }) {
  return <p className="max-w-prose text-copy text-fg-muted">{children}</p>;
}

export function StepSection({ title, hint, children, className }: { title?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('grid gap-4 rounded-card border border-line bg-surface p-4 sm:p-6', className)}>
      {(title || hint) && (
        <div className="grid gap-1">
          {title && <h2 className="font-display text-heading font-semibold">{title}</h2>}
          {hint && <p className="text-fine text-fg-muted">{hint}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

/** A labelled control with its error or hint underneath */
export function Field({ id, label, error, hint, children }: { id?: string; label: React.ReactNode; error?: string | null; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-fine font-bold text-fg">{label}</label>
      {children}
      {error ? (
        <p className="text-fine text-danger" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-fine text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Plain textarea on the input styling */
export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full resize-none rounded-control border border-line-strong bg-surface px-4 py-3 text-copy text-fg placeholder:text-fg-muted focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  ),
);
TextArea.displayName = 'TextArea';

/** A radio option drawn as a card: the whole card is the hit area */
export function ChoiceCard({
  name, value, checked, onChange, title, detail, className,
}: {
  name: string; value: string; checked: boolean; onChange: (value: string) => void;
  title: React.ReactNode; detail?: React.ReactNode; className?: string;
}) {
  return (
    <label
      className={cn(
        'flex min-h-14 cursor-pointer items-center gap-3 rounded-control border p-4 transition-colors has-[:focus-visible]:shadow-(--focus-ring)',
        checked ? 'border-action bg-action/10' : 'border-line-strong bg-surface hover:bg-surface-sunken',
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={e => onChange(e.target.value)} className="sr-only" />
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="font-bold text-fg">{title}</span>
        {detail && <span className="text-fine text-fg-muted">{detail}</span>}
      </span>
      <span
        aria-hidden
        className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border-2', checked ? 'border-action' : 'border-line-strong')}
      >
        {checked && <span className="size-2.5 rounded-full bg-action" />}
      </span>
    </label>
  );
}

/** − 2 + : a small number picker with 44px buttons */
export function Stepper({ label, value, min = 0, max, onChange }: { label: string; value: number; min?: number; max: number; onChange: (value: number) => void }) {
  const btn = 'flex size-11 items-center justify-center rounded-control border border-line-strong bg-surface text-lead font-bold text-fg hover:bg-surface-sunken disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-(--focus-ring)';
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={`Fewer ${label}`} className={btn} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="w-8 text-center text-lead font-bold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label={`More ${label}`} className={btn} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

/** Back and Continue. Sticks to the bottom of the screen on phones so the next step is always one thumb away. */
export function StepNav({
  onBack, onNext, nextLabel = 'Continue', nextDisabled, busy, hideNext,
}: {
  onBack?: () => void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; busy?: boolean; hideNext?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
      <div className="flex gap-3 sm:justify-between">
        {onBack ? (
          <Button variant="secondary" onClick={onBack} className="flex-1 sm:flex-none sm:px-8">Back</Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        {!hideNext && (
          <Button onClick={onNext} disabled={nextDisabled} loading={busy} className="flex-[2] sm:flex-none sm:px-8">
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export const money = (n: number) => `$${n.toFixed(2)}`;
