"use client";

import { ErrorBoundary } from "react-error-boundary";
import { Container } from "@/shared/components/layout/container";
import { Button } from "@/shared/components/ui/button";
import { AlertTriangle, RefreshCw } from "@/shared/components/ui/icons";
import type { DashboardLayoutProps } from "../types";

export function DashboardLayout({ children, className = "" }: DashboardLayoutProps) {
  return (
    <ErrorBoundary FallbackComponent={DashboardErrorFallback}>
      <Container size="default" className={className}>
        {children}
      </Container>
    </ErrorBoundary>
  );
}

function DashboardErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error/10 mb-4">
          <AlertTriangle className="h-6 w-6 text-error" />
        </div>
        
        <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
          Dashboard Error
        </h3>
        
        <p className="text-body text-neutral-600 mb-6">
          We encountered an error loading your dashboard data. This might be temporary.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={resetErrorBoundary}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Refresh Page
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 p-4 bg-neutral-50 rounded-lg text-left">
            <summary className="text-sm font-medium text-neutral-700 cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="text-xs text-neutral-600 mt-2 overflow-auto">
              {error?.message || 'Unknown error'}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Quick Actions Bar Component
export function QuickActionsBar() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <Button size="lg">
        View All Orders
      </Button>
      <Button variant="secondary" size="lg">
        Manage Inventory
      </Button>
      <Button variant="ghost" size="lg">
        Download Reports
      </Button>
    </div>
  );
}

// Dashboard Section Wrapper
interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function DashboardSection({ 
  title, 
  children, 
  action, 
  className = "" 
}: DashboardSectionProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-neutral-900">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}