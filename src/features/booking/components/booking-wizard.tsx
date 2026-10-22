'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { WizardProvider, useWizard, type BookingActions } from '../context/wizard-context';
import type { BookingPricing } from '../pricing';
import type { AgencyPolicies } from '../policies';
import type { BookingRules } from '../booking-rules';
import type { AgencyContact } from '../types';
import { ProgressIndicator } from './progress-indicator';
import { BookingErrorBoundary } from './error-boundary';
import { BookingFrame } from './booking-frame';
import { ContactInfoStep } from './steps/contact-info-step';
import { EventDetailsStep } from './steps/event-details-step';
import { DisplayCustomizationStep } from './steps/display-customization-step';
import { PaymentStep } from './steps/payment-step';
import { ReviewStep } from './steps/review-step';
import { ConfirmationStep } from './steps/confirmation-step';
import { WizardStep } from '../types';
import { contactSchema, eventSchema, displaySchema, paymentSchema } from '../types';
import { STEP } from '../step-order';
import type { AgencyBranding } from '@/features/agency/branding';

// In STEP order (step-order.ts): design before details
const wizardSteps: WizardStep[] = [
  { id: STEP.event, name: 'event', title: 'When and where', component: EventDetailsStep, validation: eventSchema },
  { id: STEP.display, name: 'display', title: 'Design your display', component: DisplayCustomizationStep, validation: displaySchema },
  { id: STEP.contact, name: 'contact', title: 'Your details', component: ContactInfoStep, validation: contactSchema },
  { id: STEP.payment, name: 'payment', title: 'Payment', component: PaymentStep, validation: paymentSchema },
  { id: STEP.review, name: 'review', title: 'Review and book', component: ReviewStep, validation: null },
  { id: STEP.confirm, name: 'confirm', title: 'Booked', component: ConfirmationStep, validation: null },
];

/** The steps the progress bar counts: everything before the confirmation */
const progressSteps = wizardSteps.filter(s => s.id !== STEP.confirm);

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
      loadPaymentMethods(agencyId);
    }
  }, [agencyId, loadPaymentMethods, paymentMethods.isLoading, paymentMethods.error, paymentMethods.availablePaymentMethods.length]);

  useEffect(() => {
    setPreviousStep(currentStep);
  }, [currentStep]);

  if (!currentStepData) {
    console.error('BookingWizard: step not found', { currentStep });
    return null;
  }

  const StepComponent = currentStepData.component;

  return (
    <>
      {currentStep !== STEP.confirm && (
        <ProgressIndicator
          currentStep={currentStep}
          furthestStep={furthestStep}
          steps={progressSteps}
          onStepClick={goToStep}
        />
      )}
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        {/* One copy of the step for every screen size (a hidden second copy
            duplicated element ids and would mount Stripe's card form twice) */}
        <div className="min-h-[500px] overflow-x-hidden md:overflow-visible">
          <BookingErrorBoundary>
            <AnimatePresence mode="wait" custom={stepDirection}>
              <StepComponent key={currentStep} custom={stepDirection} />
            </AnimatePresence>
          </BookingErrorBoundary>
        </div>
      </main>
    </>
  );
}

interface BookingWizardProps {
  agencyId: string;
  agencySlug: string;
  agency: AgencyContact;
  /** The agency's white label; empty = YardCard Elite colors */
  branding?: AgencyBranding;
  pricing: BookingPricing;
  policies: AgencyPolicies;
  bookingRules: BookingRules;
  agencyTimeZone?: string;
  /** Server calls; defaults to the real actions (the design lab passes demo ones) */
  actions?: BookingActions;
  initialStep?: number;
}

export function BookingWizard({ agencyId, agencySlug, agency, branding = {}, pricing, policies, bookingRules, agencyTimeZone, actions, initialStep = 1 }: BookingWizardProps) {
  return (
    <BookingFrame agencyName={agency.name} branding={branding}>
      <WizardProvider agencyId={agencyId} agencySlug={agencySlug} agency={agency} pricing={pricing} policies={policies} bookingRules={bookingRules} agencyTimeZone={agencyTimeZone} totalSteps={wizardSteps.length} actions={actions} initialStep={initialStep}>
        <BookingWizardContent agencyId={agencyId} />
      </WizardProvider>
    </BookingFrame>
  );
}
