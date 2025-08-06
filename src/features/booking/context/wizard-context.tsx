'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { BookingFormData, WizardContextType } from '../types';

const WizardContext = createContext<WizardContextType | undefined>(undefined);

interface WizardProviderProps {
  children: React.ReactNode;
  totalSteps: number;
  initialStep?: number;
  initialData?: Partial<BookingFormData>;
}

export function WizardProvider({ 
  children, 
  totalSteps, 
  initialStep = 1,
  initialData = {}
}: WizardProviderProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [furthestStep, setFurthestStep] = useState(initialStep);
  const [formData, setFormData] = useState<Partial<BookingFormData>>(initialData);

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