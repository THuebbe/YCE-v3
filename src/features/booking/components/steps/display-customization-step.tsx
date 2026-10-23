'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWizard } from '../../context/wizard-context';
import { displaySchema, type DisplayFormData, type LayoutCalculation } from '../../types';
import { formatDay, rentalWindow } from '../../booking-rules';
import { freeCounts, lineUsage } from '../../availability';
import { LINES, isCommitted, optionsFor, pick, reconcile, type Line, type Picks } from '../../design-picks';
import { messageElements, nameElements } from '../../services/line-elements';
import { LayoutCalculatorService } from '../../services/layout-calculator';
import { themes, hobbies } from '../../display-options';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/lib/utils';
import { BookingYardPreview } from '../display/BookingYardPreview';
import { Field, StepIntro, StepMotion, StepNav, StepSection } from '../step-kit';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const CUSTOM = 'Custom Message';
const label = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);
const lower = (v?: string) => (v ?? '').toLowerCase();

/** An empty zone, so a line that isn't picked yet doesn't show */
const emptyZone = (zone: LayoutCalculation['zone1']) => ({ ...zone, signs: [], totalWidth: 0 });

/**
 * The design step (PRODUCT.md "Booking configurator"): a style and a color
 * for each line, offering only what's free for the customer's dates. A
 * line's signs drop in once both its pickers are set; the extras join when
 * both lines are in. The words and dates come from step 1.
 */
export function DisplayCustomizationStep({ custom }: { custom?: string }) {
  const { formData, updateFormData, nextStep, prevStep, agencyId, agencySlug, sessionId, timeZone, actions, bookingRules, availability } = useWizard();
  const display = formData.display;
  const event = formData.event;

  useEffect(() => { availability.ensure(); }, [availability]);

  const [localData, setLocalData] = useState<DisplayFormData>(() => ({
    eventMessage: display?.eventMessage ?? '',
    customMessage: display?.customMessage ?? '',
    eventNumber: display?.eventNumber,
    recipientName: display?.recipientName ?? '',
    messageStyle: lower(display?.messageStyle),
    nameStyle: lower(display?.nameStyle),
    messageColorway: lower(display?.messageColorway),
    nameColorway: lower(display?.nameColorway),
    characterTheme: display?.characterTheme ?? '',
    hobbies: display?.hobbies ?? [],
    holdId: display?.holdId ?? '',
    holdRentalStart: display?.holdRentalStart,
    holdRentalEnd: display?.holdRentalEnd,
    staleHoldId: display?.staleHoldId,
    commitOrder: display?.commitOrder ?? [],
    layout: display?.layout,
  }));
  const [note, setNote] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [shortages, setShortages] = useState<{ name: string; requested: number; available: number }[]>([]);
  const [reserving, setReserving] = useState(false);
  // The session's last hold, kept after a design edit clears holdId so the
  // next reservation replaces it instead of stacking a second hold.
  const lastHoldId = useRef(localData.holdId || localData.staleHoldId || '');

  const typedMessage = ((localData.eventMessage === CUSTOM ? localData.customMessage : localData.eventMessage) || '').trim();
  const typedName = localData.recipientName.trim();
  const elements = useMemo(() => ({
    message: messageElements(typedMessage, localData.eventNumber),
    name: nameElements(typedName),
  }), [typedMessage, localData.eventNumber, typedName]);

  const signsOut = event ? rentalWindow(bookingRules, new Date(event.eventDate), event.extraDaysBefore ?? 0, event.extraDaysAfter ?? 0) : null;
  const input = useMemo(() => (availability.snapshot && availability.index && signsOut
    ? { elements, free: freeCounts(availability.snapshot, signsOut.start, signsOut.end), index: availability.index }
    : null), [availability.snapshot, availability.index, signsOut?.start, signsOut?.end, elements]);

  const picks: Picks = {
    message: { style: localData.messageStyle, colorway: localData.messageColorway },
    name: { style: localData.nameStyle, colorway: localData.nameColorway },
    order: (localData.commitOrder ?? []) as Line[],
  };

  // Design changes release the hold: it's taken again for the new set
  const releaseHold = (prev: DisplayFormData): Partial<DisplayFormData> =>
    prev.holdId ? { holdId: '', staleHoldId: prev.holdId, holdRentalStart: undefined, holdRentalEnd: undefined, layout: undefined } : { layout: undefined };

  const applyPicks = (next: Picks) => {
    setLocalData(prev => ({
      ...prev,
      messageStyle: next.message.style,
      messageColorway: next.message.colorway,
      nameStyle: next.name.style,
      nameColorway: next.name.colorway,
      commitOrder: next.order,
      ...releaseHold(prev),
    }));
    setPreviewError(null);
    setShortages([]);
  };

  // Recheck the picks whenever the stock or the words change: a line that
  // no longer fits loses its picks, and only that line
  const reconciledFor = useRef<unknown>(null);
  useEffect(() => {
    if (!input || reconciledFor.current === input) return;
    reconciledFor.current = input;
    let current = picks;
    // One style in stock: nothing to choose, so it's picked for the customer
    const styles = new Set(input.index.pairs.map(p => p.style));
    if (styles.size === 1) {
      const only = [...styles][0];
      for (const line of LINES) if (!current[line].style) current = pick(current, line, 'style', only);
    }
    const { picks: next, cleared } = reconcile(current, input);
    if (JSON.stringify(next) !== JSON.stringify(picks)) applyPicks(next);
    if (cleared.length) {
      const words = cleared.map(l => (l === 'message' ? typedMessage : typedName).toUpperCase()).join(' and ');
      setNote(`The colors you had for ${words} aren't free on your dates anymore. Pick again below.`);
    }
  }, [input]);

  const choose = (line: Line, field: 'style' | 'colorway', value: string) => {
    // Tapping the chosen option again un-picks it
    const current = picks[line][field];
    applyPicks(pick(picks, line, field, current === value ? '' : value));
    setNote(null);
  };

  const messageIn = isCommitted(picks, 'message');
  const nameIn = isCommitted(picks, 'name');
  const bothIn = messageIn && nameIn;

  // The layout for what's picked: lines drop in one at a time, the extras
  // (drawn only from free stock) once both are in
  const calculator = useRef(new LayoutCalculatorService()).current;
  const [layout, setLayout] = useState<LayoutCalculation | null>((localData.layout as LayoutCalculation) ?? null);
  useEffect(() => {
    if (localData.holdId && localData.layout) {
      setLayout(localData.layout as LayoutCalculation);
      return;
    }
    if (!messageIn && !nameIn) {
      setLayout(null);
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      // Units left for the extras once both lines have their signs
      let extrasStock: Map<string, number> | undefined;
      if (bothIn && input && availability.snapshot) {
        const used = new Map<string, number>();
        for (const line of LINES) {
          const usage = lineUsage(input.elements[line], { style: picks[line].style, colorway: picks[line].colorway }, input.index);
          for (const [id, n] of usage ?? []) used.set(id, (used.get(id) ?? 0) + n);
        }
        extrasStock = new Map(availability.snapshot.signs.map(s => [s.key, Math.max(0, (input.free.get(s.id) ?? 0) - (used.get(s.id) ?? 0))]));
      }
      const fallback = messageIn ? picks.message : picks.name;
      calculator.calculateLayout({
        message: typedMessage,
        recipientName: typedName,
        eventNumber: localData.eventNumber,
        theme: localData.characterTheme,
        hobbies: localData.hobbies,
        agencyId,
        style: (messageIn ? picks.message : fallback).style,
        messageColorway: (messageIn ? picks.message : fallback).colorway,
        nameStyle: (nameIn ? picks.name : fallback).style,
        nameColorway: (nameIn ? picks.name : fallback).colorway,
        extrasStock,
      }).then(full => {
        if (!live) return;
        setLayout({
          ...full,
          zone1: messageIn ? full.zone1 : emptyZone(full.zone1),
          zone2: nameIn ? full.zone2 : emptyZone(full.zone2),
          zone3: bothIn ? full.zone3 : emptyZone(full.zone3),
          zone4: bothIn ? full.zone4 : emptyZone(full.zone4),
          zone5: bothIn ? full.zone5 : emptyZone(full.zone5),
        });
      }).catch(() => {});
    }, 150);
    return () => { live = false; clearTimeout(t); };
  }, [messageIn, nameIn, bothIn, picks.message.style, picks.message.colorway, picks.name.style, picks.name.colorway, localData.characterTheme, localData.hobbies, localData.holdId, input]);

  /** Reserve exactly the signs on screen (the layout shown is the layout held) */
  const reserve = async () => {
    if (!event || !layout || !bothIn) return;
    if (!layout.meetsMinimumFill) {
      setPreviewError('The name is short next to the message, which leaves gaps on the sides. Add a theme or a hobby to fill them.');
      return;
    }
    const placed = [layout.zone1, layout.zone2, layout.zone3, layout.zone4, layout.zone5].flatMap(z => z.signs);
    const missing = placed.filter(s => !s.catalogKey);
    if (missing.length) {
      setPreviewError(`These signs aren't available in this style and color: ${[...new Set(missing.map(s => s.character ?? s.type))].join(' ')}.`);
      return;
    }
    setReserving(true);
    setPreviewError(null);
    try {
      const result = await actions.createBookingHold({
        agencySlug,
        sessionId,
        timeZone,
        eventDate: new Date(event.eventDate).toISOString(),
        extraDaysBefore: event.extraDaysBefore ?? 0,
        extraDaysAfter: event.extraDaysAfter ?? 0,
        catalogKeys: placed.map(s => s.catalogKey!),
        replaceHoldId: localData.holdId || lastHoldId.current || undefined,
      });
      if (!result.ok) {
        setPreviewError(result.error);
        setShortages(result.shortages ?? []);
        // Someone else may have just taken a sign: refresh what's free
        void availability.refresh();
        return;
      }
      lastHoldId.current = result.holdId;
      const next: DisplayFormData = { ...localData, holdId: result.holdId, staleHoldId: undefined, holdRentalStart: result.rentalStart, holdRentalEnd: result.rentalEnd, layout };
      setLocalData(next);
      updateFormData({ display: next });
    } catch {
      setPreviewError('Your signs couldn\'t be reserved just now. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  const validateAndContinue = () => {
    if (!displaySchema.safeParse(localData).success) return;
    updateFormData({ display: localData });
    nextStep();
  };
  const isValid = displaySchema.safeParse(localData).success;

  // Back to step 1 (words and dates), keeping the picks
  const goBack = () => {
    updateFormData({ display: localData });
    prevStep();
  };

  const toggleHobby = (hobby: string) => {
    setLocalData(prev => {
      const current = prev.hobbies ?? [];
      return { ...prev, hobbies: current.includes(hobby) ? current.filter(h => h !== hobby) : [...current, hobby], ...releaseHold(prev) };
    });
  };

  const chip = (on: boolean) => cn(
    'flex h-11 items-center gap-2 rounded-control border px-3 text-fine font-semibold focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
    on ? 'border-action bg-action/10 text-fg' : 'border-line-strong bg-surface text-fg hover:bg-surface-sunken',
  );

  const linePicker = (line: Line) => {
    const words = (line === 'message' ? typedMessage : typedName).toUpperCase() + (line === 'message' && localData.eventNumber ? ` ${localData.eventNumber}` : '');
    const options = input ? optionsFor(picks, line, input) : null;
    const nothing = options && options.styles.length === 0 && options.colorways.length === 0;
    const showStyles = Boolean(input && new Set(input.index.pairs.map(p => p.style)).size > 1);
    const ready = Boolean(words.trim()) && Boolean(options);
    return (
      <StepSection key={line} title={line === 'message' ? 'The message' : 'The name'} hint={words}>
        {!options ? (
          <p className="text-fine text-fg-muted" role="status">{availability.error ?? 'Checking which signs are free on your dates...'}</p>
        ) : nothing ? (
          <div className="grid gap-2 rounded-control bg-caution-soft p-3 text-fine text-caution" role="alert">
            <p className="font-semibold">No style and color has enough signs free for {words} on your dates.</p>
            <Button variant="secondary" size="sm" className="justify-self-start" onClick={goBack}>Change the date or words</Button>
          </div>
        ) : (
          <fieldset disabled={!ready} className="grid gap-4 disabled:opacity-50">
            {showStyles && (
              <div className="grid gap-2">
                <p className="text-fine font-bold">Style</p>
                <div className="flex flex-wrap gap-2">
                  {options.styles.map(style => (
                    <button key={style} type="button" aria-pressed={picks[line].style === style} onClick={() => choose(line, 'style', style)} className={chip(picks[line].style === style)}>
                      {label(style)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <p className="text-fine font-bold">Color</p>
              <div className="flex flex-wrap gap-2">
                {options.colorways.map(colorway => (
                  <button key={colorway} type="button" aria-pressed={picks[line].colorway === colorway} onClick={() => choose(line, 'colorway', colorway)} className={chip(picks[line].colorway === colorway)}>
                    {/* The sign's own color name, e.g. "gold" */}
                    <span aria-hidden className="size-5 shrink-0 rounded-full border border-line-strong" style={{ backgroundColor: colorway }} />
                    {label(colorway)}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
        )}
      </StepSection>
    );
  };

  return (
    <StepMotion custom={custom}>
      <StepIntro>Pick a color for each line and watch it go up. Only colors with your signs free on your dates are shown.</StepIntro>

      {/* Stays in view on phones while the pickers scroll under it, so each line is seen dropping in */}
      <div className="sticky top-0 z-10 -mx-4 bg-canvas px-4 pt-2 pb-1 sm:static sm:mx-0 sm:p-0">
        <div className="relative overflow-hidden rounded-sheet border border-line bg-surface">
          <BookingYardPreview
            layout={layout ?? EMPTY_LAYOUT}
            typed={{ message: typedMessage, name: typedName }}
            className="block w-full"
          />
          {!messageIn && !nameIn && (
            <span className="absolute inset-x-3 top-3 rounded-control bg-surface/90 px-3 py-2 text-fine font-bold text-fg-muted">
              Pick a color for each line to see it go up
            </span>
          )}
        </div>
      </div>

      <section className="grid gap-3">
        <p className="flex flex-wrap items-baseline gap-x-2 text-fine text-fg-muted">
          <span className="font-semibold text-fg">{typedMessage.toUpperCase()} {localData.eventNumber ?? ''} · {typedName.toUpperCase()}</span>
          {event && <span>{formatDay(new Date(event.eventDate).toISOString().slice(0, 10))}</span>}
          <button type="button" onClick={goBack} className="font-bold text-action-text underline underline-offset-4">Change</button>
        </p>

        <div aria-live="polite" className="grid gap-3">
          {note && <p className="rounded-control bg-caution-soft p-3 text-fine text-caution" role="status">{note}</p>}
          {previewError ? (
            <div className="flex gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 text-danger" role="alert">
              <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div className="grid gap-1 text-fine">
                <p className="font-bold">{previewError}</p>
                {shortages.length > 0 && (
                  <ul className="grid gap-0.5">
                    {shortages.map(item => <li key={item.name}>{item.name}: need {item.requested}, {item.available} free on your dates</li>)}
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
          {!localData.holdId && bothIn && (
            <Button onClick={reserve} loading={reserving} disabled={reserving || !layout} className="w-full sm:w-auto sm:justify-self-start sm:px-8">
              Reserve these signs
            </Button>
          )}
        </div>
      </section>

      {linePicker('message')}
      {linePicker('name')}

      <StepSection title="Extras (optional)" hint="Themed signs on either side of the name.">
        <Field id="characterTheme" label="Theme">
          <select
            id="characterTheme"
            value={localData.characterTheme || ''}
            onChange={(e) => setLocalData(prev => ({ ...prev, characterTheme: e.target.value, ...releaseHold(prev) }))}
            className="h-12 w-full rounded-control border border-line-strong bg-surface px-3 text-copy text-fg focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
          >
            <option value="">No theme</option>
            {themes.map(theme => <option key={theme} value={theme}>{theme}</option>)}
          </select>
        </Field>
        <fieldset className="grid gap-2">
          <legend className="text-fine font-bold">Hobbies and interests</legend>
          <div className="flex flex-wrap gap-2">
            {hobbies.map(hobby => {
              const on = localData.hobbies?.includes(hobby) || false;
              return (
                <button key={hobby} type="button" aria-pressed={on} onClick={() => toggleHobby(hobby)} className={chip(on)}>
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

/** An empty yard: no line picked yet */
const EMPTY_LAYOUT: LayoutCalculation = {
  zone1: { zone: 'zone1', signs: [], totalWidth: 0 },
  zone2: { zone: 'zone2', signs: [], totalWidth: 0 },
  zone3: { zone: 'zone3', signs: [], totalWidth: 0 },
  zone4: { zone: 'zone4', signs: [], totalWidth: 0 },
  zone5: { zone: 'zone5', signs: [], totalWidth: 0 },
  totalWidth: 0,
  gridColumns: 0,
  meetsMinimumFill: false,
};
