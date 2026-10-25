'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from '@/shared/components/feedback/modal';
import { Button } from '@/shared/components/ui/button';
import { NumberField } from '@/shared/components/ui/number-field';
import { useToast } from '@/shared/components/feedback/toast';
import { useAgencySlug } from '@/lib/navigation';
import { getBookingCatalog } from '@/features/booking/actions';
import { LayoutCalculatorService } from '@/features/booking/services/layout-calculator';
import { DisplayGrid } from '@/features/booking/components/display/DisplayGrid';
import { eventMessages, hobbies as hobbyOptions, themes } from '@/features/booking/display-options';
import type { LayoutCalculation } from '@/features/booking/types';
import { updateOrderDisplay, type DisplayEdit } from '../actions';
import { COLORS } from '@/lib/brand';

interface EditDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

const capitalize = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

/** The order's saved choices, or what older orders (message text only) allow */
function initialDisplay(order: any): DisplayEdit {
  const saved = order?.display_config as Partial<DisplayEdit> | null;
  if (saved?.eventMessage) {
    return {
      eventMessage: saved.eventMessage, customMessage: saved.customMessage ?? '', eventNumber: saved.eventNumber ?? null,
      // Orders from the booking step save these lowercase ("gold"); the pickers here are capitalized
      recipientName: saved.recipientName ?? '', messageStyle: capitalize(saved.messageStyle ?? 'Classic'),
      messageColorway: capitalize(saved.messageColorway ?? 'Red'), nameColorway: capitalize(saved.nameColorway ?? 'Red'),
      characterTheme: saved.characterTheme ?? '', hobbies: saved.hobbies ?? [],
    };
  }
  const preset = eventMessages.some(m => m.message === order?.message) ? order.message : 'Custom Message';
  return {
    eventMessage: preset, customMessage: preset === 'Custom Message' ? (order?.message_text ?? '') : '', eventNumber: null,
    recipientName: '', messageStyle: 'Classic', messageColorway: 'Red', nameColorway: 'Red',
    characterTheme: order?.theme ?? '', hobbies: [],
  };
}

const field = 'mt-1 h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-copy text-fg focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none';

/**
 * Agency-only: change an order's message, name, style, colors or theme
 * before the signs go out (PRODUCT.md, decided 2026-10-19: a + b, agency
 * only). Same layout calculator and preview as booking; saving swaps the
 * reserved signs after a stock check. The price doesn't change.
 */
