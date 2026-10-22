'use client'

import { useState, useCallback, useEffect } from 'react'
import { createAgency, checkSubdomainAvailability, completeOnboarding } from '../actions'
import { createAgencySchema } from '@/lib/validation'
import { AGENCY_TIME_ZONES, guessAgencyTimeZone } from '@/lib/time-zones'
import { Building2, Check, X, Loader2, Plus, Trash2 } from 'lucide-react'
import { SITE_HOST } from '@/lib/site'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { NumberField } from '@/shared/components/ui/number-field'
import { Field, TextArea } from '@/features/booking/components/step-kit'

// Debounce hook for real-time validation
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface ServiceArea {
  city: string
  state: string
}

interface FormData {
  name: string
  phone: string
  website: string
  description: string
  slug: string
  serviceAreas: ServiceArea[]
  timeZone: string
  basePrice: string
  extraDayPrice: string
}

type ValidationErrors = Partial<Record<keyof FormData, string>>

interface SlugStatus {
  checking: boolean
  available: boolean | null
  message: string
}

const shape = createAgencySchema.shape

// Fields validated on each step (PRODUCT.md "Agency onboarding" steps 1-2;
// payments and subscription come later, with Stripe)
const STEPS: { title: string; fields: (keyof FormData)[] }[] = [
  { title: 'Your business', fields: ['name', 'phone', 'website', 'description'] },
  { title: 'Booking page', fields: ['slug'] },
  { title: 'Where you work', fields: ['serviceAreas', 'timeZone'] },
  { title: 'Pricing', fields: ['basePrice', 'extraDayPrice'] },
]

const input = (hasError: boolean) => cn(
  'h-12 w-full rounded-control border bg-surface px-4 text-copy text-fg placeholder:text-fg-muted focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
  hasError ? 'border-danger' : 'border-line-strong',
)

/** `demo` (the /lab page): every step works, but the last one creates nothing */
export function CreateAgencyForm({ demo = false }: { demo?: boolean } = {}) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    website: '',
    description: '',
    slug: '',
    serviceAreas: [{ city: '', state: '' }],
    timeZone: '',
    basePrice: '',
    extraDayPrice: '',
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const totalSteps = STEPS.length

  const [slugStatus, setSlugStatus] = useState<SlugStatus>({
    checking: false,
    available: null,
    message: ''
  })
  const debouncedSlug = useDebounce(formData.slug, 500)

  // Preselect the browser's time zone (client-only, after mount)
  useEffect(() => {
    setFormData(prev => (prev.timeZone ? prev : { ...prev, timeZone: guessAgencyTimeZone() }))
  }, [])

  useEffect(() => {
    setSubmitError(null)
  }, [step])

  const set = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const generateSlug = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30)
  }, [])

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value, slug: generateSlug(value) }))
  }

  const handleSlugChange = (value: string) => {
    set('slug', value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))
  }

  // Real-time slug validation
  useEffect(() => {
    if (!debouncedSlug || debouncedSlug.length < 3) {
      setSlugStatus({ checking: false, available: null, message: '' })
      return
    }

    const slugValidation = shape.slug.safeParse(debouncedSlug)
    if (!slugValidation.success) {
      setSlugStatus({
        checking: false,
        available: false,
        message: slugValidation.error.errors[0]?.message || 'Invalid format'
      })
      return
    }

    setSlugStatus(prev => ({ ...prev, checking: true }))
    checkSubdomainAvailability(debouncedSlug).then(result => {
      setSlugStatus({ checking: false, available: result.available, message: result.message })
    }).catch(() => {
      setSlugStatus({ checking: false, available: false, message: 'Unable to check availability' })
    })
  }, [debouncedSlug])

  // Values as the server schema expects them
  const parsedValue = (field: keyof FormData): unknown => {
    if (field === 'basePrice' || field === 'extraDayPrice') {
      return formData[field] === '' ? undefined : Number(formData[field])
    }
    if (field === 'website' || field === 'description') return formData[field] || undefined
    return formData[field]
  }

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: ValidationErrors = {}
    for (const field of STEPS[stepNumber - 1].fields) {
      const result = shape[field].safeParse(parsedValue(field))
      if (!result.success) newErrors[field] = result.error.errors[0]?.message
    }
    if (stepNumber === 2 && !newErrors.slug && !slugStatus.available) {
      newErrors.slug = slugStatus.message || 'That address is not available'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    setSubmitError(null)
    if (validateStep(step)) setStep(Math.min(step + 1, totalSteps))
  }

  const handlePrevious = () => {
    setSubmitError(null)
    setStep(Math.max(step - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step !== totalSteps) return

    // Every step, in case an earlier one was edited after leaving it
    for (let s = 1; s <= totalSteps; s++) {
      if (!validateStep(s)) {
        setStep(s)
        setSubmitError('Please fix the highlighted fields')
        return
      }
    }

    if (demo) {
      setSubmitError('Demo: this is where your agency would be created. Nothing was saved.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const formDataObj = new FormData()
      formDataObj.append('name', formData.name)
      formDataObj.append('slug', formData.slug)
      formDataObj.append('phone', formData.phone)
      formDataObj.append('timeZone', formData.timeZone)
      formDataObj.append('basePrice', formData.basePrice)
      formDataObj.append('extraDayPrice', formData.extraDayPrice)
      formDataObj.append('serviceAreas', JSON.stringify(formData.serviceAreas))
      if (formData.website) formDataObj.append('website', formData.website)
      if (formData.description) formDataObj.append('description', formData.description)

      const result = await createAgency(formDataObj)
      if (result.success && result.agency) {
        // Redirects to the new dashboard (throws NEXT_REDIRECT)
        await completeOnboarding(result.agency.slug)
      } else {
        setSubmitError(result.error || 'Failed to create agency')
        setIsSubmitting(false)
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'digest' in error &&
          typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
        throw error
      }
      setSubmitError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const updateArea = (index: number, change: Partial<ServiceArea>) => {
    set('serviceAreas', formData.serviceAreas.map((area, i) => (i === index ? { ...area, ...change } : area)))
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="grid gap-5">
            <Field id="name" label="Business name" error={errors.name}>
              <div className="relative">
                <Building2 className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-fg-muted" aria-hidden />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={cn(input(!!errors.name), 'pl-10')}
                  placeholder="Your business name"
                  maxLength={50}
                  autoComplete="organization"
                />
              </div>
            </Field>
            <Field id="phone" label="Business phone" error={errors.phone}>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={input(!!errors.phone)}
                placeholder="(303) 555-0142"
                maxLength={20}
                autoComplete="tel"
              />
            </Field>
            <Field id="website" label="Website (optional)" error={errors.website} hint="Customers are sent back here after they book">
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => set('website', e.target.value)}
                className={input(!!errors.website)}
                placeholder="https://www.yourbusiness.com"
                maxLength={200}
              />
            </Field>
            <Field id="description" label="About your business (optional)" error={errors.description}>
              <TextArea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => set('description', e.target.value)}
                className={errors.description ? 'border-danger' : undefined}
                placeholder="Birthday and graduation yard signs in the Denver area"
                maxLength={200}
              />
            </Field>
          </div>
        )

      case 2:
        return (
          <Field
            id="slug"
            label="Your booking page address"
            error={errors.slug}
            hint={<>Customers book at <span className="font-mono">{SITE_HOST}/{formData.slug || 'your-business'}/booking</span></>}
          >
            <div className="flex">
              <span className="flex items-center rounded-l-control border border-r-0 border-line-strong bg-surface-sunken px-3 text-fine whitespace-nowrap text-fg-muted">
                {SITE_HOST}/
              </span>
              <input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className={cn(input(!!errors.slug), 'min-w-0 rounded-l-none')}
                placeholder="your-business"
                maxLength={30}
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
            {formData.slug && (
              <p
                aria-live="polite"
                className={cn(
                  'flex items-center gap-1.5 text-fine font-semibold',
                  slugStatus.checking ? 'text-fg-muted' : slugStatus.available === true ? 'text-positive' : slugStatus.available === false ? 'text-danger' : 'text-fg-muted',
                )}
              >
                {slugStatus.checking ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : slugStatus.available === true ? (
                  <Check className="size-4" aria-hidden />
                ) : slugStatus.available === false ? (
                  <X className="size-4" aria-hidden />
                ) : null}
                {slugStatus.checking ? 'Checking…' : slugStatus.message || 'Type at least 3 characters'}
              </p>
            )}
          </Field>
        )

      case 3:
        return (
          <div className="grid gap-5">
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-fine font-bold text-fg">Cities you serve</legend>
              {formData.serviceAreas.map((area, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    aria-label={`City ${index + 1}`}
                    type="text"
                    value={area.city}
                    onChange={(e) => updateArea(index, { city: e.target.value })}
                    className={input(!!errors.serviceAreas)}
                    placeholder="City"
                    maxLength={60}
                  />
                  <input
                    aria-label={`State ${index + 1}`}
                    type="text"
                    value={area.state}
                    onChange={(e) => updateArea(index, { state: e.target.value.toUpperCase().slice(0, 2) })}
                    className={cn(input(!!errors.serviceAreas), 'w-20 shrink-0')}
                    placeholder="ST"
                    maxLength={2}
                  />
                  {formData.serviceAreas.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove city ${index + 1}`}
                      onClick={() => set('serviceAreas', formData.serviceAreas.filter((_, i) => i !== index))}
                      className="h-12 shrink-0 text-fg-muted hover:text-danger"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  )}
                </div>
              ))}
              {errors.serviceAreas ? (
                <p className="text-fine text-danger" role="alert">{errors.serviceAreas}</p>
              ) : (
                <p className="text-fine text-fg-muted">Shown to customers for reference; it never blocks a booking</p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => set('serviceAreas', [...formData.serviceAreas, { city: '', state: '' }])}
                className="justify-self-start px-2"
              >
                <Plus className="size-4" aria-hidden /> Add another city
              </Button>
            </fieldset>
            <Field id="timeZone" label="Time zone" error={errors.timeZone} hint={<>Booking cutoffs (&quot;order by end of day&quot;) use your time zone</>}>
              <select
                id="timeZone"
                value={formData.timeZone}
                onChange={(e) => set('timeZone', e.target.value)}
                className={input(!!errors.timeZone)}
              >
                <option value="" disabled>Choose your time zone</option>
                {AGENCY_TIME_ZONES.map(zone => (
                  <option key={zone.value} value={zone.value}>{zone.label}</option>
                ))}
              </select>
            </Field>
          </div>
        )

      case 4:
        return (
          <div className="grid gap-5">
            {([
              ['basePrice', 'Rental price', 'One display for the event day, including delivery and pickup', '95'],
              ['extraDayPrice', 'Each extra day', 'For each day a customer adds before or after the event', '10'],
            ] as const).map(([field, label, hint, placeholder]) => (
              <Field key={field} id={field} label={label} error={errors[field]} hint={`${hint}. You can change it any time in Settings.`}>
                <NumberField
                  id={field}
                  value={formData[field]}
                  onValueChange={(v) => set(field, v)}
                  prefix="$"
                  placeholder={placeholder}
                  aria-invalid={!!errors[field]}
                  className={errors[field] ? 'border-danger' : undefined}
                />
              </Field>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  // Enter moves to the next step instead of submitting early
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step !== totalSteps && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault()
      handleNext()
    }
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-fine font-bold text-fg-muted">
          Step {step} of {totalSteps} · <span className="text-fg">{STEPS[step - 1].title}</span>
        </p>
        <div className="flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s.title} className={cn('h-1.5 flex-1 rounded-full', i < step ? 'bg-brand' : 'bg-surface-sunken')} />
          ))}
        </div>
      </div>

      {renderStepContent()}

      {submitError && (
        <p role="alert" className="rounded-control bg-danger-soft p-3 text-fine font-semibold text-danger">
          {submitError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-between">
        {step > 1 ? (
          <Button type="button" variant="secondary" onClick={handlePrevious}>Back</Button>
        ) : <span className="hidden sm:block" />}

        {step < totalSteps ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={step === 2 && (!formData.slug || !slugStatus.available || slugStatus.checking)}
          >
            Next
          </Button>
        ) : (
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting || !slugStatus.available || slugStatus.checking}>
            {isSubmitting ? 'Creating your agency…' : 'Create my agency'}
          </Button>
        )}
      </div>
    </form>
  )
}
