import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helper, leftIcon, rightIcon, ...props }, ref) => {
    const inputId = React.useId();
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-fine font-bold text-fg"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              // 48px tall, 16px text (stops iOS zooming into the field)
              "flex h-12 w-full rounded-control border bg-surface px-4 text-copy text-fg placeholder:text-fg-muted transition-colors duration-150",
              "focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none",
              hasError
                ? "border-danger"
                : "border-line-strong",
              // Icon padding adjustments
              leftIcon && "pl-12",
              rightIcon && "pr-12",
              // Disabled styles
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-sunken",
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-fg-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-fine text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
        {helper && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-fine text-fg-muted"
          >
            {helper}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };