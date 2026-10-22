'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useToast } from '@/shared/components/feedback/toast'
import { 
  agencyProfileSchema, 
  type AgencyProfileFormData, 
  type ValidationErrors 
} from '../validation/agencyProfile'
import { 
  copyToClipboard, 
  openBookingLink, 
  generateBookingUrl 
} from '../utils/bookingLink'

interface Agency {
  id: string
  name: string
  slug: string
}

interface AgencyProfileSectionProps {
  agency?: Agency
  agencySlug?: string
}

export function AgencyProfileSection({ agency, agencySlug }: AgencyProfileSectionProps) {
  const { isSignedIn, userId, isLoaded } = useAuth()
  const router = useRouter()

  // State management
  const [formData, setFormData] = useState<AgencyProfileFormData>({
    agencyName: '',
    agencyWebsite: '',
    contactEmail: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    agencySlug: '',
    bookingUrl: ''
  })
  const [originalData, setOriginalData] = useState<AgencyProfileFormData>()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { toast } = useToast()
  // Save and load results show as toasts; field errors stay under their fields
  useEffect(() => {
    if (!message) return
    toast({ variant: message.type === 'success' ? 'success' : 'error', title: message.text })
    setMessage(null)
  }, [message])
  const [copyMessage, setCopyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Permission check
  // Roles live in our users table, not Clerk organizations (the old check
  // used Clerk's orgRole, always empty here, so the profile never loaded).
  // The profile API checks the role; a 403 from it means no permission.
  const [hasPermission, setHasPermission] = useState(true)

  // Redirect unauthorized users
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth/sign-in')
      return
    }
    
    if (isLoaded && isSignedIn && !hasPermission) {
      // For testing, we'll show an error message instead of redirecting
      // In production, you might want to redirect
      return
    }
  }, [isLoaded, isSignedIn, hasPermission, router])

  // Load agency data
  useEffect(() => {
    const loadAgencyData = async () => {
      if (!agency?.id) {
        setMessage({ type: 'error', text: 'Agency information is not available.' })
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/agency/profile?agencyId=${agency.id}`)
        if (response.status === 401 || response.status === 403) {
          setHasPermission(false)
          return
        }
        const data = await response.json()
        
        if (response.ok && data && data.success && data.data) {
          const responseData = data.data
          const profileData = {
            agencyName: responseData.agencyName,
            agencyWebsite: responseData.agencyWebsite || '',
            contactEmail: responseData.contactEmail,
            phone: responseData.phone,
            address: responseData.address || {
              street: '',
              city: '',
              state: '',
              postalCode: '',
              country: ''
            },
            agencySlug: responseData.agencySlug,
            bookingUrl: responseData.bookingUrl || generateBookingUrl(responseData.agencySlug)
          }
          setFormData(profileData)
          setOriginalData(profileData)
        } else {
          throw new Error('Failed to load agency data')
        }
      } catch (error) {
        console.error('Error loading agency data:', error)
        setMessage({ type: 'error', text: 'Failed to load agency profile. Please try again.' })
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoaded && isSignedIn) {
      loadAgencyData()
    }
  }, [isLoaded, isSignedIn])

  // Track dirty state
  useEffect(() => {
    if (originalData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)
      setIsDirty(hasChanges)
    }
  }, [formData, originalData])

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    if (isDirty) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  // Handle input changes
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => {
      if (field.startsWith('address.')) {
        const addressField = field.split('.')[1]
        return {
          ...prev,
          address: {
            ...prev.address,
            [addressField]: value
          }
        }
      }
      return {
        ...prev,
        [field]: value
      }
    })

    // Clear errors for the field being edited
    setErrors(prev => {
      const newErrors = { ...prev }
      if (field.startsWith('address.')) {
        const addressField = field.split('.')[1]
        if (newErrors.address) {
          delete newErrors.address[addressField as keyof typeof newErrors.address]
          if (Object.keys(newErrors.address).length === 0) {
            delete newErrors.address
          }
        }
      } else {
        delete newErrors[field as keyof ValidationErrors]
      }
      return newErrors
    })

    // Clear messages when user starts typing
    if (message) setMessage(null)
  }, [message])

  // Validate form
  const validateForm = (): boolean => {
    try {
      agencyProfileSchema.parse(formData)
      setErrors({})
      return true
    } catch (error: any) {
      const newErrors: ValidationErrors = {}
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.')
          if (path.startsWith('address.')) {
            const addressField = path.split('.')[1]
            if (!newErrors.address) newErrors.address = {}
            newErrors.address[addressField as keyof typeof newErrors.address] = [err.message]
          } else {
            newErrors[path as keyof ValidationErrors] = [err.message]
          }
        })
      }
      
      setErrors(newErrors)
      return false
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!agency?.id) {
      setMessage({ type: 'error', text: 'Agency information is not available.' })
      return
    }
    
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/agency/profile?agencyId=${agency.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setOriginalData({ ...formData })
        setIsDirty(false)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setMessage({ 
          type: 'error', 
          text: errorData.error || 'Failed to update profile. Please try again.' 
        })
      }
    } catch (error: any) {
      console.error('Error saving profile:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setMessage({ 
          type: 'error', 
          text: 'Network error. Please check your connection and try again.' 
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Failed to update profile. Please try again.' 
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Handle copy to clipboard
  const handleCopyLink = async () => {
    setCopyMessage(null)
    const result = await copyToClipboard(formData.bookingUrl)
    
    if (result.success) {
      setCopyMessage({ type: 'success', text: 'Copied to clipboard!' })
    } else {
      setCopyMessage({ 
        type: 'error', 
        text: 'Failed to copy. Please select and copy manually.' 
      })
    }

    // Clear copy message after 3 seconds
    setTimeout(() => setCopyMessage(null), 3000)
  }

  // Handle test link
  const handleTestLink = () => {
    openBookingLink(formData.bookingUrl)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-surface rounded-card shadow-raised p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-surface-sunken rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-surface-sunken rounded w-1/2"></div>
            <div className="h-10 bg-surface-sunken rounded"></div>
            <div className="h-10 bg-surface-sunken rounded"></div>
            <div className="h-10 bg-surface-sunken rounded"></div>
          </div>
        </div>
        <p className="mt-4 text-fg-muted">Loading agency profile...</p>
      </div>
    )
  }

  // Permission denied state
  if (isLoaded && isSignedIn && !hasPermission) {
    return (
      <div className="bg-surface rounded-card shadow-raised p-6">
        <div className="text-center py-8">
          <p className="text-fg-muted">
            You do not have permission to access agency settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-card shadow-raised p-6">
      <div className="mb-6">
        <h2 className="mb-1 font-display text-heading font-semibold text-fg">
          Your business
        </h2>
        <p className="text-fg-muted">
          Your name and contact details, shown to customers on your booking page and emails.
        </p>
      </div>

      {/* Booking Link Section */}
      <div 
        className="mb-8 p-4 bg-notice-soft border border-notice/30 rounded-card"
        data-testid="booking-link-section"
      >
        <h3 className="font-semibold text-notice mb-2">Your Booking Link</h3>
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <p className="text-notice font-mono text-fine break-all">
              {formData.bookingUrl}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 h-11 text-fine font-medium text-notice bg-surface border border-notice/30 rounded-control hover:bg-notice-soft focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
            >
              Copy Link
            </button>
            <button
              type="button"
              onClick={handleTestLink}
              className="px-4 py-2 h-11 text-fine font-medium bg-action text-on-action border border-transparent rounded-control hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
            >
              Test Link
            </button>
          </div>
        </div>
        {copyMessage && (
          <p className={cn(
            "mt-2 text-fine",
            copyMessage.type === 'success' ? 'text-positive' : 'text-danger'
          )}>
            {copyMessage.text}
          </p>
        )}
      </div>

      {/* Dirty State Warning */}
      {isDirty && (
        <div className="mb-6 p-3 bg-caution-soft border border-caution/30 rounded-card">
          <p className="text-caution text-fine">
            You have unsaved changes
          </p>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} data-testid="agency-profile-form">
        <div className="flex flex-col space-y-6">
          {/* Agency Name */}
          <div>
            <label 
              htmlFor="agencyName" 
              className="block text-fine font-medium text-fg mb-1"
            >
              Agency Name
            </label>
            <input
              type="text"
              id="agencyName"
              aria-describedby="agencyName-error"
              value={formData.agencyName}
              onChange={(e) => handleInputChange('agencyName', e.target.value)}
              className="w-full px-3 py-2 border border-line-strong rounded-control focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent"
              placeholder="Enter your agency name"
            />
            {errors.agencyName && (
              <p 
                id="agencyName-error"
                role="alert" 
                className="mt-1 text-fine text-danger"
              >
                {errors.agencyName[0]}
              </p>
            )}
          </div>

          {/* Agency Website */}
          <div>
            <label 
              htmlFor="agencyWebsite" 
              className="block text-fine font-medium text-fg mb-1"
            >
              Agency Website
            </label>
            <input
              type="url"
              id="agencyWebsite"
              aria-describedby="agencyWebsite-error"
              value={formData.agencyWebsite || ''}
              onChange={(e) => handleInputChange('agencyWebsite', e.target.value)}
              className="w-full px-3 py-2 border border-line-strong rounded-control focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent"
              placeholder="https://www.yourwebsite.com (optional)"
            />
            <p className="mt-1 text-fine text-fg-muted">
              Your agency website where customers will be directed after completing their booking
            </p>
            {errors.agencyWebsite && (
              <p 
                id="agencyWebsite-error"
                role="alert" 
                className="mt-1 text-fine text-danger"
              >
                {errors.agencyWebsite[0]}
              </p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label 
              htmlFor="contactEmail" 
              className="block text-fine font-medium text-fg mb-1"
            >
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              aria-describedby="contactEmail-error"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              className="w-full px-3 py-2 border border-line-strong rounded-control focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent"
              placeholder="Enter your contact email"
            />
            {errors.contactEmail && (
              <p 
                id="contactEmail-error"
                role="alert" 
                className="mt-1 text-fine text-danger"
              >
                {errors.contactEmail[0]}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label 
              htmlFor="phone" 
              className="block text-fine font-medium text-fg mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              aria-describedby="phone-error"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-line-strong rounded-control focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent"
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p 
                id="phone-error"
                role="alert" 
                className="mt-1 text-fine text-danger"
              >
                {errors.phone[0]}
              </p>
            )}
          </div>

          {/* Address Section */}
          <div>
            <h3 className="mb-4 font-display text-lead font-semibold text-fg">Address</h3>
            <div className="grid gap-4 md:grid-cols-2" data-testid="address-grid">
              {/* Street Address - Full width */}
              <div className="md:col-span-2">
                <label 
                  htmlFor="street" 
                  className="block text-fine font-medium text-fg mb-1"
                >
                  Street Address
                </label>
                <input
                  type="text"
                  id="street"
                  aria-describedby="street-error"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className="w-full px-3 py-2 border border-line-strong rounded-control focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent"
                  placeholder="Enter street address"
                />
                {errors.address?.street && (
                  <p 
                    id="street-error"
                    role="alert" 
                    className="mt-1 text-fine text-danger"
                  >
                    {errors.address.street[0]}
                  </p>
                )}
              </div>

              {/* City */}
              <div>
                <label 
                  htmlFor="city" 
                  className="block text-fine font-medium text-fg mb-1"
                >
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  aria-describedby="city-error"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className="w-full px-3 py-2 border border-line-strong rounded-control focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent"
                  placeholder="Enter city"
                />
                {errors.address?.city && (
                  <p 
                    id="city-error"
                    role="alert" 
                    className="mt-1 text-fine text-danger"
                  >
                    {errors.address.city[0]}
                  </p>
                )}
              </div>

              {/* State */}
              <div>
                <label 
                  htmlFor="state" 
                  className="block text-fine font-medium text-fg mb-1"
                >
                  State/Province
                </label>
                <input
                  type="text"
                  id="state"
                  aria-describedby="state-error"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className="w-full px-3 py-2 border border-line-strong rounded-control focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent"
                  placeholder="Enter state or province"
                />
                {errors.address?.state && (
                  <p 
                    id="state-error"
                    role="alert" 
                    className="mt-1 text-fine text-danger"
                  >
                    {errors.address.state[0]}
                  </p>
                )}
              </div>

              {/* Postal Code */}
              <div>
                <label 
                  htmlFor="postalCode" 
                  className="block text-fine font-medium text-fg mb-1"
                >
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  aria-describedby="postalCode-error"
                  value={formData.address.postalCode}
                  onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-line-strong rounded-control focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent"
                  placeholder="Enter postal code"
                />
                {errors.address?.postalCode && (
                  <p 
                    id="postalCode-error"
                    role="alert" 
                    className="mt-1 text-fine text-danger"
                  >
                    {errors.address.postalCode[0]}
                  </p>
                )}
              </div>

              {/* Country */}
              <div>
                <label 
                  htmlFor="country" 
                  className="block text-fine font-medium text-fg mb-1"
                >
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  aria-describedby="country-error"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  className="w-full px-3 py-2 border border-line-strong rounded-control focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent"
                  placeholder="Enter country"
                />
                {errors.address?.country && (
                  <p 
                    id="country-error"
                    role="alert" 
                    className="mt-1 text-fine text-danger"
                  >
                    {errors.address.country[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-line">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 h-11 text-fine font-medium bg-action text-on-action border border-transparent rounded-control hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}