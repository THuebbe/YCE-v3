"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X } from "../ui/icons";
import { Button } from "../ui/button";

const modalOverlayVariants = cva(
  "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
);

const modalContentVariants = cva(
  "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background-white p-6 shadow-large duration-standard data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
  {
    variants: {
      size: {
        sm: "max-w-lg rounded-xl",
        default: "max-w-2xl rounded-xl",
        lg: "max-w-4xl rounded-xl",
        xl: "max-w-6xl rounded-xl",
        full: "max-w-screen max-h-screen rounded-none",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalContentVariants> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    className,
    size,
    open = false,
    onOpenChange,
    title,
    description,
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    children,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open);

    React.useEffect(() => {
      setIsOpen(open);
    }, [open]);

    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (closeOnEscape && event.key === "Escape" && isOpen) {
          handleClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }, [isOpen, closeOnEscape]);

    const handleClose = () => {
      setIsOpen(false);
      onOpenChange?.(false);
    };

    const handleOverlayClick = (event: React.MouseEvent) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        handleClose();
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50">
        {/* Overlay */}
        <div
          className={modalOverlayVariants()}
          onClick={handleOverlayClick}
          data-state={isOpen ? "open" : "closed"}
        />
        
        {/* Content */}
        <div
          ref={ref}
          className={cn(modalContentVariants({ size, className }))}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
          data-state={isOpen ? "open" : "closed"}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-h3 font-semibold text-neutral-900">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="text-body text-neutral-600 mt-1">
                    {description}
                  </p>
                )}
              </div>
              
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="flex-shrink-0 ml-4"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Modal.displayName = "Modal";

// Modal components for better composition
const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 text-left", className)}
    {...props}
  />
));
ModalHeader.displayName = "ModalHeader";

const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-h3 font-semibold text-neutral-900", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-body text-neutral-600", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

const ModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1", className)}
    {...props}
  />
));
ModalContent.displayName = "ModalContent";

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-neutral-200", className)}
    {...props}
  />
));
ModalFooter.displayName = "ModalFooter";

export { 
  Modal, 
  ModalHeader, 
  ModalTitle, 
  ModalDescription, 
  ModalContent, 
  ModalFooter,
  modalContentVariants 
};