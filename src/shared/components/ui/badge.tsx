import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-control border px-2 py-0.5 text-fine font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand text-on-brand",
        secondary: "border-transparent bg-surface-sunken text-fg",
        destructive: "border-transparent bg-danger-soft text-danger",
        outline: "border-line-strong text-fg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }