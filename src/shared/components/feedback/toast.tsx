"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "../ui/icons";

const toastVariants = cva(
  "relative flex items-center gap-3 w-full rounded-card shadow-overlay border border-l-4 bg-surface p-4 text-copy font-semibold text-fg",
  {
    variants: {
      variant: {
        success: "border-line border-l-positive",
        error: "border-line border-l-danger",
        warning: "border-line border-l-caution",
        info: "border-line border-l-notice",
        default: "border-line",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconVariants = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
};

const iconColorVariants = {
  success: "text-positive",
  error: "text-danger",
  warning: "text-caution",
  info: "text-notice",
  default: "text-fg-muted",
};

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  onClose?: () => void;
  action?: React.ReactNode;
  closable?: boolean;
  /** ms before it closes itself (default 5000) */
  duration?: number;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ 
    className, 
    variant = "default", 
    title, 
    description, 
    onClose, 
    action, 
    closable = true,
    duration: _duration, // used by the provider, not a DOM attribute
    children,
    ...props 
  }, ref) => {
    const Icon = iconVariants[variant || "default"];
    const iconColor = iconColorVariants[variant || "default"];

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant, className }))}
        role="alert"
        aria-live="polite"
        {...props}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-bold text-fg">{title}</div>
          )}
          {description && (
            <div className="mt-1 text-fine font-normal text-fg-muted">
              {description}
            </div>
          )}
          {children}
        </div>

        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}

        {closable && onClose && (
          <button
            onClick={onClose}
            className="ml-2 flex size-8 shrink-0 items-center justify-center rounded-control text-fg-muted hover:bg-surface-sunken hover:text-fg focus-visible:outline-none focus-visible:shadow-(--focus-ring)"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";

// Toast Provider and Hook for managing toasts
interface ToastContextType {
  addToast: (toast: Omit<ToastProps, "onClose">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

interface ToastItem extends ToastProps {
  id: string;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastProps, "onClose">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove (default 5 seconds)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration ?? 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
            className="animate-slide-in-right"
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  // Return a toast function that matches the expected API
  const toast = React.useCallback((options: Omit<ToastProps, "onClose">) => {
    context.addToast(options);
  }, [context]);
  
  return { toast };
}

export { Toast, toastVariants };