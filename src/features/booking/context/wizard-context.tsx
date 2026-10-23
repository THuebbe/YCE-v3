'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AgencyContact, BookingFormData, ExtendedBookingFormData, WizardContextType } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import type { BookingPricing } from '../pricing';
import type { AgencyPolicies } from '../policies';
import type { BookingRules } from '../booking-rules';
import { useAvailability } from './use-availability';
import { todayIn } from '../booking-rules';
import { createBookingHold, getAvailabilitySnapshot, getBookingCatalog, saveDisplaySnapshot, touchBookingHold } from '../actions';

/** The server calls the wizard makes. Real server actions by default; the
 *  design lab passes demo versions so every step renders without a database. */
export interface BookingActions {
  getBookingCatalog: typeof getBookingCatalog;
  createBookingHold: typeof createBookingHold;
  touchBookingHold: typeof touchBookingHold;
  saveDisplaySnapshot: typeof saveDisplaySnapshot;
  getAvailabilitySnapshot: typeof getAvailabilitySnapshot;
}

const SERVER_ACTIONS: BookingActions = { getBookingCatalog, createBookingHold, touchBookingHold, saveDisplaySnapshot, getAvailabilitySnapshot };

const SESSION_KEY = 'yce_booking_session';
// + agency slug. v2: the step order changed (contact moved after display),
// so progress saved under the old numbering must not be restored.
const STATE_KEY = 'yce_booking_state:v2:';

type SavedWizard = { formData: Partial<BookingFormData>; currentStep: number; furthestStep: number };

/** Wizard progress for this tab, so a refresh or the browser's Back button
 *  doesn't throw the customer back to step 1 (their sign hold lives on). */
function loadSavedWizard(agencySlug: string, totalSteps: number): SavedWizard | null {
  try {
    const raw = window.sessionStorage.getItem(STATE_KEY + agencySlug);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedWizard;
    const eventDate = saved.formData?.event?.eventDate;
    if (saved.formData?.event && eventDate) {
      saved.formData.event = { ...saved.formData.event, eventDate: new Date(eventDate as unknown as string) };
    }
    const clamp = (n: unknown) => Math.min(Math.max(Math.trunc(Number(n)) || 1, 1), totalSteps);
    const furthestStep = clamp(saved.furthestStep);
    return { formData: saved.formData ?? {}, furthestStep, currentStep: Math.min(clamp(saved.currentStep), furthestStep) };
  } catch {
    return null;
  }
}

/** Start the next booking from scratch (after an order, or on request). */
export function clearSavedWizard(agencySlug: string) {
  try { window.sessionStorage.removeItem(STATE_KEY + agencySlug); } catch {}
}

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
  agency: AgencyContact;
  pricing: BookingPricing;
  /** Cancellation, late and damage fees for the booking terms */
  policies: AgencyPolicies;
  bookingRules: BookingRules;
  agencyTimeZone?: string;
  totalSteps: number;
  actions?: BookingActions;
  /** Ignored: the wizard always starts at step 1 (or saved progress). */
  initialStep?: number;
  initialData?: Partial<BookingFormData>;
}

export function WizardProvider({ 
  children, 
  agencyId,
  agencySlug,
  agency,
  pricing,
  policies,
  bookingRules,
  agencyTimeZone,
  totalSteps, 
  actions = SERVER_ACTIONS,
  initialData = {}
}: WizardProviderProps) {
  // Always start at step 1: a ?step= in the URL used to jump straight to an
  // empty "Order Confirmed!" page. Saved progress (below) is the only way in.
  const [currentStep, setCurrentStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [formData, setFormData] = useState<Partial<BookingFormData>>(initialData);
  // Steps copy formData when they mount, so restore before rendering them
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const saved = loadSavedWizard(agencySlug, totalSteps);
    if (saved) {
      setFormData(saved.formData);
      setCurrentStep(saved.currentStep);
      setFurthestStep(saved.furthestStep);
    }
    setRestored(true);
  }, [agencySlug, totalSteps]);
  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(STATE_KEY + agencySlug, JSON.stringify({ formData, currentStep, furthestStep }));
    } catch {
      // Storage blocked: the wizard still works, it just won't survive a refresh
    }
  }, [restored, agencySlug, formData, currentStep, furthestStep]);
  // Once the order is placed, the wizard is finished: no going back to
  // Review to place it again (the hold is already used up).
  const orderPlaced = Boolean((formData as Partial<ExtendedBookingFormData>).orderResult);
  const [sessionId] = useState(loadSessionId);
  // The agency's zone when it set one, else the customer's browser zone
  const [timeZone] = useState<string | undefined>(() => {
    if (agencyTimeZone) return agencyTimeZone;
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  });

  // The agency's stock and holds, shared by step 1 and the design step
  const [today] = useState(() => todayIn(timeZone));
  const availability = useAvailability(actions, agencySlug, sessionId, today);

  // Moving through the wizard is activity: keep the sign hold from lapsing.
  // Anonymous holds last 15 minutes; once contact details are in, an hour
  // (PRODUCT.md "Booking configurator"), so leaving the contact step extends it.
  const holdId = formData.display?.holdId;
  const hasContact = Boolean(formData.contact?.email);
  useEffect(() => {
    if (!holdId) return;
    actions.touchBookingHold({ agencySlug, sessionId, holdId, stage: hasContact ? 'contact' : 'design' }).catch(() => {});
  }, [currentStep, holdId, hasContact, agencySlug, sessionId, actions]);
  
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
    if (orderPlaced) return;
    setCurrentStep(prev => {
      const newStep = Math.min(prev + 1, totalSteps);
      // Update furthest step when moving forward
      setFurthestStep(current => Math.max(current, newStep));
      return newStep;
    });
    scrollToTop();
  }, [totalSteps, scrollToTop, orderPlaced]);

  const prevStep = useCallback(() => {
    if (orderPlaced) return;
    setCurrentStep(prev => Math.max(prev - 1, 1));
    scrollToTop();
  }, [scrollToTop, orderPlaced]);

  const goToStep = useCallback((step: number) => {
    if (orderPlaced) return;
    if (step >= 1 && step <= totalSteps) {
      // Prevent jumping ahead to incomplete steps
      if (step > furthestStep) return;
      setCurrentStep(step);
      scrollToTop();
    }
  }, [totalSteps, furthestStep, scrollToTop, orderPlaced]);

  const canGoNext = !orderPlaced && currentStep < totalSteps;
  const canGoPrev = !orderPlaced && currentStep > 1;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const value: WizardContextType = {
    agencyId,
    agencySlug,
    agency,
    pricing,
    policies,
    bookingRules,
    sessionId,
    timeZone,
    actions,
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
    availability,
  };

  return (
    <WizardContext.Provider value={value}>
      {restored ? children : <div className="min-h-[60vh]" aria-busy="true" />}
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