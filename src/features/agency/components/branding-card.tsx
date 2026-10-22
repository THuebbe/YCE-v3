'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ImagePlus, Lock, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/components/feedback/toast';
import { agencyThemeVars, COLORS } from '@/lib/brand';
import { brandingStyle, type AgencyBranding } from '../branding';
import { removeBrandLogo, saveBrandColors, uploadBrandLogo } from '../branding-actions';
import { AgencyMark } from './agency-mark';

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Elite: the agency's colors and logo on its booking page, with a live
 * preview drawn from the same tokens the booking page uses. Wording is
 * never editable (DESIGN.md "White label"). Contrast is fixed for them:
 * agencyThemeVars darkens a color that text can't sit on, and the preview
 * says so.
 */
export function BrandingCard({ agencyId, agencyName, initial, canEdit, billingHref }: {
  agencyId: string;
  agencyName: string;
  initial: AgencyBranding;
  canEdit: boolean;
  billingHref: string;
}) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(initial);
  const [brand, setBrand] = useState(initial.brandColor ?? '');
  const [accent, setAccent] = useState(initial.accentColor ?? '');
  const [busy, setBusy] = useState<'colors' | 'logo' | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const draft: AgencyBranding = {
    brandColor: HEX.test(brand) ? brand.toUpperCase() : undefined,
    accentColor: HEX.test(accent) ? accent.toUpperCase() : undefined,
    logoUrl: saved.logoUrl,
  };
  const changed = (draft.brandColor ?? '') !== (saved.brandColor ?? '') || (draft.accentColor ?? '') !== (saved.accentColor ?? '');
  const invalid = (brand && !HEX.test(brand)) || (accent && !HEX.test(accent));
  // Did readability force a darker button than they picked?
  const picked = draft.accentColor ?? draft.brandColor;
  const adjusted = picked && draft.brandColor
    ? agencyThemeVars({ brand: draft.brandColor, accent: draft.accentColor })['--color-action'] !== picked
    : false;

  const saveColors = async () => {
    setBusy('colors');
    const result = await saveBrandColors(agencyId, { brandColor: draft.brandColor ?? '', accentColor: draft.accentColor ?? '' });
    setBusy(null);
    if (!result.success) return toast({ variant: 'error', title: 'Couldn’t save your colors', description: result.error });
    setSaved(result.branding);
    setBrand(result.branding.brandColor ?? '');
    setAccent(result.branding.accentColor ?? '');
    toast({ variant: 'success', title: 'Colors saved', description: 'Your booking page uses them now.' });
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    const form = new FormData();
    form.append('logo', file);
    setBusy('logo');
    const result = await uploadBrandLogo(agencyId, form);
    setBusy(null);
    if (fileInput.current) fileInput.current.value = '';
    if (!result.success) return toast({ variant: 'error', title: 'Couldn’t upload your logo', description: result.error });
    setSaved(result.branding);
    toast({ variant: 'success', title: 'Logo saved' });
  };

  const removeLogo = async () => {
    setBusy('logo');
    const result = await removeBrandLogo(agencyId);
    setBusy(null);
    if (!result.success) return toast({ variant: 'error', title: 'Couldn’t remove your logo', description: result.error });
    setSaved(result.branding);
  };

  return (
    <section aria-labelledby="branding-title" className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="branding-title" className="font-display text-heading font-semibold">Your brand</h2>
        {!canEdit && <span className="rounded-control bg-surface-sunken px-2 py-0.5 text-fine font-bold">Elite</span>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="grid content-start gap-5">
          {!canEdit && (
            <p className="flex items-start gap-2 rounded-control bg-surface-sunken p-3 text-fine">
              <Lock className="mt-0.5 size-4 shrink-0 text-fg-muted" aria-hidden />
              <span>
                Put your colors and logo on your booking page with Elite.{' '}
                <Link href={billingHref} className="font-bold text-action-text underline underline-offset-2">See plans</Link>
              </span>
            </p>
          )}

          <fieldset disabled={!canEdit || !!busy} className="grid gap-4 disabled:opacity-60 sm:grid-cols-2">
            <legend className="sr-only">Colors</legend>
            <ColorField id="brand-color" label="Brand color" hint="Your page header" value={brand} onChange={setBrand} fallback={COLORS.brand} />
            <ColorField id="accent-color" label="Accent color" hint="Buttons and links" value={accent} onChange={setAccent} fallback={brand || COLORS.action} />
          </fieldset>
          {invalid && <p role="alert" className="-mt-2 text-fine text-danger">Use a 6-digit color like #2E7D4F.</p>}

          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveColors} loading={busy === 'colors'} disabled={!changed || !!invalid || !!busy}>Save colors</Button>
              {(saved.brandColor || brand) && (
                <Button variant="ghost" disabled={!!busy} onClick={() => { setBrand(''); setAccent(''); }}>Use YardCard colors</Button>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <span className="text-fine font-bold">Logo</span>
            <div className="flex flex-wrap items-center gap-3">
              <AgencyMark name={agencyName} logoUrl={saved.logoUrl} className={saved.logoUrl ? 'h-14 max-w-[10rem] border border-line' : 'size-14 text-lead'} />
              {canEdit && (
                <>
                  <Button variant="secondary" disabled={!!busy} loading={busy === 'logo'} onClick={() => fileInput.current?.click()}>
                    <ImagePlus className="size-4" aria-hidden /> {saved.logoUrl ? 'Replace' : 'Upload logo'}
                  </Button>
                  {saved.logoUrl && (
                    <Button variant="ghost" disabled={!!busy} onClick={removeLogo} className="text-danger">
                      <Trash2 className="size-4" aria-hidden /> Remove
                    </Button>
                  )}
                  <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden
                    onChange={e => uploadLogo(e.target.files?.[0])} />
                </>
              )}
            </div>
            <p className="text-fine text-fg-muted">PNG, JPEG or WebP up to 2 MB. A wide logo on a transparent background works best. Without one, your initials show.</p>
          </div>
        </div>

        <BookingPreview name={agencyName} branding={canEdit ? draft : {}} adjusted={canEdit && adjusted} />
      </div>
    </section>
  );
}

function ColorField({ id, label, hint, value, onChange, fallback }: {
  id: string; label: string; hint: string; value: string; onChange: (v: string) => void; fallback: string;
}) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-fine font-bold">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={HEX.test(value) ? value : fallback}
          onChange={e => onChange(e.target.value.toUpperCase())}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-control border border-line-strong bg-surface p-1"
        />
        <input
          id={id}
          value={value}
          onChange={e => onChange(e.target.value.trim())}
          placeholder="Default"
          maxLength={7}
          spellCheck={false}
          className="h-11 w-full min-w-0 rounded-control border border-line-strong bg-surface px-3 font-mono text-copy uppercase text-fg placeholder:font-body placeholder:normal-case placeholder:text-fg-muted focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
        />
      </div>
      <span className="text-fine text-fg-muted">{hint}</span>
    </div>
  );
}

