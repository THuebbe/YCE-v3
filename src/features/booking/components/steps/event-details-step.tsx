'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useWizard } from '../../context/wizard-context';
import { createEventSchema, EventFormData, TimeWindow } from '../../types';
import { addDays, earliestEventDay, maxExtraDays, rentalWindow, todayIn, validateBookingDates } from '../../booking-rules';
import { calculateBookingTotal } from '../../pricing';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export function EventDetailsStep({ custom }: { custom?: string }) {
  const { formData, updateFormData, nextStep, prevStep, bookingRules, pricing, timeZone } = useWizard();
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

  return (
    <motion.div
      initial={
        typeof window !== 'undefined' && window.innerWidth < 768
          ? { x: custom === 'backward' ? -300 : 300 } // Mobile: slide from left/right
          : { opacity: 0, x: 20 } // Desktop: fade with slight slide
      }
      animate={
        typeof window !== 'undefined' && window.innerWidth < 768
          ? { x: 0 } // Mobile: slide to center
          : { opacity: 1, x: 0 } // Desktop: fade in
      }
      exit={
        typeof window !== 'undefined' && window.innerWidth < 768
          ? { x: custom === 'backward' ? 300 : -300 } // Mobile: slide out opposite direction
          : { opacity: 0, x: -20 } // Desktop: fade out
      }
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.4
      }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-h2 text-neutral-900 mb-4">Event Details</h1>
        <p className="text-body text-neutral-700">
          Tell us about your special event so we can create the perfect display.
        </p>
      </div>

      {/* Form Card Container */}
      <div className="bg-white border-2 border-neutral-200 rounded-lg p-6 shadow-default hover:shadow-medium transition-shadow duration-standard">
        <div className="space-y-6">
          {/* Event Date */}
          <div>
            <label htmlFor="eventDate" className="text-label text-neutral-700 mb-2 block">
              Event Date
            </label>
            <Input
              id="eventDate"
              type="date"
              value={formatDateForInput(localData.eventDate)}
              onChange={(e) => handleDateChange(e.target.value)}
              min={earliestEventDay(bookingRules, localData.extraDaysBefore, today)}
              className={errors.eventDate ? 'border-error' : ''}
            />
            {(errors.eventDate || dateIssue) && (
              <p className="text-body-small text-error-red mt-1">{errors.eventDate || dateIssue}</p>
            )}
            <p className="text-body-small text-neutral-500 mt-1">
              Earliest available: {new Date(`${earliestEventDay(bookingRules, localData.extraDaysBefore, today)}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>

          {/* Extra display days (paid) - chosen here so the configurator
              reserves signs for the right dates */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-body">Base Package (event day)</span>
              <span className="text-body font-medium">${pricing.basePrice.toFixed(2)}</span>
            </div>
            {([
              ['extraDaysBefore', 'Extra Days Before', 'extraDaysAfter'],
              ['extraDaysAfter', 'Extra Days After', 'extraDaysBefore'],
            ] as const).map(([field, label, other]) => {
              const max = maxExtraDays(bookingRules, localData[other]);
              return (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-body-small">{label}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      aria-label={`Fewer ${label.toLowerCase()}`}
                      onClick={() => handleInputChange(field, Math.max(0, localData[field] - 1))}
                      className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"
                      disabled={localData[field] <= 0}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{localData[field]}</span>
                    <button
                      type="button"
                      aria-label={`More ${label.toLowerCase()}`}
                      onClick={() => handleInputChange(field, Math.min(max, localData[field] + 1))}
                      className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"
                      disabled={localData[field] >= max}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
            {(localData.extraDaysBefore + localData.extraDaysAfter) > 0 && (
              <div className="flex justify-between text-body-small">
                <span>Extra Days ({localData.extraDaysBefore + localData.extraDaysAfter} × ${pricing.extraDayPrice.toFixed(2)})</span>
                <span>${((localData.extraDaysBefore + localData.extraDaysAfter) * pricing.extraDayPrice).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between text-h5 font-semibold">
              <span>Total</span>
              <span className="text-primary">${calculateBookingTotal(pricing, localData.extraDaysBefore, localData.extraDaysAfter).toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-4">
            <h3 className="text-h5 text-neutral-900">Delivery Address</h3>
          
          {/* Street Address */}
          <div>
            <label htmlFor="street" className="text-label text-neutral-700 mb-2 block">
              Street Address
            </label>
            <Input
              id="street"
              type="text"
              value={localData.deliveryAddress.street}
              onChange={(e) => handleInputChange('deliveryAddress.street', e.target.value)}
              placeholder="123 Main Street"
              className={errors['deliveryAddress.street'] ? 'border-error' : ''}
              autoComplete="street-address"
            />
            {errors['deliveryAddress.street'] && (
              <p className="text-body-small text-error-red mt-1">{errors['deliveryAddress.street']}</p>
            )}
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="text-label text-neutral-700 mb-2 block">
                City
              </label>
              <Input
                id="city"
                type="text"
                value={localData.deliveryAddress.city}
                onChange={(e) => handleInputChange('deliveryAddress.city', e.target.value)}
                placeholder="City"
                className={errors['deliveryAddress.city'] ? 'border-error' : ''}
                autoComplete="address-level2"
              />
              {errors['deliveryAddress.city'] && (
                <p className="text-body-small text-error-red mt-1">{errors['deliveryAddress.city']}</p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="text-label text-neutral-700 mb-2 block">
                State
              </label>
              <Input
                id="state"
                type="text"
                value={localData.deliveryAddress.state}
                onChange={(e) => handleInputChange('deliveryAddress.state', e.target.value.toUpperCase())}
                placeholder="CA"
                maxLength={2}
                className={errors['deliveryAddress.state'] ? 'border-error' : ''}
                autoComplete="address-level1"
              />
              {errors['deliveryAddress.state'] && (
                <p className="text-body-small text-error-red mt-1">{errors['deliveryAddress.state']}</p>
              )}
            </div>

            <div>
              <label htmlFor="zipCode" className="text-label text-neutral-700 mb-2 block">
                ZIP Code
              </label>
              <Input
                id="zipCode"
                type="text"
                value={localData.deliveryAddress.zipCode}
                onChange={(e) => handleInputChange('deliveryAddress.zipCode', e.target.value)}
                placeholder="12345"
                className={errors['deliveryAddress.zipCode'] ? 'border-error' : ''}
                autoComplete="postal-code"
              />
              {errors['deliveryAddress.zipCode'] && (
                <p className="text-body-small text-error-red mt-1">{errors['deliveryAddress.zipCode']}</p>
              )}
            </div>
          </div>
        </div>

        {/* Time Window */}
        <div>
          <label className="text-label text-neutral-700 mb-3 block">
            Preferred Installation Time
          </label>
          <div className="space-y-3">
            {[
              { value: 'morning', label: 'Morning (8AM - 12PM)', description: 'Early setup' },
              { value: 'afternoon', label: 'Afternoon (12PM - 4PM)', description: 'Midday setup' },
              { value: 'evening', label: 'Evening (4PM - 8PM)', description: 'Late setup' },
            ].map((option) => (
              <label
                key={option.value}
                className={`
                  flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors
                  ${
                    localData.timeWindow === option.value
                      ? 'border-primary bg-secondary-pale'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }
                `}
              >
                <input
                  type="radio"
                  name="timeWindow"
                  value={option.value}
                  checked={localData.timeWindow === option.value}
                  onChange={(e) => handleInputChange('timeWindow', e.target.value as TimeWindow)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="text-body font-medium text-neutral-900">
                    {option.label}
                  </div>
                  <div className="text-body-small text-neutral-600">
                    {option.description}
                  </div>
                </div>
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${
                      localData.timeWindow === option.value
                        ? 'border-primary'
                        : 'border-neutral-300'
                    }
                  `}
                >
                  {localData.timeWindow === option.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

          {/* Delivery Notes */}
          <div>
            <label htmlFor="deliveryNotes" className="text-label text-neutral-700 mb-2 block">
              Delivery Notes (Optional)
            </label>
            <textarea
              id="deliveryNotes"
              value={localData.deliveryNotes || ''}
              onChange={(e) => handleInputChange('deliveryNotes', e.target.value)}
              placeholder="Any special instructions for setup, parking, or yard access..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex gap-4 justify-between">
        <Button
          onClick={prevStep}
          variant="secondary"
          className="w-full md:w-auto px-8 shadow-button hover:shadow-medium active:scale-98 transition-all duration-standard"
        >
          Back
        </Button>
        <Button
          onClick={validateAndContinue}
          disabled={!isValid}
          className="w-full md:w-auto px-8 shadow-button hover:shadow-medium active:scale-98 transition-all duration-standard"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}