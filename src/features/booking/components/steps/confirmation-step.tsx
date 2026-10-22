'use client';

import React from 'react';
import { useWizard, clearSavedWizard } from '../../context/wizard-context';
import { calculateBookingTotal } from '../../pricing';
import { formatDay, rentalWindow } from '../../booking-rules';
import { Button } from '@/shared/components/ui/button';
import { Check, Printer } from 'lucide-react';
import { StepMotion, money } from '../step-kit';

export function ConfirmationStep({ custom }: { custom?: string }) {
  const { formData, pricing, bookingRules, agency, agencySlug } = useWizard();

  // Get order details from the form data
  const orderResult = formData.orderResult;
  const orderNumber = orderResult?.orderNumber || 'ORDER-NOT-FOUND';
  const confirmationCode = orderResult?.confirmationCode || 'N/A';

  const calculateTotal = () => {
    return calculateBookingTotal(pricing, formData.event?.extraDaysBefore || 0, formData.event?.extraDaysAfter || 0);
  };

  // Same delivery/pickup days the sign hold was taken for (setup and
  // teardown days included)
  const signsOut = formData.event?.eventDate
    ? rentalWindow(
        bookingRules,
        new Date(formData.event.eventDate),
        formData.event.extraDaysBefore || 0,
        formData.event.extraDaysAfter || 0
      )
    : null;
  const getDeliveryDate = () => (signsOut ? formatDay(signsOut.start, true) : 'Date not set');
  const getRemovalDate = () => (signsOut ? formatDay(signsOut.end, true) : 'Date not set');

  const display = formData.display;
  const message = display?.eventMessage === 'Custom Message' ? display?.customMessage : display?.eventMessage;
  const setupWindow = formData.event?.timeWindow?.replace('_', ' ');

  return (
    <StepMotion custom={custom}>
      <section className="grid justify-items-center gap-3 pt-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-positive text-on-strong" aria-hidden>
          <Check className="size-8" strokeWidth={3} />
        </span>
        <h1 className="font-display text-hero font-semibold">You&apos;re booked!</h1>
        <p className="max-w-prose text-lead text-fg-muted">
          {agency.name} has your booking{display?.recipientName ? ` for ${display.recipientName}` : ''}. A confirmation is on its way to {formData.contact?.email || 'your email'}.
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 rounded-card border border-line bg-surface px-6 py-4">
          <dt className="text-fine text-fg-muted">Order number</dt>
          <dt className="text-fine text-fg-muted">Confirmation code</dt>
          <dd className="font-display text-heading font-semibold tabular-nums">{orderNumber}</dd>
          <dd className="font-display text-heading font-semibold tabular-nums">{confirmationCode}</dd>
        </dl>
      </section>

      <section className="grid gap-4 rounded-card border border-line bg-surface p-4 sm:p-6">
        <h2 className="font-display text-heading font-semibold">What happens next</h2>
        <ol className="grid gap-4">
          {[
            ['Setup', <>Your display goes up on <strong>{getDeliveryDate()}</strong>{setupWindow ? <> in the <strong>{setupWindow}</strong></> : null}.</>],
            ['Pickup', <>It comes down on <strong>{getRemovalDate()}</strong>. You don&apos;t need to be home.</>],
            ['Questions', <>Keep your order number handy if you contact {agency.name}.</>],
          ].map(([title, body], i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-fine font-bold text-on-brand" aria-hidden>{i + 1}</span>
              <div>
                <p className="font-bold">{title}</p>
                <p className="text-fine">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 rounded-card border border-line bg-surface p-4 sm:p-6">
        <h2 className="font-display text-heading font-semibold">Your booking</h2>
        <dl className="grid gap-x-6 gap-y-2 text-fine sm:grid-cols-[8rem_1fr]">
          {([
            ['Display', [message, display?.recipientName].filter(Boolean).join(', ')],
            ['Address', formData.event ? `${formData.event.deliveryAddress.street}, ${formData.event.deliveryAddress.city}, ${formData.event.deliveryAddress.state} ${formData.event.deliveryAddress.zipCode}` : ''],
            ['Phone', formData.contact?.phone ?? ''],
            ['Paid', money(calculateTotal())],
          ] as const).filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-fg-muted">{label}</dt>
              <dd className="mb-1 font-semibold sm:mb-0">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden />
          Print this page
        </Button>
        <Button
          onClick={() => {
            // The next visit starts a new booking, not this finished one
            clearSavedWizard(agencySlug);
            window.location.href = agency.website || `/${agencySlug}/booking`;
          }}
        >
          {agency.website ? `Back to ${agency.name}` : 'Book another display'}
        </Button>
      </div>

      {(agency.email || agency.phone) && (
        <p className="text-center text-fine text-fg-muted">
          Need a change? Contact {agency.name}
          {agency.email && <> at <a href={`mailto:${agency.email}`} className="font-bold text-action-text underline underline-offset-4">{agency.email}</a></>}
          {agency.email && agency.phone && ' or'}
          {agency.phone && <> <a href={`tel:${agency.phone.replace(/[^\d+]/g, '')}`} className="font-bold text-action-text underline underline-offset-4">{agency.phone}</a></>}
          .
        </p>
      )}
    </StepMotion>
  );
}
