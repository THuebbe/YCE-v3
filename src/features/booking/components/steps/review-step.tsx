'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWizard } from '../../context/wizard-context';
import { calculateBookingTotal } from '../../pricing';
import { formatDay, rentalWindow } from '../../booking-rules';
import { Button } from '@/shared/components/ui/button';
import { Edit, AlertCircle } from 'lucide-react';
import { BookingYardPreview } from '../display/BookingYardPreview';
import { StepIntro, StepMotion, StepNav, money } from '../step-kit';
import { STEP } from '../../step-order';
import { LayoutCalculatorService } from '../../services/layout-calculator';
import { LayoutCalculation, BookingOrderResult } from '../../types';
import { stripeForAccount } from '../payment-methods/StripeCardForm';
import { buildBookingTerms } from '../../terms';
import { policyKey } from '../../policies';
import { COLORS } from '@/lib/brand';

export function ReviewStep({ custom }: { custom?: string }) {
  const { formData, nextStep, prevStep, goToStep, updateFormData, agencyId, agencySlug, agency, pricing, policies, bookingRules, sessionId, timeZone, actions } = useWizard();
  // The agency's booking terms: the customer must agree before Place Order
  // (consent for later late/damage charges); the server saves its own copy
  const terms = buildBookingTerms({
    agencyName: agency.name,
    policies,
    paysByCard: formData.payment?.paymentMethod === 'card' && Boolean(formData.payment?.stripeAccountId),
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const pickupDay = formData.event?.eventDate
    ? rentalWindow(bookingRules, new Date(formData.event.eventDate), formData.event.extraDaysBefore || 0, formData.event.extraDaysAfter || 0).end
    : null;
  const [layoutCalculation, setLayoutCalculation] = useState<LayoutCalculation | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Check if we have a valid hold ID and should show preview
  const hasValidLayout = formData.display?.holdId && formData.display?.eventMessage && formData.display?.recipientName;
  
  const generateLayoutPreview = async () => {
    // Only generate if we don't have a hold ID (shouldn't happen in normal flow)
    if (!hasValidLayout) {
      console.log('⚠️ Review Step: No valid layout data from Step 3');
      return;  
    }

    if (!formData.display?.eventMessage || !formData.display?.recipientName) {
      return;
    }

    // The exact layout the signs were reserved for (random extras included)
    if (formData.display.layout) {
      setLayoutCalculation(formData.display.layout as LayoutCalculation);
      return;
    }

    setPreviewLoading(true);
    
    try {
      const layoutCalculatorService = new LayoutCalculatorService();
      
      const message = formData.display.eventMessage === 'Custom Message' 
        ? (formData.display.customMessage || '') 
        : formData.display.eventMessage;
      
      if (!message.trim()) {
        setPreviewLoading(false);
        return;
      }
      
      const layoutResult = await layoutCalculatorService.calculateLayout({
        message: message,
        recipientName: formData.display.recipientName,
        eventNumber: formData.display.eventNumber,
        theme: formData.display.characterTheme,
        hobbies: formData.display.hobbies,
        agencyId,
        style: formData.display.messageStyle,
        messageColorway: formData.display.messageColorway,
        nameStyle: formData.display.nameStyle,
        nameColorway: formData.display.nameColorway
      });
      
      if (layoutResult.meetsMinimumFill) {
        setLayoutCalculation(layoutResult);
      } else {
        setLayoutCalculation(layoutResult); // Still show for debugging
      }
    } catch (error) {
      console.error('Error generating layout preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Only generate layout if we have valid data from Step 3
  useEffect(() => {
    if (hasValidLayout) {
      generateLayoutPreview();
    }
  }, [hasValidLayout]);

  const calculateTotal = () => {
    return calculateBookingTotal(pricing, formData.event?.extraDaysBefore || 0, formData.event?.extraDaysAfter || 0);
  };

  // The preview as the customer sees it, saved with the order for their
  // confirmation email and the agency's Order Summary. Never blocks the order.
  const previewRef = useRef<HTMLDivElement>(null);
  const captureDisplay = async (holdId: string): Promise<string | undefined> => {
    const node = previewRef.current;
    if (!node || node.offsetWidth === 0) return undefined;
    // Freeze the drop-in animation, or the copy can catch signs mid-fall
    node.dataset.capturing = '';
    try {
      const { toJpeg } = await import('html-to-image');
      const capture = toJpeg(node, { quality: 0.85, pixelRatio: Math.min(3, Math.max(1, 1200 / node.offsetWidth)), backgroundColor: COLORS.surface });
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('capture timed out')), 8000));
      const dataUrl = await Promise.race([capture, timeout]);
      const saved = await actions.saveDisplaySnapshot({ agencySlug, sessionId, holdId, dataUrl });
      if (!saved.ok) console.warn('Display picture not saved:', saved.error);
      return saved.ok ? saved.url : undefined;
    } catch (error) {
      console.warn('Display picture failed (order continues):', error);
      return undefined;
    } finally {
      delete node.dataset.capturing;
    }
  };

  const handlePlaceOrder = async () => {
    if (!formData.contact || !formData.event || !formData.display || !formData.payment) {
      setOrderError('Some details are missing. Please go back through the steps.');
      return;
    }

    if (!formData.display.holdId) {
      setOrderError('Your signs aren\'t reserved yet. Go back to your display and reserve them.');
      return;
    }

    setOrderProcessing(true);
    setOrderError(null);

    try {
      const payment = formData.payment;
      const displayImageUrl = await captureDisplay(formData.display.holdId);
      const base = {
        formData: {
          contact: formData.contact,
          event: formData.event,
          display: formData.display,
          payment,
        },
        holdId: formData.display.holdId,
        sessionId, // the hold belongs to this wizard session
        timeZone, // decides "end of day" for the order cutoff
        agencySlug, // order API resolves the slug to agency_id
        totalAmount: calculateTotal(),
        termsAccepted,
        termsVersion: terms.version,
        termsLateFee: policies.lateFee,
        termsPolicy: policyKey(policies),
        displayImageUrl,
      };
      const send = async (extra: { paymentIntentId: string; confirmationTokenId?: string }) => {
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...base, ...extra }),
        });
        return (await response.json()) as BookingOrderResult;
      };

      // The server charges the card token from the Payment step. Without
      // one (no Stripe card) the server refuses: there's no unpaid booking.
      const stripeCard = Boolean(payment.confirmationTokenId && payment.stripeAccountId);
      let result = stripeCard
        ? await send({ paymentIntentId: 'pending', confirmationTokenId: payment.confirmationTokenId })
        : await send({ paymentIntentId: 'pi_mock_' + Date.now() });

      // The card's bank asks the customer to approve (3-D Secure)
      if (result.requiresAction && result.clientSecret && result.paymentIntentId && payment.stripeAccountId) {
        const stripe = await stripeForAccount(payment.stripeAccountId);
        const action = stripe ? await stripe.handleNextAction({ clientSecret: result.clientSecret }) : null;
        if (!action || action.error) {
          updateFormData({ payment: { ...payment, confirmationTokenId: undefined } });
          setOrderError(`${action?.error?.message ?? 'Your card could not be verified.'} Please go back to Payment and try again.`);
          return;
        }
        result = await send({ paymentIntentId: result.paymentIntentId });
      }

      if (!result.success) {
        // A card token works once: after any failed charge, enter the card again
        if (stripeCard) updateFormData({ payment: { ...payment, confirmationTokenId: undefined } });
        setOrderError(result.error || 'Failed to create order');
        return;
      }

      // Store order result for confirmation step
      updateFormData({
        orderResult: {
          orderId: result.orderId || '',
          orderNumber: result.orderNumber || '',
          confirmationCode: result.confirmationCode || ''
        }
      });

      // Move to confirmation step
      nextStep();

    } catch (error) {
      console.error('Unexpected error during order creation:', error);
      setOrderError('Your booking didn\'t go through. Nothing was charged. Please try again.');
    } finally {
      setOrderProcessing(false);
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    const methods = {
      card: 'Card',
      apple_pay: 'Apple Pay',
      paypal: 'PayPal',
      venmo: 'Venmo'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const event = formData.event;
  const display = formData.display;
  const typedMessage = (display?.eventMessage === 'Custom Message' ? display?.customMessage : display?.eventMessage) || '';
  const total = calculateTotal();

  return (
    <StepMotion custom={custom}>
      <StepIntro>Check the details, then book. Tap Edit on anything that needs a change.</StepIntro>

      <ReviewCard title="Your display" onEdit={() => goToStep(STEP.display)}>
        {!hasValidLayout ? (
          <div className="grid gap-3 rounded-card border border-caution/30 bg-caution-soft p-4 text-caution">
            <p className="flex items-center gap-2 font-bold"><AlertCircle className="size-5" aria-hidden />Your signs aren&apos;t reserved yet.</p>
            <Button variant="secondary" className="justify-self-start" onClick={() => goToStep(STEP.display)}>Back to your display</Button>
          </div>
        ) : previewLoading || !layoutCalculation ? (
          <div className="aspect-[19/10] animate-pulse rounded-sheet bg-surface-sunken" role="status" aria-label="Loading your display" />
        ) : (
          <div ref={previewRef} className="overflow-hidden rounded-sheet">
            <BookingYardPreview
              layout={layoutCalculation}
              typed={{ message: typedMessage, name: display?.recipientName || '' }}
              className="block w-full"
            />
          </div>
        )}
        <Details rows={[
          ['Message', typedMessage],
          ['Name', display?.recipientName],
          ['Number', display?.eventNumber ? String(display.eventNumber) : undefined],
          ['Colors', [...new Set([display?.messageColorway, display?.nameColorway].filter(Boolean))].join(' and ')],
          ['Theme', display?.characterTheme || undefined],
          ['Hobbies', display?.hobbies?.length ? display.hobbies.join(', ') : undefined],
        ]} />
      </ReviewCard>

      <ReviewCard title="When and where" onEdit={() => goToStep(STEP.event)}>
        <Details rows={[
          ['Event', event?.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'],
          ['Setup', event?.timeWindow ? event.timeWindow.charAt(0).toUpperCase() + event.timeWindow.slice(1).replace('_', ' ') : undefined],
          ['Pickup', pickupDay ? formatDay(pickupDay, true) : undefined],
          ['Address', event ? `${event.deliveryAddress.street}, ${event.deliveryAddress.city}, ${event.deliveryAddress.state} ${event.deliveryAddress.zipCode}` : undefined],
          ['Notes', event?.deliveryNotes || undefined],
        ]} />
      </ReviewCard>

      <ReviewCard title="Your details" onEdit={() => goToStep(STEP.contact)}>
        <Details rows={[
          ['Name', formData.contact?.fullName],
          ['Email', formData.contact?.email],
          ['Phone', formData.contact?.phone],
        ]} />
      </ReviewCard>

      <ReviewCard title="Payment" onEdit={() => goToStep(STEP.payment)}>
        <Details rows={[
          ['Method', `${getPaymentMethodDisplay(formData.payment?.paymentMethod || '')}${formData.payment?.cardLast4 ? ` (${formData.payment.cardBrand ?? 'card'} ending ${formData.payment.cardLast4})` : ''}`],
        ]} />
        <div className="grid gap-2 border-t border-line pt-3">
          <div className="flex justify-between gap-4"><span>Event day</span><span className="tabular-nums">{money(pricing.basePrice)}</span></div>
          {(event?.extraDaysBefore ?? 0) > 0 && (
            <div className="flex justify-between gap-4"><span>{event!.extraDaysBefore} extra day{event!.extraDaysBefore === 1 ? '' : 's'} before</span><span className="tabular-nums">{money(event!.extraDaysBefore * pricing.extraDayPrice)}</span></div>
          )}
          {(event?.extraDaysAfter ?? 0) > 0 && (
            <div className="flex justify-between gap-4"><span>{event!.extraDaysAfter} extra day{event!.extraDaysAfter === 1 ? '' : 's'} after</span><span className="tabular-nums">{money(event!.extraDaysAfter * pricing.extraDayPrice)}</span></div>
          )}
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <span className="font-bold">Total</span>
            <span className="font-display text-title font-semibold tabular-nums">{money(total)}</span>
          </div>
        </div>
      </ReviewCard>

      {/* Booking terms + agreement */}
      <section className="grid gap-3 rounded-card border border-line bg-surface-sunken p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-heading font-semibold">Booking terms</h2>
          <button
            type="button"
            onClick={() => setShowFullTerms(open => !open)}
            className="text-fine font-bold text-action-text underline underline-offset-4"
            aria-expanded={showFullTerms}
          >
            {showFullTerms ? 'Hide full terms' : 'Read full terms'}
          </button>
        </div>
        {showFullTerms ? (
          <dl className="grid gap-2 text-fine">
            {terms.sections.map(section => (
              <div key={section.title}>
                <dt className="font-bold">{section.title}</dt>
                <dd>{section.text}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-fine">
            Full payment now. Cancellation fees apply, and late pickup or damaged signs may be charged later.
          </p>
        )}
        <label className="flex cursor-pointer items-start gap-3 rounded-control bg-surface p-3 has-[:focus-visible]:shadow-(--focus-ring)">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={e => setTermsAccepted(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-action focus-visible:outline-none"
          />
          <span className="text-fine">
            {terms.agreement} I understand that my display will be installed during the selected time window and removed {pickupDay ? `on ${formatDay(pickupDay, true)}` : 'after my event'}.
          </span>
        </label>
        <p className="text-fine text-fg-muted">
          Bookings are made through YardCard Elite:{' '}
          <a href="/terms" target="_blank" rel="noopener" className="font-bold text-action-text underline underline-offset-4">Terms of Service</a>{' '}
          and{' '}
          <a href="/privacy" target="_blank" rel="noopener" className="font-bold text-action-text underline underline-offset-4">Privacy Policy</a>.
        </p>
      </section>

      {orderError && (
        <div className="flex items-start gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 text-danger" role="alert">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-fine font-bold">{orderError}</p>
        </div>
      )}

      <StepNav
        onBack={prevStep}
        onNext={handlePlaceOrder}
        nextDisabled={orderProcessing || !hasValidLayout || !termsAccepted}
        busy={orderProcessing}
        nextLabel={orderProcessing ? 'Booking...' : `Book now · ${money(total)}`}
      />
    </StepMotion>
  );
}

function ReviewCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 rounded-card border border-line bg-surface p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-heading font-semibold">{title}</h2>
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${title.toLowerCase()}`}>
          <Edit className="size-4" aria-hidden />
          Edit
        </Button>
      </div>
      {children}
    </section>
  );
}

function Details({ rows }: { rows: [string, string | undefined][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-fine sm:grid-cols-[8rem_1fr]">
      {rows.filter(([, v]) => v).map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-fg-muted">{label}</dt>
          <dd className="mb-1 min-w-0 font-semibold sm:mb-0">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
