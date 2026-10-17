'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { WizardProvider, useWizard } from '../context/wizard-context';
import type { BookingPricing } from '../pricing';
import type { BookingRules } from '../booking-rules';
import type { AgencyContact } from '../types';
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

function BookingWizardContent({ agencyId }: { agencyId?: string }) {
  const { currentStep, furthestStep, goToStep, loadPaymentMethods, paymentMethods } = useWizard();
  const [previousStep, setPreviousStep] = useState(currentStep);
  const currentStepData = wizardSteps.find(step => step.id === currentStep);
  
  // Track step direction for animations
  const stepDirection = currentStep > previousStep ? 'forward' : 'backward';
  
  // Load payment methods when agencyId is available
  useEffect(() => {
    // Not after an error: the Payment step offers "Try again" instead of a loop
    if (agencyId && !paymentMethods.isLoading && !paymentMethods.error && paymentMethods.availablePaymentMethods.length === 0) {
      console.log('🔍 BookingWizard: Loading payment methods for agency:', agencyId);
      loadPaymentMethods(agencyId);
    }
  }, [agencyId, loadPaymentMethods, paymentMethods.isLoading, paymentMethods.error, paymentMethods.availablePaymentMethods.length]);
  
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
        {/* One copy of the step for every screen size (a hidden second copy
            duplicated element ids and would mount Stripe's card form twice) */}
        <div className="overflow-x-hidden md:overflow-visible min-h-[500px]">
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
  agencyId: string;
  agencySlug: string;
  agency: AgencyContact;
  pricing: BookingPricing;
  bookingRules: BookingRules;
  agencyTimeZone?: string;
  initialStep?: number;
}

export function BookingWizard({ agencyId, agencySlug, agency, pricing, bookingRules, agencyTimeZone, initialStep = 1 }: BookingWizardProps) {
  return (
    <WizardProvider agencyId={agencyId} agencySlug={agencySlug} agency={agency} pricing={pricing} bookingRules={bookingRules} agencyTimeZone={agencyTimeZone} totalSteps={wizardSteps.length} initialStep={initialStep}>
      <BookingWizardContent agencyId={agencyId} />
    </WizardProvider>
  );
}