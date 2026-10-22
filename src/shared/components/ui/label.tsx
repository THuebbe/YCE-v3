import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-fine font-bold text-fg",
  {
    variants: {
      size: {
        default: "text-fine",
        sm: "text-fine font-semibold",
        lg: "text-copy",
      },
      required: {
        true: "after:content-['*'] after:ml-1 after:text-danger",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      required: false,
    },
  }
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(labelVariants({ size, required, className }))}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label, labelVariants };