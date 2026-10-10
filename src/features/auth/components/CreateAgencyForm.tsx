'use client'

import { useState, useCallback, useEffect } from 'react'
import { createAgency, checkSubdomainAvailability, completeOnboarding } from '../actions'
import { createAgencySchema } from '@/lib/validation'
import { AGENCY_TIME_ZONES, guessAgencyTimeZone } from '@/lib/time-zones'
import { Building2, Check, X, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react'

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

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
    hasError ? 'border-red-300' : 'border-gray-300'
  }`

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 text-sm text-red-600 flex items-center">
      <AlertCircle className="h-4 w-4 mr-1" />
      {message}
    </p>
  )
}

export function CreateAgencyForm() {
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
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`${inputClass(!!errors.name)} pl-10`}
                  placeholder="Enter your business name"
                  maxLength={50}
                />
              </div>
              <FieldError message={errors.name} />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Business Phone *
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={inputClass(!!errors.phone)}
                placeholder="(303) 555-0142"
                maxLength={20}
              />
              <FieldError message={errors.phone} />
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website (Optional)
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => set('website', e.target.value)}
                className={inputClass(!!errors.website)}
                placeholder="https://www.yourbusiness.com"
                maxLength={200}
              />
              <FieldError message={errors.website} />
              <p className="mt-1 text-sm text-gray-500">
                Customers are sent back here after they book
              </p>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Business Description (Optional)
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => set('description', e.target.value)}
                className={`${inputClass(!!errors.description)} resize-none`}
                placeholder="Tell your clients about your services..."
                maxLength={200}
              />
              <FieldError message={errors.description} />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Your Booking Page Address *
              </label>
              <div className="flex items-center">
                <div className="px-3 py-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm whitespace-nowrap">
                  yce-v3.vercel.app/
                </div>
                <input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`${inputClass(!!errors.slug)} rounded-l-none`}
                  placeholder="your-business"
                  maxLength={30}
                />
              </div>
              {formData.slug && (
                <div className="flex items-center space-x-2 mt-2">
                  {slugStatus.checking ? (
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  ) : slugStatus.available === true ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : slugStatus.available === false ? (
                    <X className="h-4 w-4 text-red-500" />
                  ) : null}
                  <span className={`text-sm ${
                    slugStatus.checking ? 'text-blue-600' :
                    slugStatus.available === true ? 'text-green-600' :
                    slugStatus.available === false ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {slugStatus.message || 'Enter an address to check availability'}
                  </span>
                </div>
              )}
              <FieldError message={errors.slug} />
              <p className="mt-1 text-sm text-gray-500">
                Customers book at <span className="font-mono">/{formData.slug || 'your-business'}/booking</span>
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Cities You Serve *</p>
              <div className="space-y-3">
                {formData.serviceAreas.map((area, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      aria-label={`City ${index + 1}`}
                      type="text"
                      value={area.city}
                      onChange={(e) => updateArea(index, { city: e.target.value })}
                      className={inputClass(!!errors.serviceAreas)}
                      placeholder="City"
                      maxLength={60}
                    />
                    <input
                      aria-label={`State ${index + 1}`}
                      type="text"
                      value={area.state}
                      onChange={(e) => updateArea(index, { state: e.target.value.toUpperCase().slice(0, 2) })}
                      className={`${inputClass(!!errors.serviceAreas)} w-20`}
                      placeholder="ST"
                      maxLength={2}
                    />
                    {formData.serviceAreas.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove city ${index + 1}`}
                        onClick={() => set('serviceAreas', formData.serviceAreas.filter((_, i) => i !== index))}
                        className="px-3 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <FieldError message={errors.serviceAreas} />
              <button
                type="button"
                onClick={() => set('serviceAreas', [...formData.serviceAreas, { city: '', state: '' }])}
                className="mt-3 text-sm text-green-700 hover:text-green-800 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" /> Add another city
              </button>
              <p className="mt-1 text-sm text-gray-500">
                Shown to customers for reference; it never blocks a booking
              </p>
            </div>
            <div>
              <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700 mb-2">
                Time Zone *
              </label>
              <select
                id="timeZone"
                value={formData.timeZone}
                onChange={(e) => set('timeZone', e.target.value)}
                className={inputClass(!!errors.timeZone)}
              >
                <option value="" disabled>Choose your time zone</option>
                {AGENCY_TIME_ZONES.map(zone => (
                  <option key={zone.value} value={zone.value}>{zone.label}</option>
                ))}
              </select>
              <FieldError message={errors.timeZone} />
              <p className="mt-1 text-sm text-gray-500">
                Booking cutoffs (&quot;order by end of day&quot;) use your time zone
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            {([
              ['basePrice', 'Base Price *', 'One display for the event day, including delivery and pickup'],
              ['extraDayPrice', 'Extra Day Price *', 'Charged for each extra day a customer adds before or after the event'],
            ] as const).map(([field, label, hint]) => (
              <div key={field}>
                <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    id={field}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={formData[field]}
                    onChange={(e) => set(field, e.target.value)}
                    className={`${inputClass(!!errors[field])} pl-8`}
                    placeholder={field === 'basePrice' ? '95' : '10'}
                  />
                </div>
                <FieldError message={errors[field]} />
                <p className="mt-1 text-sm text-gray-500">{hint}. You can change it any time in Settings.</p>
              </div>
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
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((_, i) => i + 1).map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber <= step ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < totalSteps && (
                <div className={`w-16 h-0.5 mx-2 ${stepNumber < step ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Step {step} of {totalSteps}: {STEPS[step - 1].title}
        </p>
      </div>

      {renderStepContent()}

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {submitError}
          </p>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={step === 1}
          className={`px-6 py-3 border border-gray-300 rounded-lg font-medium transition-colors ${
            step === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>

        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={step === 2 && (!formData.slug || !slugStatus.available || slugStatus.checking)}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting || !slugStatus.available || slugStatus.checking}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Agency...</span>
              </>
            ) : (
              <span>Create Agency</span>
            )}
          </button>
        )}
      </div>
    </form>
  )
}
