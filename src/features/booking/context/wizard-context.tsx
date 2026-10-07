'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BookingFormData, WizardContextType } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import type { BookingPricing } from '../pricing';
import type { BookingRules } from '../booking-rules';
import { touchBookingHold } from '../actions';

const SESSION_KEY = 'yce_booking_session';

/** One id per browser tab's wizard run; survives a reload, not a new tab.
 *  Never rendered, so a server/client mismatch here is harmless. */
function loadSessionId(): string {
  const fresh = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (typeof window === 'undefined') return fresh;
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    window.sessionStorage.setItem(SESSION_KEY, fresh);
  } catch {
    // Storage blocked (private mode): a per-page-load id still works
  }
  return fresh;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

interface WizardProviderProps {
  children: React.ReactNode;
  agencyId: string;
  agencySlug: string;
  pricing: BookingPricing;
  bookingRules: BookingRules;
  totalSteps: number;
  initialStep?: number;
  initialData?: Partial<BookingFormData>;
}

export function WizardProvider({ 
  children, 
  agencyId,
  agencySlug,
  pricing,
  bookingRules,
  totalSteps, 
  initialStep = 1,
  initialData = {}
}: WizardProviderProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [furthestStep, setFurthestStep] = useState(initialStep);
  const [formData, setFormData] = useState<Partial<BookingFormData>>(initialData);
  const [sessionId] = useState(loadSessionId);

  // Moving through the wizard is activity: keep the sign hold from lapsing
  // (it expires after an hour without any).
  const holdId = formData.display?.holdId;
  useEffect(() => {
    if (!holdId) return;
    touchBookingHold({ agencySlug, sessionId, holdId }).catch(() => {});
  }, [currentStep, holdId, agencySlug, sessionId]);
  
  // Payment methods hook
  const paymentMethodsHook = usePaymentMethods();

  const updateFormData = useCallback((stepData: Partial<BookingFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...stepData,
    }));
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const newStep = Math.min(prev + 1, totalSteps);
      // Update furthest step when moving forward
      setFurthestStep(current => Math.max(current, newStep));
      return newStep;
    });
    scrollToTop();
  }, [totalSteps, scrollToTop]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    scrollToTop();
  }, [scrollToTop]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      // Prevent jumping ahead to incomplete steps
      if (step > furthestStep) {
        alert(`Please complete the previous steps before proceeding to Step ${step}.`);
        return;
      }
      setCurrentStep(step);
      scrollToTop();
    }
  }, [totalSteps, furthestStep, scrollToTop]);

  const canGoNext = currentStep < totalSteps;
  const canGoPrev = currentStep > 1;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const value: WizardContextType = {
    agencyId,
    agencySlug,
    pricing,
    bookingRules,
    sessionId,
    currentStep,
    totalSteps,
    furthestStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    canGoNext,
    canGoPrev,
    isFirstStep,
    isLastStep,
    // Payment methods
    paymentMethods: {
      availablePaymentMethods: paymentMethodsHook.availablePaymentMethods,
      isLoading: paymentMethodsHook.isLoading,
      error: paymentMethodsHook.error,
      defaultPaymentMethod: paymentMethodsHook.defaultPaymentMethod,
    },
    loadPaymentMethods: paymentMethodsHook.loadPaymentMethods,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}