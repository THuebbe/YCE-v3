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
            className="block text-label text-neutral-700 mb-2 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              // Base styles from style guide
              "flex h-input w-full rounded-default border-[1.5px] bg-background-white px-4 py-3 text-body placeholder:text-neutral-500 transition-all duration-standard",
              // Focus styles matching style guide
              "focus:border-2 focus:border-primary focus:outline-none focus:ring-0",
              // Error styles
              hasError
                ? "border-error focus:border-error animate-pulse"
                : "border-neutral-300 hover:border-neutral-400",
              // Icon padding adjustments
              leftIcon && "pl-12",
              rightIcon && "pr-12",
              // Disabled styles
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100",
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
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-body-small text-error animate-slide-down"
            role="alert"
          >
            {error}
          </p>
        )}
        {helper && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-body-small text-neutral-500"
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