export function EditDisplayModal({ isOpen, onClose, order }: EditDisplayModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const agencySlug = useAgencySlug();
  const [d, setD] = useState<DisplayEdit>(() => initialDisplay(order));
  const [styles, setStyles] = useState<string[]>(['Classic']);
  const [colorways, setColorways] = useState<string[]>(['Red']);
  const [layout, setLayout] = useState<LayoutCalculation | null>(null);
  const [keys, setKeys] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<'preview' | 'save' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shortages, setShortages] = useState<{ name: string; requested: number; available: number }[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !agencySlug) return;
    setD(initialDisplay(order));
    setLayout(null); setKeys(null); setError(null); setShortages([]);
    // Capitalized like the booking step, which is how the order saved them
    getBookingCatalog(agencySlug).then(({ styles, colorways }) => {
      if (styles.length) setStyles(styles.map(capitalize));
      if (colorways.length) setColorways(colorways.map(capitalize));
    }).catch(() => {});
  }, [isOpen, agencySlug, order]);

  const set = <K extends keyof DisplayEdit>(k: K, v: DisplayEdit[K]) => {
    setD(prev => ({ ...prev, [k]: v }));
    setLayout(null); setKeys(null); // any change needs a fresh preview
  };
  const config = eventMessages.find(m => m.message === d.eventMessage);
  const message = d.eventMessage === 'Custom Message' ? (d.customMessage ?? '').trim() : d.eventMessage;

  const preview = async () => {
    if (!message || !d.recipientName.trim()) { setError('Enter a message and a name'); return; }
    setBusy('preview'); setError(null); setShortages([]);
    try {
      const result = await new LayoutCalculatorService().calculateLayout({
        message, recipientName: d.recipientName.trim(), eventNumber: d.eventNumber ?? undefined,
        theme: d.characterTheme || undefined, hobbies: d.hobbies, agencyId: order.agency_id,
        style: d.messageStyle ?? 'Classic', messageColorway: d.messageColorway ?? 'Red', nameColorway: d.nameColorway ?? 'Red',
        eventDate: order.event_date ? String(order.event_date).slice(0, 10) : undefined,
      });
      setLayout(result);
      const placed = [result.zone1, result.zone2, result.zone3, result.zone4, result.zone5].flatMap(z => z.signs);
      const unmatched = placed.filter(s => !s.catalogKey);
      if (!result.meetsMinimumFill) setError('This layout doesn\'t fill the display enough. Try a longer message or a theme.');
      else if (unmatched.length) setError(`No signs for these characters in this style and color: ${[...new Set(unmatched.map(s => s.character ?? s.type))].join(' ')}`);
      else setKeys(placed.map(s => s.catalogKey!));
    } catch (e) {
      console.error('Edit preview failed:', e);
      setError('Couldn\'t build the preview');
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!keys) return;
    setBusy('save'); setError(null); setShortages([]);
    let snapshotDataUrl: string | undefined;
    try {
      const node = previewRef.current;
      if (node?.offsetWidth) {
        const { toJpeg } = await import('html-to-image');
        snapshotDataUrl = await toJpeg(node, { quality: 0.85, pixelRatio: Math.min(3, Math.max(1, 1200 / node.offsetWidth)), backgroundColor: COLORS.surface });
      }
    } catch (e) {
      console.warn('Edited display picture not captured (saving anyway):', e);
    }
    const result = await updateOrderDisplay({ orderId: order.id, display: d, catalogKeys: keys, snapshotDataUrl });
    setBusy(null);
    if (!result.success) {
      setError(result.error);
      setShortages(result.shortages ?? []);
      return;
    }
    toast({ title: 'Display updated', description: 'The signs are re-reserved. Regenerate the pick ticket if you printed one.', variant: 'success' });
    onClose();
    router.refresh();
  };

  return (
    <Modal open={isOpen} onOpenChange={open => { if (!open) onClose(); }} size="lg">
      <ModalHeader>
        <ModalTitle>Edit display</ModalTitle>
        <ModalDescription>Change the message, name, style or colors. The price stays the same.</ModalDescription>
      </ModalHeader>
      <ModalContent className="max-h-[70vh] space-y-4 overflow-y-auto">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-fine font-semibold">Message
            <select className={field} value={d.eventMessage} onChange={e => set('eventMessage', e.target.value)}>
              {eventMessages.map(m => <option key={m.message} value={m.message}>{m.message}</option>)}
            </select>
          </label>
          {d.eventMessage === 'Custom Message' && (
            <label className="text-fine font-semibold">Custom message
              <input className={field} value={d.customMessage ?? ''} onChange={e => set('customMessage', e.target.value)} maxLength={40} />
            </label>
          )}
          {config?.supportsNumber && (
            <label className="text-fine font-semibold">{config.numberLabel ?? 'Number'} (optional)
              <NumberField className="mt-1" value={d.eventNumber} placeholder={config.numberPlaceholder}
                onValueChange={v => set('eventNumber', v ? Number(v) : null)} />
            </label>
          )}
          <label className="text-fine font-semibold">Name
            <input className={field} value={d.recipientName} onChange={e => set('recipientName', e.target.value)} maxLength={30} />
          </label>
          <label className="text-fine font-semibold">Style
            <select className={field} value={d.messageStyle ?? ''} onChange={e => set('messageStyle', e.target.value)}>
              {styles.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-fine font-semibold">Message color
            <select className={field} value={d.messageColorway ?? ''} onChange={e => set('messageColorway', e.target.value)}>
              {colorways.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-fine font-semibold">Name color
            <select className={field} value={d.nameColorway ?? ''} onChange={e => set('nameColorway', e.target.value)}>
              {colorways.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-fine font-semibold">Theme
            <select className={field} value={d.characterTheme ?? ''} onChange={e => set('characterTheme', e.target.value)}>
              <option value="">No theme</option>
              {themes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <fieldset className="text-fine font-semibold">
          <legend className="mb-2 font-semibold">Hobbies (optional)</legend>
          <div className="flex flex-wrap gap-2">
            {hobbyOptions.map(h => (
              <label key={h} className="flex min-h-11 items-center gap-2 rounded-control border border-line px-3">
                <input type="checkbox" checked={d.hobbies?.includes(h) ?? false}
                  onChange={() => set('hobbies', d.hobbies?.includes(h) ? d.hobbies.filter(x => x !== h) : [...(d.hobbies ?? []), h])} />
                {h}
              </label>
            ))}
          </div>
        </fieldset>
        {!order?.display_config && (
          <p className="text-fine text-fg-muted">This order is from before display details were saved, so check the name and colors.</p>
        )}
        <Button variant="secondary" onClick={preview} disabled={!!busy}>{busy === 'preview' ? 'Building preview…' : 'Preview'}</Button>
        {layout && (
          <div className="aspect-[4/2]" ref={previewRef}>
            <DisplayGrid layout={layout} className="review-preview" />
          </div>
        )}
        {error && <p className="text-fine text-danger" role="alert">{error}</p>}
        {shortages.length > 0 && (
          <ul className="text-fine text-danger">
            {shortages.map(s => <li key={s.name}>{s.name}: need {s.requested}, {s.available} free</li>)}
          </ul>
        )}
      </ModalContent>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={busy === 'save'}>Cancel</Button>
        <Button onClick={save} disabled={!keys || !!busy}>{busy === 'save' ? 'Saving…' : 'Save display'}</Button>
      </ModalFooter>
    </Modal>
  );
}
