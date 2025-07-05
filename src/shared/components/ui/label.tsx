import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-label font-medium text-neutral-700 uppercase tracking-wide",
  {
    variants: {
      size: {
        default: "text-label",
        sm: "text-body-small",
        lg: "text-body",
      },
      required: {
        true: "after:content-['*'] after:ml-1 after:text-error",
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