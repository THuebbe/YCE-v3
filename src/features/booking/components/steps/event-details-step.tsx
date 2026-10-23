'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useWizard } from '../../context/wizard-context';
import { createEventSchema, type DisplayFormData, type EventFormData, type TimeWindow } from '../../types';
import { earliestEventDay, formatDay, maxExtraDays, rentalWindow, toDayKey, todayIn } from '../../booking-rules';
import { calculateBookingTotal } from '../../pricing';
import { eventMessages } from '../../display-options';
import { SIGN_CHARACTERS, unsupportedCharacters } from '../../availability';
import { dateOf, dayStatus, nearbyOpenDays, type DayCheck } from '../../day-status';
import { messageElements, nameElements } from '../../services/line-elements';
import { Input } from '@/shared/components/ui/input';
import { NumberField } from '@/shared/components/ui/number-field';
import { cn } from '@/lib/utils';
import { AvailabilityCalendar, monthOf } from '../availability-calendar';
import { ChoiceCard, Field, Reveal, StepIntro, StepMotion, StepNav, StepSection, Stepper, TextArea, money } from '../step-kit';

/** The words on the display: edited here, styled on the design step */
type DisplayText = Pick<DisplayFormData, 'eventMessage' | 'customMessage' | 'eventNumber' | 'recipientName'>;

const CUSTOM = 'Custom Message';

/** The value after the customer stops typing for `ms` (inputs are checked 300 ms after the last key) */
function useSettled<T>(value: T, ms = 300): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

/** Keeps only characters a sign exists for; says what was left out */
function signText(raw: string): { text: string; dropped: string[] } {
  const dropped = unsupportedCharacters(raw);
  if (dropped.length === 0) return { text: raw, dropped };
  return { text: [...raw].filter(ch => /\s/.test(ch) || SIGN_CHARACTERS.has(ch.toUpperCase())).join(''), dropped };
}

const messageOf = (t: DisplayText) => ((t.eventMessage === CUSTOM ? t.customMessage : t.eventMessage) || '').trim();

/**
 * Step 1, "What and when" (PRODUCT.md "Booking configurator"): the
 * message, number and name first, each field sliding in once the one above
 * is filled, so the calendar knows exactly which signs the display needs
 * and grays out the days they aren't free. Then extra days, then the
 * address last.
 */
