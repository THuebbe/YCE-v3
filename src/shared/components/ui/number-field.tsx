'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * A number box that behaves: a text input with the number keypad (not
 * type="number", which lets "0110" stand, can't place the cursor and
 * changes value on scroll). Keeps exactly what you type while you're in it,
 * drops leading zeros, and starts the cursor at the end when you tap in.
 * Money fields pass prefix="$" and decimals.
 */
export interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'prefix'> {
  value: number | string | null | undefined;
  /** The text as typed (cleaned). Parse it where you store it; '' means empty. */
  onValueChange: (text: string) => void;
  /** Allow cents (money). Whole numbers otherwise. */
  decimals?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  /** Classes for the outer box (width etc.) */
  className?: string;
}

/** Digits (and one dot with up to 2 decimals), without leading zeros */
export function cleanNumberText(raw: string, decimals = false): string {
  let s = raw.replace(decimals ? /[^\d.]/g : /\D/g, '');
  if (decimals) {
    const [whole, ...rest] = s.split('.');
    s = rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
  }
  // "0110" -> "110", "00" -> "0", but keep "0" and "0.5"
  return s.replace(/^0+(?=\d)/, '');
}

const show = (value: NumberFieldProps['value']) => (value === null || value === undefined || Number.isNaN(value) ? '' : String(value));

export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ value, onValueChange, decimals = false, prefix, suffix, className, onFocus, onBlur, disabled, ...props }, ref) => {
    const [text, setText] = React.useState(show(value));
    const focused = React.useRef(false);

    // Follow the stored value when the user isn't typing in this box
    React.useEffect(() => {
      if (!focused.current) setText(show(value));
    }, [value]);

    return (
      <span
        className={cn(
          'flex h-11 items-center gap-1 rounded-control border border-line-strong bg-surface px-3 text-copy text-fg focus-within:border-focus focus-within:shadow-(--focus-ring)',
          disabled && 'bg-surface-sunken opacity-60',
          className,
        )}
      >
        {prefix && <span className="text-fg-muted" aria-hidden>{prefix}</span>}
        <input
          ref={ref}
          type="text"
          inputMode={decimals ? 'decimal' : 'numeric'}
          autoComplete="off"
          disabled={disabled}
          value={text}
          onChange={e => {
            const next = cleanNumberText(e.target.value, decimals);
            setText(next);
            onValueChange(next);
          }}
          onFocus={e => {
            focused.current = true;
            // After the browser places the cursor where you tapped, move it to the end
            const input = e.currentTarget;
            setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
            onFocus?.(e);
          }}
          onBlur={e => {
            focused.current = false;
            setText(show(value));
            onBlur?.(e);
          }}
          className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-fg-muted disabled:cursor-not-allowed"
          {...props}
        />
        {suffix && <span className="shrink-0 text-fine text-fg-muted">{suffix}</span>}
      </span>
    );
  },
);
NumberField.displayName = 'NumberField';
