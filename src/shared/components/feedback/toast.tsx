"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "../ui/icons";

const toastVariants = cva(
  "relative flex items-center gap-3 w-full rounded-xl shadow-large border p-4 text-body font-medium transition-all duration-standard",
  {
    variants: {
      variant: {
        success: "bg-background-white border-success text-neutral-900",
        error: "bg-background-white border-error text-neutral-900", 
        warning: "bg-background-white border-warning text-neutral-900",
        info: "bg-background-white border-info text-neutral-900",
        default: "bg-background-white border-neutral-200 text-neutral-900",
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
  success: "text-success",
  error: "text-error", 
  warning: "text-warning",
  info: "text-info",
  default: "text-neutral-500",
};

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  onClose?: () => void;
  action?: React.ReactNode;
  closable?: boolean;
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
            <div className="font-semibold text-neutral-900">{title}</div>
          )}
          {description && (
            <div className="text-body-small text-neutral-600 mt-1">
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
            className="flex-shrink-0 ml-2 p-1 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors duration-standard focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-screen-sm">
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