/** A small slice of the booking page in the draft colors, on the same tokens it uses */
function BookingPreview({ name, branding, adjusted }: { name: string; branding: AgencyBranding; adjusted: boolean }) {
  return (
    <figure className="grid content-start gap-2">
      <div data-agency="" style={brandingStyle(branding)} className="overflow-hidden rounded-card border border-line bg-canvas text-fg" aria-hidden>
        <div className="flex items-center gap-2 bg-brand px-3 py-3 text-on-brand">
          <AgencyMark name={name} logoUrl={branding.logoUrl} className={branding.logoUrl ? 'h-8' : 'size-8 text-copy'} />
          <span className="truncate font-display font-semibold">{name}</span>
        </div>
        <div className="grid gap-3 p-4">
          <span className="font-display text-heading font-semibold">Pick your message</span>
          <span className="flex gap-2">
            <span className="rounded-full bg-brand-accent px-2 py-0.5 text-fine font-bold text-brand">Popular</span>
            <span className="text-fine font-bold text-action-text underline">See all signs</span>
          </span>
          <span className="flex h-11 items-center justify-center rounded-control bg-action font-bold text-on-action">Continue</span>
        </div>
      </div>
      <figcaption className="text-fine text-fg-muted">
        Preview of your booking page.
        {adjusted && ' Your button color is darkened a little so its text stays easy to read.'}
      </figcaption>
    </figure>
  );
}
