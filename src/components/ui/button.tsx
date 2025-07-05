import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles matching style guide
  "inline-flex items-center justify-center whitespace-nowrap text-button font-medium transition-all duration-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-98",
  {
    variants: {
      variant: {
        // Primary Button from style guide
        primary: 
          "bg-primary text-white shadow-button hover:bg-secondary-light active:bg-primary/90 hover:shadow-medium",
        // Secondary Button from style guide
        secondary:
          "bg-background-white border-[1.5px] border-primary text-primary hover:bg-secondary-pale",
        // Ghost Button from style guide
        ghost:
          "bg-transparent text-primary hover:bg-secondary-pale",
        // Success variant
        success:
          "bg-success text-white shadow-button hover:bg-success/90 active:bg-success/80",
        // Error variant
        error:
          "bg-error text-white shadow-button hover:bg-error/90 active:bg-error/80",
        // Warning variant
        warning:
          "bg-warning text-white shadow-button hover:bg-warning/90 active:bg-warning/80",
      },
      size: {
        // Mobile height: 44px, Desktop height: 40px from style guide
        default: "h-button-desktop px-medium py-small md:h-button rounded-default",
        sm: "h-8 px-small py-1 text-body-small rounded-sm",
        lg: "h-12 px-large py-3 text-lg rounded-lg",
        icon: "h-button-desktop w-button-desktop md:h-button md:w-button rounded-default",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };