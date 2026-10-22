'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Field, TextArea } from '@/features/booking/components/step-kit'
import { useToast } from '@/shared/components/feedback/toast'
import { cn } from '@/lib/utils'
import { uploadCustomSign, getSignCategories, getSignThemes, getSignHolidays } from '../actions'
import { SIGN_IMAGE_MAX_BYTES, SIGN_IMAGE_TYPES } from '../limits'
import type { CustomSignUploadData } from '../types'

const input = 'h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-copy text-fg placeholder:text-fg-muted focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none'

function fileError(file: File): string | null {
  if (!SIGN_IMAGE_TYPES.includes(file.type)) return 'Use a JPEG, PNG, WebP or GIF image'
  if (file.size > SIGN_IMAGE_MAX_BYTES) return `Images can be up to ${SIGN_IMAGE_MAX_BYTES / 1024 / 1024} MB`
  return null
}

/**
 * A sign the agency bought somewhere other than the platform library. It's
 * saved to their custom signs, ready to add to stock. Booking can't place
 * custom signs on a display yet (PRODUCT.md, custom signs).
 */
export function CustomSignUploadForm({ onSuccess, onCancel }: { onSuccess?: (signId: string) => void; onCancel?: () => void }) {
  const { toast } = useToast()
  const [data, setData] = useState<CustomSignUploadData>({ name: '', description: '', category: '', themes: [], holidays: [], keywords: [] })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [options, setOptions] = useState<{ categories: string[]; themes: string[]; holidays: string[] }>({ categories: [], themes: [], holidays: [] })
  const [newCategory, setNewCategory] = useState(false)
  const [keyword, setKeyword] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([getSignCategories(), getSignThemes(), getSignHolidays()])
      .then(([categories, themes, holidays]) => setOptions({ categories, themes, holidays }))
      .catch(() => {})
  }, [])

  // Free the preview's object URL when it changes or the form closes
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const set = <K extends keyof CustomSignUploadData>(k: K, v: CustomSignUploadData[K]) => setData(prev => ({ ...prev, [k]: v }))
  const toggle = (k: 'themes' | 'holidays', v: string) => set(k, data[k].includes(v) ? data[k].filter(x => x !== v) : [...data[k], v])

  const pick = (picked: File | undefined) => {
    if (!picked) return
    const error = fileError(picked)
    setErrors(prev => ({ ...prev, file: error ?? '' }))
    if (error) return
    setFile(picked)
    setPreview(URL.createObjectURL(picked))
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  const addKeyword = () => {
    const k = keyword.trim()
    if (k && !data.keywords.includes(k)) set('keywords', [...data.keywords, k])
    setKeyword('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!file) next.file = 'Choose an image of the sign'
    if (!data.name.trim()) next.name = 'Give the sign a name'
    if (!data.category.trim()) next.category = 'Choose a category'
    setErrors(next)
    if (Object.keys(next).length) return

    const form = new FormData()
    form.append('image', file!)
    form.append('name', data.name.trim())
    form.append('description', data.description || '')
    form.append('category', data.category.trim())
    form.append('themes', JSON.stringify(data.themes))
    form.append('holidays', JSON.stringify(data.holidays))
    form.append('keywords', JSON.stringify(data.keywords))
    if (data.size_width) form.append('size_width', String(data.size_width))
    if (data.size_height) form.append('size_height', String(data.size_height))

    setBusy(true)
    try {
      const result = await uploadCustomSign(form)
      if (!result.success) {
        toast({ variant: 'error', title: 'Couldn’t upload the sign', description: result.error })
        return
      }
      toast({ variant: 'success', title: `${data.name.trim()} added to your custom signs` })
      if (result.signId) onSuccess?.(result.signId)
    } catch {
      toast({ variant: 'error', title: 'Couldn’t upload the sign', description: 'The image may be too large.' })
    } finally {
      setBusy(false)
    }
  }

  const chip = (active: boolean) => cn(
    'inline-flex min-h-11 items-center rounded-full border px-3 text-fine font-bold transition-colors focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
    active ? 'border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface hover:bg-surface-sunken',
  )

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-card border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-heading font-semibold">Upload a sign</h2>

      <div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={e => { e.preventDefault(); setDragging(false) }}
          onDrop={e => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]) }}
          className={cn(
            'relative flex min-h-48 flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed p-4 text-center transition-colors',
            dragging ? 'border-focus bg-notice-soft' : errors.file ? 'border-danger bg-danger-soft' : 'border-line-strong bg-surface-sunken',
          )}
        >
          {preview ? (
            <>
              <img src={preview} alt="The sign you picked" className="max-h-48 rounded-control object-contain" />
              <button type="button" onClick={clearFile} aria-label="Choose a different image"
                className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-surface shadow-raised hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none">
                <X className="size-5" aria-hidden />
              </button>
              <p className="text-fine text-fg-muted">{file?.name}</p>
            </>
          ) : (
            <>
              <ImagePlus className="size-8 text-fg-muted" aria-hidden />
              <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()}>Choose an image</Button>
              <p className="text-fine text-fg-muted">or drop it here · JPEG, PNG, WebP or GIF, up to {SIGN_IMAGE_MAX_BYTES / 1024 / 1024} MB. A transparent PNG looks best.</p>
            </>
          )}
          <input ref={fileInput} type="file" accept={SIGN_IMAGE_TYPES.join(',')} onChange={e => pick(e.target.files?.[0])} className="sr-only" tabIndex={-1} aria-hidden />
        </div>
        {errors.file && <p role="alert" className="mt-1 text-fine text-danger">{errors.file}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="sign-name" label="Name" error={errors.name}>
            <input id="sign-name" className={input} value={data.name} onChange={e => set('name', e.target.value)} placeholder="Soccer ball" maxLength={80} />
          </Field>
        </div>
        <Field id="sign-category" label="Category" error={errors.category}>
          {newCategory ? (
            <input id="sign-category" className={input} value={data.category} onChange={e => set('category', e.target.value)} placeholder="New category" maxLength={40} />
          ) : (
            <select id="sign-category" className={input} value={data.category}
              onChange={e => { if (e.target.value === '__new') { setNewCategory(true); set('category', '') } else set('category', e.target.value) }}>
              <option value="">Choose…</option>
              {options.categories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__new">New category…</option>
            </select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="sign-w" label="Width (in)">
            <input id="sign-w" className={input} type="number" min={1} inputMode="numeric" value={data.size_width ?? ''} onChange={e => set('size_width', parseInt(e.target.value) || undefined)} placeholder="24" />
          </Field>
          <Field id="sign-h" label="Height (in)">
            <input id="sign-h" className={input} type="number" min={1} inputMode="numeric" value={data.size_height ?? ''} onChange={e => set('size_height', parseInt(e.target.value) || undefined)} placeholder="18" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="sign-desc" label="Description (optional)">
            <TextArea id="sign-desc" rows={2} value={data.description} onChange={e => set('description', e.target.value)} />
          </Field>
        </div>
      </div>

      {options.themes.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-semibold">Themes (optional)</legend>
          <div className="flex flex-wrap gap-2">
            {options.themes.map(t => <button key={t} type="button" aria-pressed={data.themes.includes(t)} onClick={() => toggle('themes', t)} className={chip(data.themes.includes(t))}>{t}</button>)}
          </div>
        </fieldset>
      )}
      {options.holidays.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-semibold">Holidays (optional)</legend>
          <div className="flex flex-wrap gap-2">
            {options.holidays.map(h => <button key={h} type="button" aria-pressed={data.holidays.includes(h)} onClick={() => toggle('holidays', h)} className={chip(data.holidays.includes(h))}>{h}</button>)}
          </div>
        </fieldset>
      )}

      <Field id="sign-keyword" label="Search words (optional)" hint="Words you'd type to find it later">
        <div className="flex gap-2">
          <input id="sign-keyword" className={input} value={keyword} onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }} />
          <Button type="button" variant="secondary" onClick={addKeyword} disabled={!keyword.trim()}>Add</Button>
        </div>
      </Field>
      {data.keywords.length > 0 && (
        <ul className="-mt-3 flex flex-wrap gap-2">
          {data.keywords.map(k => (
            <li key={k} className="inline-flex items-center gap-1 rounded-full bg-surface-sunken py-1 pr-1 pl-3 text-fine font-semibold">
              {k}
              <button type="button" onClick={() => set('keywords', data.keywords.filter(x => x !== k))} aria-label={`Remove ${k}`}
                className="flex size-7 items-center justify-center rounded-full hover:bg-surface focus-visible:shadow-(--focus-ring) focus-visible:outline-none">
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>}
        <Button type="submit" loading={busy} disabled={busy}>{busy ? 'Uploading…' : 'Upload sign'}</Button>
      </div>
    </form>
  )
}
