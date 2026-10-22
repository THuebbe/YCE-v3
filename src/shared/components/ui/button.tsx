import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Built on the meaning tokens (DESIGN.md): inside an agency's booking page
// the action colors follow its white label automatically.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-(--focus-ring) disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // The one main action on a screen
        primary: "bg-action text-on-action hover:bg-action-hover",
        // Everything else
        secondary: "border border-line-strong bg-surface text-fg hover:bg-surface-sunken",
        ghost: "bg-transparent text-action-text hover:bg-surface-sunken",
        success: "bg-positive text-on-strong hover:opacity-90",
        error: "bg-danger text-on-strong hover:opacity-90",
        warning: "bg-caution text-on-strong hover:opacity-90",
      },
      size: {
        // 44px: the minimum touch target
        default: "h-11 rounded-control px-5 text-copy",
        sm: "h-9 rounded-control px-3 text-fine",
        lg: "h-12 rounded-control px-6 text-lead",
        icon: "size-11 rounded-control",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="size-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };