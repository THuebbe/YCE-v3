'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { WizardStep } from '../types';

interface ProgressIndicatorProps {
  currentStep: number;
  furthestStep: number;
  /** Steps that count toward progress (not the confirmation page) */
  steps: WizardStep[];
  onStepClick: (step: number) => void;
}

/**
 * Mobile first: "Step 2 of 5" and the step name, over a segmented bar.
 * Segments for steps already reached are buttons back to that step; names
 * show under the bar from tablet width up.
 */
export function ProgressIndicator({ currentStep, furthestStep, steps, onStepClick }: ProgressIndicatorProps) {
  const index = steps.findIndex(s => s.id === currentStep);
  const current = steps[index];
  if (!current) return null;

  return (
    <nav aria-label="Booking progress" className="mx-auto w-full max-w-4xl px-4 pt-6 sm:px-6">
      <p className="text-fine font-bold text-fg-muted tabular-nums">
        Step {index + 1} of {steps.length}
      </p>
      <p className="font-display text-heading font-semibold text-fg">{current.title}</p>
      <ol className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, i) => {
          const reached = step.id <= furthestStep;
          const done = step.id < currentStep;
          const here = step.id === currentStep;
          const bar = (
            <span
              className={cn(
                'block h-2 rounded-control transition-colors',
                here ? 'bg-action' : done || reached ? 'bg-brand' : 'bg-line',
              )}
            />
          );
          return (
            <li key={step.id} className="min-w-0">
              {reached && !here ? (
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  className="group block w-full py-2 text-left focus-visible:outline-none"
                  aria-label={`Back to step ${i + 1}: ${step.title}`}
                >
                  <span className="block rounded-control group-focus-visible:shadow-(--focus-ring)">{bar}</span>
                  <span className="mt-2 hidden truncate text-fine text-fg-muted group-hover:text-fg md:block">{step.title}</span>
                </button>
              ) : (
                <span className="block py-2" aria-current={here ? 'step' : undefined}>
                  {bar}
                  <span className={cn('mt-2 hidden truncate text-fine md:block', here ? 'font-bold text-fg' : 'text-fg-muted')}>
                    {step.title}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