export function EventDetailsStep({ custom }: { custom?: string }) {
  const { formData, updateFormData, nextStep, bookingRules, pricing, timeZone, availability } = useWizard();
  const today = useMemo(() => todayIn(timeZone), [timeZone]);
  const eventSchema = useMemo(() => createEventSchema(bookingRules, today), [bookingRules, today]);

  useEffect(() => { availability.ensure(); }, [availability]);

  const [text, setText] = useState<DisplayText>({
    eventMessage: formData.display?.eventMessage ?? '',
    customMessage: formData.display?.customMessage ?? '',
    eventNumber: formData.display?.eventNumber,
    recipientName: formData.display?.recipientName ?? '',
  });
  const [dropped, setDropped] = useState<string[]>([]);
  useEffect(() => {
    if (dropped.length === 0) return;
    const t = setTimeout(() => setDropped([]), 5000);
    return () => clearTimeout(t);
  }, [dropped]);

  const [day, setDay] = useState<string | null>(formData.event?.eventDate ? toDayKey(new Date(formData.event.eventDate)) : null);
  const [extra, setExtra] = useState({
    extraDaysBefore: formData.event?.extraDaysBefore ?? 0,
    // Start at the agency's minimum rental length (the event day counts as one)
    extraDaysAfter: formData.event?.extraDaysAfter ?? Math.max(0, bookingRules.minimumRentalDays - 1),
  });
  const [details, setDetails] = useState<Pick<EventFormData, 'deliveryAddress' | 'timeWindow' | 'deliveryNotes'>>({
    deliveryAddress: formData.event?.deliveryAddress ?? { street: '', city: '', state: '', zipCode: '' },
    timeWindow: formData.event?.timeWindow ?? ('morning' as TimeWindow),
    deliveryNotes: formData.event?.deliveryNotes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inspected, setInspected] = useState<string | null>(null);
  const [month, setMonth] = useState(() => monthOf(day ?? earliestEventDay(bookingRules, 0, today)));

  const setTextField = (field: keyof DisplayText, value: string | number | undefined) => {
    if (typeof value === 'string') {
      const clean = signText(value);
      if (clean.dropped.length) setDropped(clean.dropped);
      value = clean.text;
    }
    setText(prev => ({ ...prev, [field]: value }));
  };

  // What the calendar checks: the words as they stand 300 ms after typing
  const settled = useSettled(text);
  const settledMessage = messageOf(settled);
  const messageReady = settledMessage.length > 0;
  const nameReady = messageReady && settled.recipientName.trim().length > 0;
  const config = eventMessages.find(m => m.message === text.eventMessage);
  const showNumber = Boolean(text.eventMessage) && (config?.supportsNumber || text.eventMessage === CUSTOM);

  const check: DayCheck = useMemo(() => ({
    rules: bookingRules,
    today,
    ...extra,
    snapshot: availability.snapshot,
    index: availability.index,
    coveredTo: availability.range.to,
    message: messageElements(settledMessage, settled.eventNumber),
    name: nameElements(settled.recipientName),
  }), [bookingRules, today, extra, availability.snapshot, availability.index, availability.range.to, settledMessage, settled.eventNumber, settled.recipientName]);

  const statusOf = useMemo(() => {
    const cache = new Map<string, ReturnType<typeof dayStatus>>();
    return (d: string) => {
      if (!cache.has(d)) cache.set(d, dayStatus(d, check));
      return cache.get(d)!;
    };
  }, [check]);

  const selectedStatus = day ? statusOf(day) : null;
  const dayReady = Boolean(day) && selectedStatus?.kind !== 'closed' && selectedStatus?.kind !== 'full';
  const minMonth = monthOf(today);
  const maxMonth = monthOf(availability.range.to);

  const pickDay = (d: string) => {
    setDay(d);
    setInspected(null);
    setErrors(prev => ({ ...prev, eventDate: '' }));
  };

  const setDetail = (field: string, value: string) => {
    if (field.startsWith('deliveryAddress.')) {
      const key = field.split('.')[1];
      setDetails(prev => ({ ...prev, deliveryAddress: { ...prev.deliveryAddress, [key]: value } }));
    } else {
      setDetails(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const event: EventFormData | null = day ? { eventDate: dateOf(day), ...extra, ...details } : null;
  const eventValid = event ? eventSchema.safeParse(event).success : false;
  const canContinue = nameReady && dayReady && eventValid;

  const validateAndContinue = () => {
    if (!event || !dayReady) {
      setErrors(prev => ({ ...prev, eventDate: 'Pick a date for the display' }));
      return;
    }
    const result = eventSchema.safeParse(event);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(error => { fieldErrors[error.path.join('.')] = error.message; });
      setErrors(fieldErrors);
      return;
    }

    // Signs already reserved for other dates or other words: drop that hold
    // so the design step reserves again
    const held = formData.display;
    const signsOut = rentalWindow(bookingRules, event.eventDate, event.extraDaysBefore, event.extraDaysAfter);
    const textChanged = held && (messageOf(held as DisplayText) !== messageOf(text) || held.eventNumber !== text.eventNumber
      || (held.recipientName ?? '').trim() !== text.recipientName.trim() || held.eventMessage !== text.eventMessage);
    const datesChanged = held?.holdId && (held.holdRentalStart !== signsOut.start || held.holdRentalEnd !== signsOut.end);
    const display = {
      ...(held ?? {}),
      ...text,
      recipientName: text.recipientName.trim(),
      ...(held?.holdId && (textChanged || datesChanged)
        ? { holdId: '', staleHoldId: held.holdId, holdRentalStart: undefined, holdRentalEnd: undefined }
        : {}),
    } as DisplayFormData;
    updateFormData({ event, display });
    nextStep();
  };

  const extraDays = extra.extraDaysBefore + extra.extraDaysAfter;
  const fieldError = (field: string) => errors[field] || undefined;
  const words = (s: string) => s.toUpperCase();

  // A tapped gray day: why, and what would work instead
  const inspectedStatus = inspected ? statusOf(inspected) : null;
  const alternatives = useMemo(() => {
    if (!inspected || inspectedStatus?.kind !== 'full' || inspectedStatus.line === 'name') return [];
    return (config?.alternatives ?? []).filter(alt =>
      dayStatus(inspected, { ...check, message: messageElements(alt, eventMessages.find(m => m.message === alt)?.supportsNumber ? settled.eventNumber : undefined) }).kind === 'open');
  }, [inspected, inspectedStatus, config, check, settled.eventNumber]);
  const nearby = useMemo(() => (inspected && inspectedStatus?.kind === 'full' ? nearbyOpenDays(inspected, check) : []), [inspected, inspectedStatus, check]);

  const fullReason = (line: 'message' | 'name' | 'together', d: string) => {
    const what = line === 'message' ? words(settledMessage) : line === 'name' ? words(settled.recipientName) : `${words(settledMessage)} and ${words(settled.recipientName)} together`;
    return `Not enough signs free on ${formatDay(d)} for ${what}.`;
  };

  const selectClass = cn('h-12 w-full rounded-control border border-line-strong bg-surface px-3 text-copy text-fg focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none');

  return (
    <StepMotion custom={custom}>
      <StepIntro>Tell us what the display says, then pick a day the signs are free.</StepIntro>

      <StepSection title="What it says">
        <Field id="eventMessage" label="Message">
          <select
            id="eventMessage"
            value={text.eventMessage}
            onChange={(e) => setText(prev => ({ ...prev, eventMessage: e.target.value }))}
            className={selectClass}
          >
            <option value="">Choose a message</option>
            {eventMessages.map(m => <option key={m.message} value={m.message}>{m.message}</option>)}
          </select>
        </Field>
        <Reveal show={text.eventMessage === CUSTOM}>
          <Field id="customMessage" label="Your message">
            <Input
              id="customMessage"
              value={text.customMessage || ''}
              onChange={(e) => setTextField('customMessage', e.target.value)}
              placeholder="WELCOME HOME"
              autoComplete="off"
            />
          </Field>
        </Reveal>
        <Reveal show={showNumber && messageReady}>
          <Field id="eventNumber" label={config?.numberLabel || 'Number (optional)'}>
            <NumberField
              id="eventNumber"
              value={text.eventNumber}
              onValueChange={(v) => setText(prev => ({ ...prev, eventNumber: v ? parseInt(v) : undefined }))}
              placeholder={config?.numberPlaceholder || ''}
              maxLength={4}
            />
          </Field>
        </Reveal>
        <Reveal show={messageReady}>
          <Field id="recipientName" label="Who are we celebrating?">
            <Input
              id="recipientName"
              value={text.recipientName}
              onChange={(e) => setTextField('recipientName', e.target.value)}
              placeholder="Their name"
              autoComplete="off"
            />
          </Field>
        </Reveal>
        {dropped.length > 0 && (
          <p role="status" className="text-fine text-fg-muted">
            There&apos;s no sign for {dropped.join(' ')}, so {dropped.length === 1 ? 'it was' : 'they were'} left out.
          </p>
        )}
      </StepSection>

      <Reveal show={nameReady}>
        <StepSection title="The big day" hint="Days your display's signs are already taken are grayed out.">
          {availability.error && (
            <p role="alert" className="rounded-control bg-caution-soft p-3 text-fine text-caution">
              We couldn&apos;t check which days are free just now. You can still pick a date; we&apos;ll confirm the signs on the next step.
            </p>
          )}
          <AvailabilityCalendar
            month={month}
            onMonthChange={setMonth}
            minMonth={minMonth}
            maxMonth={maxMonth}
            statusOf={statusOf}
            selected={day}
            onSelect={pickDay}
            onInspect={setInspected}
            inspected={inspected}
          />

          {inspected && inspectedStatus && inspectedStatus.kind !== 'open' && inspectedStatus.kind !== 'unknown' && (
            <div role="status" className="grid gap-3 rounded-card border border-line bg-surface-sunken p-4">
              <p className="font-semibold">
                {inspectedStatus.kind === 'closed' ? inspectedStatus.reason : fullReason(inspectedStatus.line, inspected)}
              </p>
              {alternatives.length > 0 && (
                <div className="grid gap-2">
                  <p className="text-fine text-fg-muted">These messages fit that day:</p>
                  <div className="flex flex-wrap gap-2">
                    {alternatives.map(alt => (
                      <button key={alt} type="button" onClick={() => { setText(prev => ({ ...prev, eventMessage: alt })); setInspected(null); }}
                        className="h-11 rounded-control border border-line-strong bg-surface px-3 text-fine font-semibold hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none">
                        {alt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {nearby.length > 0 && (
                <div className="grid gap-2">
                  <p className="text-fine text-fg-muted">Nearby days with your signs free:</p>
                  <div className="flex flex-wrap gap-2">
                    {nearby.map(d => (
                      <button key={d} type="button" onClick={() => { pickDay(d); setMonth(monthOf(d)); }}
                        className="h-11 rounded-control border border-line-strong bg-surface px-3 text-fine font-semibold hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none">
                        {formatDay(d)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {errors.eventDate && <p role="alert" className="text-fine text-danger">{errors.eventDate}</p>}

          <Reveal show={Boolean(day)}>
            <div className="grid gap-3 border-t border-line pt-4">
              {day && <p className="font-semibold">{formatDay(day, true)}</p>}
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
                  <Stepper label={unit} value={extra[field]} max={maxExtraDays(bookingRules, extra[other])} onChange={(v) => setExtra(prev => ({ ...prev, [field]: v }))} />
                </div>
              ))}
              {day && selectedStatus?.kind === 'full' && (
                <p role="alert" className="rounded-control bg-caution-soft p-3 text-fine text-caution">
                  {extraDays > 0
                    ? `With ${extraDays} extra day${extraDays === 1 ? '' : 's'}, the signs would be out longer than they're free. Try fewer extra days or another date.`
                    : fullReason(selectedStatus.line, day)}
                </p>
              )}
              {day && selectedStatus?.kind === 'closed' && (
                <p role="alert" className="rounded-control bg-caution-soft p-3 text-fine text-caution">{selectedStatus.reason}</p>
              )}
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
                <span className="font-bold">Total{extraDays > 0 && <span className="font-normal text-fg-muted"> · includes {extraDays} extra day{extraDays === 1 ? '' : 's'}</span>}</span>
                <span className="font-display text-heading font-semibold tabular-nums">{money(calculateBookingTotal(pricing, extra.extraDaysBefore, extra.extraDaysAfter))}</span>
              </div>
            </div>
          </Reveal>
        </StepSection>
      </Reveal>

      {/* The address last: changing the date or the words never makes the customer re-enter it */}
      <Reveal show={nameReady && dayReady}>
        <div className="grid gap-6">
          <StepSection title="Where it goes">
            <Field id="street" label="Street address" error={fieldError('deliveryAddress.street')}>
              <Input id="street" type="text" value={details.deliveryAddress.street} onChange={(e) => setDetail('deliveryAddress.street', e.target.value)}
                placeholder="123 Main Street" autoComplete="street-address" className={errors['deliveryAddress.street'] ? 'border-danger' : ''} />
            </Field>
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-6 sm:col-span-3">
                <Field id="city" label="City" error={fieldError('deliveryAddress.city')}>
                  <Input id="city" type="text" value={details.deliveryAddress.city} onChange={(e) => setDetail('deliveryAddress.city', e.target.value)}
                    autoComplete="address-level2" className={errors['deliveryAddress.city'] ? 'border-danger' : ''} />
                </Field>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Field id="state" label="State" error={fieldError('deliveryAddress.state')}>
                  <Input id="state" type="text" value={details.deliveryAddress.state} onChange={(e) => setDetail('deliveryAddress.state', e.target.value.toUpperCase())}
                    placeholder="IA" maxLength={2} autoComplete="address-level1" className={errors['deliveryAddress.state'] ? 'border-danger' : ''} />
                </Field>
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Field id="zipCode" label="ZIP code" error={fieldError('deliveryAddress.zipCode')}>
                  <Input id="zipCode" type="text" inputMode="numeric" value={details.deliveryAddress.zipCode} onChange={(e) => setDetail('deliveryAddress.zipCode', e.target.value)}
                    autoComplete="postal-code" className={errors['deliveryAddress.zipCode'] ? 'border-danger' : ''} />
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
              ].map(option => (
                <ChoiceCard key={option.value} name="timeWindow" value={option.value} checked={details.timeWindow === option.value}
                  onChange={(v) => setDetail('timeWindow', v)} title={option.label} detail={option.detail} />
              ))}
            </div>
            <Field id="deliveryNotes" label="Notes for the setup crew (optional)">
              <TextArea id="deliveryNotes" value={details.deliveryNotes || ''} onChange={(e) => setDetail('deliveryNotes', e.target.value)}
                placeholder="Gate code, where to park, which side of the yard..." rows={3} />
            </Field>
          </StepSection>
        </div>
      </Reveal>

      <StepNav onNext={validateAndContinue} nextDisabled={!canContinue} />
    </StepMotion>
  );
}
