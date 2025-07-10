'use client'

import { useState, useCallback, useEffect } from 'react'
import { createAgency, checkSubdomainAvailability, completeOnboarding } from '../actions'
import { createAgencySchema } from '@/lib/validation'
import { Building2, Check, X, AlertCircle, Loader2 } from 'lucide-react'

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

interface FormData {
  name: string
  slug: string
  description: string
}

interface ValidationErrors {
  name?: string
  slug?: string
  description?: string
}

interface SlugStatus {
  checking: boolean
  available: boolean | null
  message: string
}

export function CreateAgencyForm() {
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: ''
  })
  
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  
  // Debug: Log when submitError changes
  useEffect(() => {
    if (submitError) {
      console.log('Submit error set:', submitError)
      console.trace('Submit error stack trace')
    }
  }, [submitError])
  
  // Progressive disclosure state
  const [step, setStep] = useState(1)
  const totalSteps = 3
  
  // Slug validation state
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({
    checking: false,
    available: null,
    message: ''
  })
  
  // Debounced slug for real-time validation
  const debouncedSlug = useDebounce(formData.slug, 500)
  
  // Clear submit errors when step changes
  useEffect(() => {
    setSubmitError(null)
  }, [step])
  
  // Auto-generate slug from name
  const generateSlug = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30)
  }, [])
  
  // Handle name change and auto-generate slug
  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value)
    }))
  }
  
  // Handle slug change
  const handleSlugChange = (value: string) => {
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 30)
    
    setFormData(prev => ({
      ...prev,
      slug: cleanSlug
    }))
  }
  
  // Real-time slug validation
  useEffect(() => {
    if (!debouncedSlug || debouncedSlug.length < 3) {
      setSlugStatus({
        checking: false,
        available: null,
        message: ''
      })
      return
    }
    
    // Validate format first
    const slugValidation = createAgencySchema.shape.slug.safeParse(debouncedSlug)
    if (!slugValidation.success) {
      setSlugStatus({
        checking: false,
        available: false,
        message: slugValidation.error.errors[0]?.message || 'Invalid slug format'
      })
      return
    }
    
    // Check availability
    setSlugStatus(prev => ({ ...prev, checking: true }))
    
    checkSubdomainAvailability(debouncedSlug).then(result => {
      setSlugStatus({
        checking: false,
        available: result.available,
        message: result.message
      })
    }).catch((error) => {
      console.error('Slug check error:', error)
      setSlugStatus({
        checking: false,
        available: false,
        message: 'Unable to check slug availability'
      })
    })
  }, [debouncedSlug])
  
  // Validate current step
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: ValidationErrors = {}
    
    if (stepNumber >= 1) {
      const nameResult = createAgencySchema.shape.name.safeParse(formData.name)
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0]?.message
      }
    }
    
    if (stepNumber >= 2) {
      const slugResult = createAgencySchema.shape.slug.safeParse(formData.slug)
      if (!slugResult.success) {
        newErrors.slug = slugResult.error.errors[0]?.message
      } else if (!slugStatus.available) {
        newErrors.slug = slugStatus.message || 'Slug is not available'
      }
    }
    
    if (stepNumber >= 3 && formData.description) {
      const descResult = createAgencySchema.shape.description.safeParse(formData.description)
      if (!descResult.success) {
        newErrors.description = descResult.error.errors[0]?.message
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle next step
  const handleNext = () => {
    // Clear any previous submit errors when navigating
    setSubmitError(null)
    if (validateStep(step)) {
      setStep(Math.min(step + 1, totalSteps))
    }
  }
  
  // Handle previous step
  const handlePrevious = () => {
    // Clear submit errors when going back
    setSubmitError(null)
    setStep(Math.max(step - 1, 1))
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🎯 handleSubmit called!', e.type, e)
    console.trace('handleSubmit stack trace')
    e.preventDefault()
    
    // Prevent auto-submission - only allow if user is on final step and has filled required fields
    if (step !== totalSteps) {
      console.log('❌ Preventing submission - not on final step')
      return
    }
    
    setHasAttemptedSubmit(true)
    
    if (!validateStep(totalSteps)) {
      setSubmitError('Please correct the validation errors above')
      return
    }
    
    if (!slugStatus.available) {
      setSubmitError('Please choose an available agency slug')
      return
    }
    
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      console.log('🚀 Starting agency creation with data:', formData)
      const formDataObj = new FormData()
      formDataObj.append('name', formData.name)
      formDataObj.append('slug', formData.slug)
      if (formData.description) {
        formDataObj.append('description', formData.description)
      }
      
      console.log('📤 Calling createAgency server action...')
      const result = await createAgency(formDataObj)
      console.log('📥 Server action result:', result)
      
      if (result.success && result.agency) {
        // Complete onboarding and redirect
        await completeOnboarding(result.agency.slug)
      } else {
        setSubmitError(result.error || 'Failed to create agency')
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Render step content
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your business name"
                  maxLength={50}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                This will be displayed to your clients and on your booking page
              </p>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Choose Your Agency URL Slug *
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-0">
                  <div className="px-4 py-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm">
                    yce-v3.vercel.app/dashboard?agency=
                  </div>
                  <div className="relative flex-1">
                    <input
                      id="slug"
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                        errors.slug ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="your-business"
                      maxLength={30}
                    />
                  </div>
                </div>
                
                {formData.slug && (
                  <div className="flex items-center space-x-2">
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
                      {slugStatus.message || 'Enter a slug to check availability'}
                    </span>
                  </div>
                )}
              </div>
              
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.slug}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                This will be used in your dashboard URL: /dashboard?agency=your-slug
              </p>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Business Description (Optional)
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Tell your clients about your services, experience, and what makes your business special..."
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-1">
                <div>
                  {errors.description && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formData.description.length}/200
                </p>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                This will be shown on your booking page to help clients learn about your business
              </p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }
  
  // Handle key presses to prevent premature submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step !== totalSteps) {
      e.preventDefault()
      console.log('🚫 Prevented Enter key submission on step', step)
      handleNext()
    }
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber <= step
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < totalSteps && (
                <div
                  className={`w-16 h-0.5 mx-2 ${
                    stepNumber < step ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Step {step} of {totalSteps}
          </p>
        </div>
      </div>
      
      {/* Step Content */}
      {renderStepContent()}
      
      {/* Error Message - Only show after submit attempt */}
      {submitError && hasAttemptedSubmit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {submitError}
          </p>
        </div>
      )}
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={step === 1}
          className={`px-6 py-3 border border-gray-300 rounded-lg font-medium transition-colors ${
            step === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        
        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={
              (step === 1 && !formData.name) ||
              (step === 2 && (!formData.slug || !slugStatus.available || slugStatus.checking))
            }
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !slugStatus.available ||
              slugStatus.checking ||
              Object.keys(errors).length > 0
            }
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            autoFocus={false}
            onFocus={(e) => console.log('Submit button focused')}
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