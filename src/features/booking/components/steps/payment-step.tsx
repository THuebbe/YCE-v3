'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWizard } from '../../context/wizard-context';
import { calculateBookingTotal } from '../../pricing';
import { createPaymentSchema, PaymentFormData } from '../../types';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CreditCard, Smartphone, DollarSign, Lock } from 'lucide-react';
import { ChoiceCard, StepIntro, StepMotion, StepNav, StepSection, money } from '../step-kit';

// Payment method components
import { CreditCardForm } from '../payment-methods/CreditCardForm';
import { StripeCardForm, type CollectedCard } from '../payment-methods/StripeCardForm';
import { PayPalForm } from '../payment-methods/PayPalForm';
import { ApplePayForm } from '../payment-methods/ApplePayForm';
import { VenmoPaymentForm } from '@/components/payments/VenmoPaymentForm';

// Raw card data must never enter wizard state: everything in formData is
// POSTed to /api/orders/create. Real card capture belongs in Stripe Elements.
function withoutCardData(fields: Record<string, any>) {
  const { cardNumber, expiryDate, cvv, ...rest } = fields;
  return rest;
}

export function PaymentStep({ custom }: { custom?: string }) {
  const { 
    formData, 
    updateFormData, 
    nextStep, 
    prevStep, 
    paymentMethods,
    loadPaymentMethods,
    agencyId,
    agency,
    pricing
  } = useWizard();
  
  const [localData, setLocalData] = useState<PaymentFormData>(
    formData.payment || {
      paymentMethod: 'card',
      billingAddress: {
        zipCode: '',
      },
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPaymentFields, setSelectedPaymentFields] = useState<Record<string, any>>({});

  // Apply the agency's default method once, when the methods first load and
  // the customer hasn't picked one (re-applying it on every render snapped a
  // Venmo/PayPal choice straight back to the default).
  const defaultApplied = useRef(Boolean(formData.payment?.paymentMethod));
  useEffect(() => {
    if (defaultApplied.current || paymentMethods.isLoading) return;
    const available = paymentMethods.availablePaymentMethods;
    if (!available.length) return;
    defaultApplied.current = true;
    const preferred = available.find(m => m.id === paymentMethods.defaultPaymentMethod) ?? available[0];
    setLocalData(prev => ({ ...prev, paymentMethod: preferred.id as any }));
  }, [paymentMethods.isLoading, paymentMethods.availablePaymentMethods, paymentMethods.defaultPaymentMethod]);

  const handlePaymentMethodChange = (methodId: string) => {
    setLocalData(prev => ({ 
      ...prev, 
      paymentMethod: methodId as any 
    }));
    
    // Clear method-specific errors and fields
    setErrors({});
    setSelectedPaymentFields({});
  };

  const handlePaymentFieldChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      
      if (parent === 'billingAddress') {
        setLocalData(prev => ({
          ...prev,
          billingAddress: {
            zipCode: child === 'zipCode' ? value : (prev.billingAddress?.zipCode || ''),
          },
        }));
      } else {
        setSelectedPaymentFields(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent] || {}),
            [child]: value,
          },
        }));
      }
    } else {
      setSelectedPaymentFields(prev => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('✅ Payment successful:', paymentData);
    
    // Store payment result in form data
    const updatedData = {
      ...localData,
      paymentMethodId: paymentData.paymentId,
      ...withoutCardData(selectedPaymentFields),
    };
    
    updateFormData({ payment: updatedData });
    nextStep();
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Payment failed:', error);
    setErrors({ payment: error });
  };

  // Agencies on Stripe: the card is entered in Stripe's own form (it never
  // touches our pages) and turned into a one-time token on Continue
  const collectCard = useRef<(() => Promise<CollectedCard>) | null>(null);
  const onCardFormReady = useCallback((collect: () => Promise<CollectedCard>) => {
    collectCard.current = collect;
  }, []);
  const [collectingCard, setCollectingCard] = useState(false);

  const validateAndContinue = async () => {
    // Create dynamic schema based on available payment methods
    const availableMethodIds = paymentMethods.availablePaymentMethods.map(m => m.id);
    const schema = createPaymentSchema(availableMethodIds);
    
    // Stripe's form collects the billing ZIP itself
    const usesStripeCard = localData.paymentMethod === 'card' && !!stripeAccountId;
    const result = schema.safeParse(usesStripeCard ? { ...localData, billingAddress: undefined } : localData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const field = error.path.join('.');
        fieldErrors[field] = error.message;
      });
      // Also in the general alert, so an error on a field this form doesn't
      // show never leaves the button looking dead
      fieldErrors.payment = result.error.errors[0]?.message ?? 'Please check your payment details.';
      setErrors(fieldErrors);
      return;
    }

    if (usesStripeCard) {
      setCollectingCard(true);
      const card = await collectCard.current?.();
      setCollectingCard(false);
      if (!card?.ok) {
        setErrors({ payment: card?.error ?? 'The card form is still loading. Please try again.' });
        return;
      }
      updateFormData({
        payment: {
          paymentMethod: 'card',
          confirmationTokenId: card.confirmationTokenId,
          stripeAccountId,
          cardBrand: card.brand,
          cardLast4: card.last4,
        },
      });
      nextStep();
      return;
    }

    // Demo card form (agency not on Stripe yet): nothing is charged
    if (localData.paymentMethod === 'card') {
      if (!selectedPaymentFields.cardNumber) {
        setErrors(prev => ({ ...prev, cardNumber: 'Card number is required' }));
        return;
      }
      if (!selectedPaymentFields.expiryDate) {
        setErrors(prev => ({ ...prev, expiryDate: 'Expiry date is required' }));
        return;
      }
      if (!selectedPaymentFields.cvv) {
        setErrors(prev => ({ ...prev, cvv: 'CVV is required' }));
        return;
      }
    }

    // For methods that require redirect (PayPal, Apple Pay), 
    // the payment processing happens in their respective components
    if (['paypal', 'apple_pay', 'venmo'].includes(localData.paymentMethod)) {
      // These methods handle their own success/error flows
      return;
    }

    // For credit card, proceed to next step (payment processing will happen later)
    updateFormData({ 
      payment: { 
        ...localData, 
        ...withoutCardData(selectedPaymentFields)
      } 
    });
    nextStep();
  };

  const calculateTotal = () => {
    return calculateBookingTotal(pricing, formData.event?.extraDaysBefore || 0, formData.event?.extraDaysAfter || 0);
  };

  const selectedMethod = paymentMethods.availablePaymentMethods.find(
    m => m.id === localData.paymentMethod
  );
  const stripeAccountId = selectedMethod?.processor === 'stripe'
    ? ((selectedMethod.processorConfig as { accountId?: string } | undefined)?.accountId ?? null)
    : null;

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'CreditCard': return CreditCard;
      case 'Smartphone': return Smartphone;
      case 'DollarSign': return DollarSign;
      default: return CreditCard;
    }
  };

  const renderPaymentForm = () => {
    if (!selectedMethod) return null;
    
    const totalAmount = calculateTotal();

    switch (localData.paymentMethod) {
      case 'card':
        if (stripeAccountId) {
          return (
            <StripeCardForm
              accountId={stripeAccountId}
              amountCents={Math.round(totalAmount * 100)}
              billing={{
                name: formData.contact?.fullName,
                email: formData.contact?.email,
                phone: formData.contact?.phone,
              }}
              onReady={onCardFormReady}
            />
          );
        }
        return (
          <CreditCardForm
            paymentMethod={selectedMethod}
            onFieldChange={handlePaymentFieldChange}
            formData={localData}
            errors={errors}
          />
        );
      
      case 'paypal':
        return (
          <PayPalForm
            paymentMethod={selectedMethod}
            amount={totalAmount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        );
      
      case 'apple_pay':
        return (
          <ApplePayForm
            paymentMethod={selectedMethod}
            amount={totalAmount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        );
      
      case 'venmo':
        return (
          <VenmoPaymentForm
            amount={totalAmount}
            description="YardCard Elite yard display rental"
            onSuccess={(transactionId) => handlePaymentSuccess({ 
              paymentId: transactionId, 
              paymentMethod: 'venmo',
              amount: totalAmount,
              status: 'completed' 
            })}
            onError={handlePaymentError}
          />
        );
      
      default:
        return (
          <p className="py-8 text-center text-fg-muted">This payment option isn&apos;t available right now.</p>
        );
    }
  };

  const extraDays = (formData.event?.extraDaysBefore || 0) + (formData.event?.extraDaysAfter || 0);
  const message = formData.display?.eventMessage === 'Custom Message' ? formData.display?.customMessage : formData.display?.eventMessage;

  // Loading, error and nothing-available all keep the step's frame and Back
  const notice = (body: React.ReactNode) => (
    <StepMotion custom={custom}>
      <StepSection>{body}</StepSection>
      <StepNav onBack={prevStep} hideNext />
    </StepMotion>
  );

  if (paymentMethods.isLoading) {
    return notice(
      <p className="flex items-center gap-2 text-fg-muted" role="status">
        <RefreshCw className="size-5 animate-spin" aria-hidden />
        Loading payment options...
      </p>
    );
  }

  if (paymentMethods.error) {
    return notice(
      <div className="grid gap-4">
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertDescription>We couldn&apos;t load the payment options. Check your connection and try again.</AlertDescription>
        </Alert>
        <Button variant="secondary" className="justify-self-start" onClick={() => agencyId && loadPaymentMethods(agencyId)}>
          Try again
        </Button>
      </div>
    );
  }

  if (paymentMethods.availablePaymentMethods.length === 0) {
    return notice(
      <Alert>
        <AlertTriangle aria-hidden />
        <AlertDescription>
          {agency.name} isn&apos;t taking online payments right now. Please contact them to book.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <StepMotion custom={custom}>
      <StepIntro>Nothing is charged yet. You&apos;ll see everything on the next screen before you book.</StepIntro>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <StepSection title="How would you like to pay?">
          <div className="grid gap-2" role="radiogroup" aria-label="Payment method">
            {paymentMethods.availablePaymentMethods.map((method) => {
              const IconComponent = getIconComponent(method.icon);
              return (
                <ChoiceCard
                  key={method.id}
                  name="paymentMethod"
                  value={method.id}
                  checked={localData.paymentMethod === method.id}
                  onChange={handlePaymentMethodChange}
                  title={<span className="flex items-center gap-2"><IconComponent className="size-5 text-fg-muted" aria-hidden />{method.name}</span>}
                  detail={method.description}
                />
              );
            })}
          </div>
          {errors.paymentMethod && <p className="text-fine text-danger" role="alert">{errors.paymentMethod}</p>}

          {localData.paymentMethod && <div>{renderPaymentForm()}</div>}

          {errors.payment && (
            <Alert variant="destructive">
              <AlertTriangle aria-hidden />
              <AlertDescription>{errors.payment}</AlertDescription>
            </Alert>
          )}

          {stripeAccountId && localData.paymentMethod === 'card' && (
            <p className="flex items-start gap-2 text-fine text-fg-muted">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
              Your card goes straight to Stripe, our payment processor. Neither {agency.name} nor we see the full number.
            </p>
          )}
        </StepSection>

        <StepSection title="Your booking">
          <dl className="grid gap-2 text-fine">
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Event</dt>
              <dd className="text-right font-semibold">{formData.event?.eventDate ? new Date(formData.event.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Not set'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Display</dt>
              <dd className="min-w-0 text-right font-semibold">{[message, formData.display?.recipientName].filter(Boolean).join(', ') || 'Not set'}</dd>
            </div>
          </dl>
          <div className="grid gap-2 border-t border-line pt-3">
            <div className="flex justify-between gap-4">
              <span>Event day</span>
              <span className="tabular-nums">{money(pricing.basePrice)}</span>
            </div>
            {extraDays > 0 && (
              <div className="flex justify-between gap-4">
                <span>{extraDays} extra day{extraDays === 1 ? '' : 's'}</span>
                <span className="tabular-nums">{money(extraDays * pricing.extraDayPrice)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <span className="font-bold">Total</span>
              <span className="font-display text-heading font-semibold tabular-nums">{money(calculateTotal())}</span>
            </div>
          </div>
        </StepSection>
      </div>

      {/* PayPal, Apple Pay and Venmo finish inside their own buttons */}
      <StepNav
        onBack={prevStep}
        onNext={validateAndContinue}
        nextLabel={collectingCard ? 'Checking card...' : 'Review booking'}
        nextDisabled={!localData.paymentMethod || collectingCard}
        busy={collectingCard}
        hideNext={!(localData.paymentMethod === 'card' || !localData.paymentMethod)}
      />
    </StepMotion>
  );
}
