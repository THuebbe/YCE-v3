'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { WizardProvider, useWizard } from '../context/wizard-context';
import { ProgressIndicator } from './progress-indicator';
import { BookingErrorBoundary } from './error-boundary';
import { ContactInfoStep } from './steps/contact-info-step';
import { EventDetailsStep } from './steps/event-details-step';
import { DisplayCustomizationStep } from './steps/display-customization-step';
import { PaymentStep } from './steps/payment-step';
import { ReviewStep } from './steps/review-step';
import { ConfirmationStep } from './steps/confirmation-step';
import { WizardStep } from '../types';
import { contactSchema, eventSchema, displaySchema, paymentSchema } from '../types';

const wizardSteps: WizardStep[] = [
  {
    id: 1,
    name: 'contact',
    title: 'Contact Information',
    component: ContactInfoStep,
    validation: contactSchema,
  },
  {
    id: 2,
    name: 'event',
    title: 'Event Details',
    component: EventDetailsStep,
    validation: eventSchema,
  },
  {
    id: 3,
    name: 'customize',
    title: 'Customize Display',
    component: DisplayCustomizationStep,
    validation: displaySchema,
  },
  {
    id: 4,
    name: 'payment',
    title: 'Payment Information',
    component: PaymentStep,
    validation: paymentSchema,
  },
  {
    id: 5,
    name: 'review',
    title: 'Review Order',
    component: ReviewStep,
    validation: null,
  },
  {
    id: 6,
    name: 'confirm',
    title: 'Confirmation',
    component: ConfirmationStep,
    validation: null,
  },
];

function BookingWizardContent() {
  const { currentStep, furthestStep, goToStep } = useWizard();
  const [previousStep, setPreviousStep] = useState(currentStep);
  const currentStepData = wizardSteps.find(step => step.id === currentStep);
  
  // Track step direction for animations
  const stepDirection = currentStep > previousStep ? 'forward' : 'backward';
  
  useEffect(() => {
    setPreviousStep(currentStep);
  }, [currentStep]);
  
  if (!currentStepData) {
    console.error('🔍 BookingWizardContent: Step not found', { currentStep, wizardSteps });
    return <div>Step not found</div>;
  }

  const StepComponent = currentStepData.component;
  console.log('🔍 BookingWizardContent: Rendering step', { 
    currentStep, 
    stepName: currentStepData.name,
    componentName: StepComponent.name,
    stepDirection 
  });

  return (
    <div className="min-h-screen bg-background-light">
      <ProgressIndicator 
        currentStep={currentStep} 
        totalSteps={wizardSteps.length}
        furthestStep={furthestStep}
        steps={wizardSteps}
        onStepClick={goToStep}
      />
      
      <main className="container mx-auto py-8">
        {/* Desktop: Fade transitions */}
        <div className="hidden md:block">
          <BookingErrorBoundary>
            <AnimatePresence mode="wait">
              <StepComponent key={currentStep} />
            </AnimatePresence>
          </BookingErrorBoundary>
        </div>
        
        {/* Mobile: Horizontal slide transitions */}
        <div className="md:hidden overflow-x-hidden min-h-[500px]">
          <BookingErrorBoundary>
            <AnimatePresence mode="wait" custom={stepDirection}>
              <StepComponent 
                key={currentStep}
                custom={stepDirection}
              />
            </AnimatePresence>
          </BookingErrorBoundary>
        </div>
      </main>
    </div>
  );
}

interface BookingWizardProps {
  agencyId?: string;
  initialStep?: number;
}

export function BookingWizard({ agencyId, initialStep = 1 }: BookingWizardProps) {
  return (
    <WizardProvider totalSteps={wizardSteps.length} initialStep={initialStep}>
      <BookingWizardContent />
    </WizardProvider>
  );
}