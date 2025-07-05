import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva(
  "mx-auto px-4 sm:px-6 lg:px-8",
  {
    variants: {
      size: {
        sm: "max-w-3xl",
        default: "max-w-7xl",
        lg: "max-w-screen-xl",
        xl: "max-w-screen-2xl",
        full: "max-w-none",
      },
      spacing: {
        none: "px-0",
        tight: "px-2 sm:px-4 lg:px-6",
        default: "px-4 sm:px-6 lg:px-8",
        wide: "px-6 sm:px-8 lg:px-12",
      },
    },
    defaultVariants: {
      size: "default",
      spacing: "default",
    },
  }
);

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(containerVariants({ size, spacing, className }))}
      {...props}
    />
  )
);
Container.displayName = "Container";

export { Container, containerVariants };