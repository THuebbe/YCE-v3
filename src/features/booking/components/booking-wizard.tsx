'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { WizardProvider, useWizard } from '../context/wizard-context';
import { ProgressIndicator } from './progress-indicator';
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
  const { currentStep } = useWizard();
  const currentStepData = wizardSteps.find(step => step.id === currentStep);
  
  if (!currentStepData) {
    return <div>Step not found</div>;
  }

  const StepComponent = currentStepData.component;

  return (
    <div className="min-h-screen bg-background-light">
      <ProgressIndicator 
        currentStep={currentStep} 
        totalSteps={wizardSteps.length}
        steps={wizardSteps}
      />
      
      <main className="container mx-auto py-8">
        <AnimatePresence mode="wait">
          <StepComponent key={currentStep} />
        </AnimatePresence>
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