'use client';

import React, { useMemo, useState } from 'react';
import { useWizard } from '../../context/wizard-context';
import { createEventSchema, EventFormData, TimeWindow } from '../../types';
import { addDays, earliestEventDay, formatDay, maxExtraDays, rentalWindow, todayIn, validateBookingDates } from '../../booking-rules';
import { calculateBookingTotal } from '../../pricing';
import { Input } from '@/shared/components/ui/input';
import { ChoiceCard, Field, StepIntro, StepMotion, StepNav, StepSection, Stepper, TextArea, money } from '../step-kit';

export function EventDetailsStep({ custom }: { custom?: string }) {
  const { formData, updateFormData, nextStep, bookingRules, pricing, timeZone } = useWizard();
  // "Today" where the order cutoff is decided (agency zone, else browser)
  const today = useMemo(() => todayIn(timeZone), [timeZone]);
  const eventSchema = useMemo(() => createEventSchema(bookingRules, today), [bookingRules, today]);
  const [localData, setLocalData] = useState<EventFormData>(
    formData.event || {
      // A day past the earliest bookable date, so the default doesn't go
      // invalid if the customer is still here when the day rolls over
      eventDate: new Date(`${addDays(earliestEventDay(bookingRules, 0, today), 1)}T12:00:00`),
      extraDaysBefore: 0,
      // Start at the agency's minimum rental length (the event day counts as one)
      extraDaysAfter: Math.max(0, bookingRules.minimumRentalDays - 1),
      deliveryAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      timeWindow: 'morning' as TimeWindow,
      deliveryNotes: '',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setLocalData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setLocalData(prev => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateAndContinue = () => {
    const result = eventSchema.safeParse(localData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const field = error.path.join('.');
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Signs already reserved for other dates: drop that hold so the
    // configurator re-reserves for the new ones
    const held = formData.display;
    const signsOut = rentalWindow(bookingRules, localData.eventDate, localData.extraDaysBefore, localData.extraDaysAfter);
    if (held?.holdId && (held.holdRentalStart !== signsOut.start || held.holdRentalEnd !== signsOut.end)) {
      updateFormData({
        event: localData,
        display: { ...held, holdId: '', staleHoldId: held.holdId, holdRentalStart: undefined, holdRentalEnd: undefined },
      });
    } else {
      updateFormData({ event: localData });
    }
    nextStep();
  };

  const isValid = eventSchema.safeParse(localData).success;
  // Shown live: Continue stays disabled while this is set
  const dateIssue = validateBookingDates(
    bookingRules, localData.eventDate, localData.extraDaysBefore, localData.extraDaysAfter, today
  );

  // Format date for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Handle date change
  const handleDateChange = (dateString: string) => {
    // Typing digits directly into <input type="date"> fires onChange with
    // incomplete/empty values while mid-entry (e.g. "" or a partial year).
    // Constructing a Date from those yields an Invalid Date that later
    // crashes formatDateForInput()'s toISOString() call during render, so
    // only commit a value that actually parses.
    if (!dateString) return;
    const date = new Date(dateString + 'T12:00:00'); // Set to noon to avoid timezone issues
    if (isNaN(date.getTime())) return;
    handleInputChange('eventDate', date);
  };

  const extraDays = localData.extraDaysBefore + localData.extraDaysAfter;
  const fieldError = (field: string) => errors[field] || undefined;

  return (
    <StepMotion custom={custom}>
      <StepIntro>Pick the day you&apos;re celebrating and where the display goes.</StepIntro>

      <StepSection title="The big day">
        <Field
          id="eventDate"
          label="Event date"
          error={errors.eventDate || dateIssue}
          hint={`Earliest available: ${formatDay(earliestEventDay(bookingRules, localData.extraDaysBefore, today))}`}
        >
          <Input
            id="eventDate"
            type="date"
            value={formatDateForInput(localData.eventDate)}
            onChange={(e) => handleDateChange(e.target.value)}
            min={earliestEventDay(bookingRules, localData.extraDaysBefore, today)}
            className={errors.eventDate ? 'border-danger' : ''}
          />
        </Field>

        {/* Extra display days (paid): chosen here so the display step
            reserves signs for the right dates */}
        <div className="grid gap-3 border-t border-line pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <span>Display up for the event day</span>
            <span className="font-bold tabular-nums">{money(pricing.basePrice)}</span>
          </div>
          {([
            ['extraDaysBefore', 'Extra days before', 'days before', 'extraDaysAfter'],
            ['extraDaysAfter', 'Extra days after', 'days after', 'extraDaysBefore'],
          ] as const).map(([field, label, unit, other]) => (
            <div key={field} className="flex items-center justify-between gap-4">
              <span className="grid">
                <span>{label}</span>
                <span className="text-fine text-fg-muted tabular-nums">{money(pricing.extraDayPrice)} each</span>
              </span>
              <Stepper
                label={unit}
                value={localData[field]}
                max={maxExtraDays(bookingRules, localData[other])}
                onChange={(v) => handleInputChange(field, v)}
              />
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <span className="font-bold">Total{extraDays > 0 && <span className="font-normal text-fg-muted"> · includes {extraDays} extra day{extraDays === 1 ? '' : 's'}</span>}</span>
            <span className="font-display text-heading font-semibold tabular-nums">
              {money(calculateBookingTotal(pricing, localData.extraDaysBefore, localData.extraDaysAfter))}
            </span>
          </div>
        </div>
      </StepSection>

      <StepSection title="Where it goes">
        <Field id="street" label="Street address" error={fieldError('deliveryAddress.street')}>
          <Input
            id="street"
            type="text"
            value={localData.deliveryAddress.street}
            onChange={(e) => handleInputChange('deliveryAddress.street', e.target.value)}
            placeholder="123 Main Street"
            className={errors['deliveryAddress.street'] ? 'border-danger' : ''}
            autoComplete="street-address"
          />
        </Field>
        <div className="grid grid-cols-6 gap-3">
          <div className="col-span-6 sm:col-span-3">
            <Field id="city" label="City" error={fieldError('deliveryAddress.city')}>
              <Input
                id="city"
                type="text"
                value={localData.deliveryAddress.city}
                onChange={(e) => handleInputChange('deliveryAddress.city', e.target.value)}
                className={errors['deliveryAddress.city'] ? 'border-danger' : ''}
                autoComplete="address-level2"
              />
            </Field>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Field id="state" label="State" error={fieldError('deliveryAddress.state')}>
              <Input
                id="state"
                type="text"
                value={localData.deliveryAddress.state}
                onChange={(e) => handleInputChange('deliveryAddress.state', e.target.value.toUpperCase())}
                placeholder="IA"
                maxLength={2}
                className={errors['deliveryAddress.state'] ? 'border-danger' : ''}
                autoComplete="address-level1"
              />
            </Field>
          </div>
          <div className="col-span-4 sm:col-span-2">
            <Field id="zipCode" label="ZIP code" error={fieldError('deliveryAddress.zipCode')}>
              <Input
                id="zipCode"
                type="text"
                inputMode="numeric"
                value={localData.deliveryAddress.zipCode}
                onChange={(e) => handleInputChange('deliveryAddress.zipCode', e.target.value)}
                className={errors['deliveryAddress.zipCode'] ? 'border-danger' : ''}
                autoComplete="postal-code"
              />
            </Field>
          </div>
        </div>
      </StepSection>

      <StepSection title="Setup time" hint="When you'd like the display to go up.">
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Setup time">
          {[
            { value: 'morning', label: 'Morning', detail: '8 AM to noon' },
            { value: 'afternoon', label: 'Afternoon', detail: 'Noon to 4 PM' },
            { value: 'evening', label: 'Evening', detail: '4 PM to 8 PM' },
          ].map((option) => (
            <ChoiceCard
              key={option.value}
              name="timeWindow"
              value={option.value}
              checked={localData.timeWindow === option.value}
              onChange={(v) => handleInputChange('timeWindow', v as TimeWindow)}
              title={option.label}
              detail={option.detail}
            />
          ))}
        </div>
        <Field id="deliveryNotes" label="Notes for the setup crew (optional)">
          <TextArea
            id="deliveryNotes"
            value={localData.deliveryNotes || ''}
            onChange={(e) => handleInputChange('deliveryNotes', e.target.value)}
            placeholder="Gate code, where to park, which side of the yard..."
            rows={3}
          />
        </Field>
      </StepSection>

      <StepNav onNext={validateAndContinue} nextDisabled={!isValid} />
    </StepMotion>
  );
}
