import { z } from 'zod'

// Phone number validation regex - supports various formats
const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/

// Website/domain validation regex - flexible format allowing https://, www., subdomains
const websiteRegex = /^(https?:\/\/)?([\w-]+\.)*[\w-]+\.[a-zA-Z]{2,}(\/.*)?$/

// Agency Profile validation schema based on test requirements
export const agencyProfileSchema = z.object({
  agencyName: z
    .string()
    .min(1, 'Agency name is required')
    .min(2, 'Agency name must be at least 2 characters')
    .max(100, 'Agency name must be less than 100 characters'),
    
  agencyWebsite: z
    .string()
    .optional()
    .refine((val) => !val || websiteRegex.test(val), 'Please enter a valid website URL'),
    
  contactEmail: z
    .string()
    .min(1, 'Contact email is required')
    .email('Please enter a valid email address'),
    
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Please enter a valid phone number'),
    
  address: z.object({
    street: z
      .string()
      .min(1, 'Street address is required'),
      
    city: z
      .string()
      .min(1, 'City is required'),
      
    state: z
      .string()
      .min(1, 'State is required'),
      
    postalCode: z
      .string()
      .min(1, 'Postal code is required'),
      
    country: z
      .string()
      .min(1, 'Country is required'),
  }),
  
  // These fields are read-only but included for completeness
  agencySlug: z.string(),
  bookingUrl: z.string(),
})

export type AgencyProfileData = z.infer<typeof agencyProfileSchema>

// Form data type for internal state management
export interface AgencyProfileFormData {
  agencyName: string
  agencyWebsite?: string
  contactEmail: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  agencySlug: string
  bookingUrl: string
}

// Validation error type
export interface ValidationErrors {
  agencyName?: string[]
  agencyWebsite?: string[]
  contactEmail?: string[]
  phone?: string[]
  address?: {
    street?: string[]
    city?: string[]
    state?: string[]
    postalCode?: string[]
    country?: string[]
  }
}

// API response types
export interface AgencyProfileResponse {
  success: boolean
  data?: AgencyProfileData
  error?: string
}

export interface UpdateAgencyProfileResponse {
  success: boolean
  error?: string
}