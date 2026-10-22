"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("SelectValue must be used within Select")
  }
  
  return (
    <span ref={ref} className={cn("block truncate", className)} {...props}>
      {context.value || placeholder}
    </span>
  )
})
SelectValue.displayName = "SelectValue"

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context) {
      throw new Error("SelectTrigger must be used within Select")
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-control border border-line-strong bg-surface px-3 text-copy text-fg focus-visible:outline-none focus-visible:border-focus focus-visible:shadow-(--focus-ring) disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => context.setOpen(!context.open)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("SelectContent must be used within Select")
  }

  if (!context.open) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-card border border-line bg-surface p-1 text-fg shadow-overlay",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SelectContent.displayName = "SelectContent"

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context) {
      throw new Error("SelectItem must be used within Select")
    }

    const handleClick = () => {
      context.onValueChange?.(value)
      context.setOpen(false)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex min-h-10 w-full cursor-pointer select-none items-center rounded-control px-2 text-copy outline-none hover:bg-surface-sunken focus:bg-surface-sunken data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SelectItem.displayName = "SelectItem"

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem }