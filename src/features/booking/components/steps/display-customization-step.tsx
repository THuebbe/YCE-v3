'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWizard } from '../../context/wizard-context';
import { displaySchema, DisplayFormData, Sign } from '../../types';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { NumberField } from '@/shared/components/ui/number-field';
import { Field, StepIntro, StepMotion, StepNav, StepSection } from '../step-kit';
import { BookingYardPreview } from '../display/BookingYardPreview';
import { cn } from '@/lib/utils';
import { eventMessages, themes, hobbies } from '../../display-options';
import { LayoutCalculatorService } from '../../services/layout-calculator';
import { LayoutCalculation } from '../../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function DisplayCustomizationStep({ custom }: { custom?: string }) {
  const { formData, updateFormData, nextStep, prevStep, agencyId, agencySlug, sessionId, timeZone, actions } = useWizard();
  const [localData, setLocalData] = useState<DisplayFormData>(
    formData.display || {
      eventMessage: '',
      customMessage: '',
      eventNumber: undefined,
      messageStyle: 'Classic',
      recipientName: '',
      nameStyle: 'Classic',
      messageColorway: 'Red',
      nameColorway: 'Red',
      characterTheme: '',
      hobbies: [],
      holdId: '',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [layoutCalculation, setLayoutCalculation] = useState<LayoutCalculation | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [shortages, setShortages] = useState<{ name: string; requested: number; available: number }[]>([]);
  const [availableStyles, setAvailableStyles] = useState<string[]>(['Classic']);
  const [availableColorways, setAvailableColorways] = useState<string[]>(['Red']);
  // The session's last hold, kept after a design edit clears holdId so the
  // next preview replaces it instead of stacking a second hold.
  const lastHoldId = useRef(localData.holdId || localData.staleHoldId || '');

  const layoutCalculatorService = useRef(new LayoutCalculatorService()).current;

  const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

  useEffect(() => {
    actions.getBookingCatalog(agencySlug).then(({ styles, colorways }) => {
      if (styles.length > 0) setAvailableStyles(styles.map(capitalize));
      if (colorways.length > 0) setAvailableColorways(colorways.map(capitalize));
      // The defaults ('Classic' / 'Red') may be something this agency doesn't
      // stock; start from what it has so the first Generate can succeed
      const firstStyle = styles[0] && capitalize(styles[0]);
      const firstColor = colorways[0] && capitalize(colorways[0]);
      setLocalData(prev => {
        const styleOk = (v?: string) => !firstStyle || styles.some(s => capitalize(s) === v);
        const colorOk = (v?: string) => !firstColor || colorways.some(c => capitalize(c) === v);
        if (styleOk(prev.messageStyle) && styleOk(prev.nameStyle) && colorOk(prev.messageColorway) && colorOk(prev.nameColorway)) return prev;
        return {
          ...prev,
          messageStyle: styleOk(prev.messageStyle) ? prev.messageStyle : firstStyle,
          nameStyle: styleOk(prev.nameStyle) ? prev.nameStyle : firstStyle,
          messageColorway: colorOk(prev.messageColorway) ? prev.messageColorway : firstColor,
          nameColorway: colorOk(prev.nameColorway) ? prev.nameColorway : firstColor,
        };
      });
      if (styles.length === 0 || colorways.length === 0) {
        setPreviewError('This agency has no letter signs in stock yet. Please contact them directly.');
      }
    });
  }, [agencySlug]);

  // Edits that change which signs the display uses invalidate the hold;
  // the customer regenerates the preview to reserve the new set.
  const DESIGN_FIELDS: (keyof DisplayFormData)[] = [
    'eventMessage', 'customMessage', 'eventNumber', 'recipientName', 'messageStyle',
    'nameStyle', 'messageColorway', 'nameColorway', 'characterTheme', 'hobbies',
  ];

  const handleInputChange = (field: keyof DisplayFormData, value: any) => {
    const invalidatesHold = DESIGN_FIELDS.includes(field);
    setLocalData(prev => ({
      ...prev,
      [field]: value,
      ...(invalidatesHold && prev.holdId
        ? { holdId: '', staleHoldId: prev.holdId, holdRentalStart: undefined, holdRentalEnd: undefined }
        : {}),
    }));
    if (invalidatesHold) {
      setLayoutCalculation(null);
      setShortages([]);
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleHobbyToggle = (hobby: string) => {
    const currentHobbies = localData.hobbies || [];
    const newHobbies = currentHobbies.includes(hobby)
      ? currentHobbies.filter(h => h !== hobby)
      : [...currentHobbies, hobby];
    
    handleInputChange('hobbies', newHobbies);
  };

  /** Reserve `keys` for the current dates, replacing this session's last
   *  hold. Returns the updated display data, or null on failure (the error
   *  and any shortages are shown). */
  const reserveSigns = async (keys: string[], data: DisplayFormData): Promise<DisplayFormData | null> => {
    const event = formData.event;
    if (!event?.eventDate) {
      setPreviewError('Please choose an event date first');
      return null;
    }
    const result = await actions.createBookingHold({
      agencySlug,
      sessionId,
      timeZone,
      eventDate: new Date(event.eventDate).toISOString(),
      extraDaysBefore: event.extraDaysBefore ?? 0,
      extraDaysAfter: event.extraDaysAfter ?? 0,
      catalogKeys: keys,
      replaceHoldId: data.holdId || lastHoldId.current || undefined,
    });
    if (!result.ok) {
      setPreviewError(result.error);
      setShortages(result.shortages ?? []);
      return null;
    }
    lastHoldId.current = result.holdId;
    setShortages([]);
    setPreviewError(null);
    return { ...data, holdId: result.holdId, staleHoldId: undefined, holdRentalStart: result.rentalStart, holdRentalEnd: result.rentalEnd };
  };

  const generateLayoutPreview = async () => {
    if (!localData.eventMessage || !localData.recipientName) {
      return;
    }
    
    setPreviewLoading(true);
    setPreviewError(null);
    setShortages([]);
    
    try {
      const message = localData.eventMessage === 'Custom Message' 
        ? (localData.customMessage || '') 
        : localData.eventMessage;
      
      if (!message.trim()) {
        setPreviewLoading(false);
        return;
      }
      
      const layoutResult = await layoutCalculatorService.calculateLayout({
        message: message,
        recipientName: localData.recipientName,
        eventNumber: localData.eventNumber,
        theme: localData.characterTheme,
        hobbies: localData.hobbies,
        agencyId,
        style: localData.messageStyle,
        messageColorway: localData.messageColorway,
        nameColorway: localData.nameColorway
      });
      setLayoutCalculation(layoutResult); // shown even when it can't be reserved

      if (!layoutResult.meetsMinimumFill) {
        setPreviewError('The name is short next to the message, which leaves gaps on the sides. Add a theme or a hobby to fill them.');
        return;
      }

      const placed = [layoutResult.zone1, layoutResult.zone2, layoutResult.zone3, layoutResult.zone4, layoutResult.zone5]
        .flatMap(zone => zone.signs);
      const unmatched = placed.filter(sign => !sign.catalogKey);
      if (unmatched.length > 0) {
        const chars = [...new Set(unmatched.map(sign => sign.character ?? sign.type))].join(' ');
        setPreviewError(`These signs aren't available in this style and color: ${chars}. Try another color.`);
        return;
      }

      const keys = placed.map(sign => sign.catalogKey!);
      const reserved = await reserveSigns(keys, { ...localData, holdId: '' });
      const updatedData = reserved ?? { ...localData, holdId: '', holdRentalStart: undefined, holdRentalEnd: undefined };
      setLocalData(updatedData);
      updateFormData({ display: updatedData });
    } catch (error) {
      console.error('Error generating layout preview:', error);
      setPreviewError('Your signs couldn\'t be reserved just now. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  };
  
  const validateAndContinue = async () => {
    const result = displaySchema.safeParse(localData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const field = error.path[0] as string;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Make sure form data is saved to wizard context
    updateFormData({ display: localData });
    nextStep();
  };
  
  const isValid = displaySchema.safeParse(localData).success;

  // Live preview: the same layout calculator the reservation uses, run as
  // the customer designs (debounced), so what they see is what gets held.
  // Before they've chosen anything it shows an example.
  const typedMessage = (localData.eventMessage === 'Custom Message' ? localData.customMessage : localData.eventMessage) || '';
  const isExample = !typedMessage.trim() || !localData.recipientName.trim();
  const previewTyped = { message: typedMessage.trim() || 'Happy Birthday', name: localData.recipientName.trim() || 'Your Name' };
  const [liveLayout, setLiveLayout] = useState<LayoutCalculation | null>(null);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      layoutCalculatorService
        .calculateLayout({
          message: previewTyped.message,
          recipientName: previewTyped.name,
          eventNumber: localData.eventNumber,
          theme: localData.characterTheme,
          hobbies: localData.hobbies,
          agencyId,
          style: localData.messageStyle,
          messageColorway: localData.messageColorway,
          nameColorway: localData.nameColorway,
        })
        .then(layout => live && setLiveLayout(layout))
        .catch(() => {});
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [previewTyped.message, previewTyped.name, localData.eventNumber, localData.characterTheme, localData.hobbies, localData.messageStyle, localData.messageColorway, localData.nameColorway, agencyId]);

  const shownLayout = (localData.holdId && layoutCalculation) || liveLayout;
  const selectedMessageConfig = eventMessages.find(config => config.message === localData.eventMessage);
  const showNumberField = selectedMessageConfig?.supportsNumber || localData.eventMessage === 'Custom Message';
  const canReserve = Boolean(typedMessage.trim() && localData.recipientName.trim()) && !previewLoading;

  // Keep the design when going back to change the date
  const goBack = () => {
    updateFormData({ display: localData });
    prevStep();
  };

  const selectClass = (hasError?: boolean) => cn(
    'h-12 w-full rounded-control border bg-surface px-3 text-copy text-fg focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
    hasError ? 'border-danger' : 'border-line-strong',
  );

  const colorPicker = (field: 'messageColorway' | 'nameColorway', label: string) => (
    <fieldset className="grid gap-2">
      <legend className="text-fine font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {availableColorways.map((colorway) => {
          const checked = localData[field] === colorway;
          return (
            <label
              key={colorway}
              className={cn(
                'flex h-11 cursor-pointer items-center gap-2 rounded-control border px-3 text-fine font-semibold has-[:focus-visible]:shadow-(--focus-ring)',
                checked ? 'border-action bg-action/10' : 'border-line-strong bg-surface hover:bg-surface-sunken',
              )}
            >
              <input type="radio" name={field} value={colorway} checked={checked} onChange={(e) => handleInputChange(field, e.target.value)} className="sr-only" />
              {/* The sign's own color name, e.g. "gold" */}
              <span aria-hidden className="size-5 shrink-0 rounded-full border border-line-strong" style={{ backgroundColor: colorway.toLowerCase() }} />
              {colorway}
            </label>
          );
        })}
      </div>
    </fieldset>
  );

  return (
    <StepMotion custom={custom}>
      <StepIntro>Pick a message, add their name, and watch the signs go up. Reserve them when it looks right.</StepIntro>

      <section className="grid gap-3">
        <div className="relative overflow-hidden rounded-sheet border border-line bg-surface">
          {shownLayout ? (
            <BookingYardPreview layout={shownLayout} typed={previewTyped} className="block w-full" />
          ) : (
            <div className="aspect-[19/10] animate-pulse bg-surface-sunken" aria-hidden />
          )}
          {isExample && (
            <span className="absolute left-3 top-3 rounded-control bg-surface/90 px-2 py-1 text-fine font-bold text-fg-muted">Example</span>
          )}
        </div>

        <div aria-live="polite" className="grid gap-3">
          {previewError ? (
            <div className="flex gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 text-danger" role="alert">
              <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div className="grid gap-1 text-fine">
                <p className="font-bold">{previewError}</p>
                {shortages.length > 0 && (
                  <ul className="grid gap-0.5">
                    {shortages.map(item => (
                      <li key={item.name}>{item.name}: need {item.requested}, {item.available} free on your dates</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : localData.holdId ? (
            <p className="flex items-center gap-2 rounded-card bg-positive-soft p-4 text-fine font-bold text-positive">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
              Your signs are reserved for your dates. We hold them for an hour while you finish booking.
            </p>
          ) : null}

          {!localData.holdId && (
            <Button onClick={generateLayoutPreview} disabled={!canReserve} loading={previewLoading} className="w-full sm:w-auto sm:justify-self-start sm:px-8">
              Reserve these signs
            </Button>
          )}
          {!localData.holdId && !canReserve && !previewLoading && (
            <p className="text-fine text-fg-muted">Choose a message and type a name to reserve your signs.</p>
          )}
        </div>
      </section>

      <StepSection title="The message">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="eventMessage" label="Message" error={errors.eventMessage || undefined}>
            <select
              id="eventMessage"
              value={localData.eventMessage}
              onChange={(e) => handleInputChange('eventMessage', e.target.value)}
              className={selectClass(Boolean(errors.eventMessage))}
            >
              <option value="">Choose a message</option>
              {eventMessages.map((messageConfig) => (
                <option key={messageConfig.message} value={messageConfig.message}>
                  {messageConfig.message}
                </option>
              ))}
            </select>
          </Field>
          {showNumberField && (
            <Field id="eventNumber" label={selectedMessageConfig?.numberLabel || 'Number (optional)'}>
              <NumberField
                id="eventNumber"
                value={localData.eventNumber}
                onValueChange={(v) => handleInputChange('eventNumber', v ? parseInt(v) : undefined)}
                placeholder={selectedMessageConfig?.numberPlaceholder || ''}
                maxLength={4}
              />
            </Field>
          )}
        </div>
        {localData.eventMessage === 'Custom Message' && (
          <Field id="customMessage" label="Your message" error={errors.customMessage || undefined}>
            <Input
              id="customMessage"
              value={localData.customMessage || ''}
              onChange={(e) => handleInputChange('customMessage', e.target.value)}
              placeholder="WELCOME HOME"
              className={errors.customMessage ? 'border-danger' : ''}
            />
          </Field>
        )}
      </StepSection>

      <StepSection title="Who are we celebrating?">
        <Field id="recipientName" label="Their name" error={errors.recipientName || undefined}>
          <Input
            id="recipientName"
            type="text"
            value={localData.recipientName}
            onChange={(e) => handleInputChange('recipientName', e.target.value)}
            autoComplete="off"
            className={errors.recipientName ? 'border-danger' : ''}
          />
        </Field>
      </StepSection>

      <StepSection title="Colors" hint={availableStyles.length > 1 ? 'Sign style and colors for each line.' : undefined}>
        {availableStyles.length > 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {(['messageStyle', 'nameStyle'] as const).map(field => (
              <Field key={field} id={field} label={field === 'messageStyle' ? 'Message style' : 'Name style'} error={errors[field] || undefined}>
                <select id={field} value={localData[field]} onChange={(e) => handleInputChange(field, e.target.value)} className={selectClass()}>
                  {availableStyles.map(style => <option key={style} value={style}>{style}</option>)}
                </select>
              </Field>
            ))}
          </div>
        )}
        {colorPicker('messageColorway', 'Message color')}
        {colorPicker('nameColorway', 'Name color')}
      </StepSection>

      <StepSection title="Extras (optional)" hint="Themed signs on either side of the name.">
        <Field id="characterTheme" label="Theme">
          <select
            id="characterTheme"
            value={localData.characterTheme || ''}
            onChange={(e) => handleInputChange('characterTheme', e.target.value || '')}
            className={selectClass()}
          >
            <option value="">No theme</option>
            {themes.map((theme) => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
        </Field>
        <fieldset className="grid gap-2">
          <legend className="text-fine font-bold">Hobbies and interests</legend>
          <div className="flex flex-wrap gap-2">
            {hobbies.map((hobby) => {
              const on = localData.hobbies?.includes(hobby) || false;
              return (
                <button
                  key={hobby}
                  type="button"
                  aria-pressed={on}
                  onClick={() => handleHobbyToggle(hobby)}
                  className={cn(
                    'h-11 rounded-control border px-3 text-fine font-semibold focus-visible:outline-none focus-visible:shadow-(--focus-ring)',
                    on ? 'border-action bg-action/10 text-fg' : 'border-line-strong bg-surface text-fg hover:bg-surface-sunken',
                  )}
                >
                  {hobby}
                </button>
              );
            })}
          </div>
        </fieldset>
      </StepSection>

      <StepNav onBack={goBack} onNext={validateAndContinue} nextDisabled={!isValid} />
    </StepMotion>
  );
}
