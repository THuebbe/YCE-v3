import { isAgencyTimeZone } from './time-zones'
import { z } from 'zod'

// Agency creation validation schema
export const createAgencySchema = z.object({
  name: z
    .string()
    .min(2, 'Agency name must be at least 2 characters')
    .max(50, 'Agency name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s&'-]+$/, 'Agency name contains invalid characters'),
  
  slug: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(30, 'Subdomain must be less than 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .regex(/^[a-z0-9]/, 'Subdomain must start with a letter or number')
    .regex(/[a-z0-9]$/, 'Subdomain must end with a letter or number')
    .refine(slug => !slug.includes('--'), 'Subdomain cannot contain consecutive hyphens')
    // Infrastructure names plus the app's own top-level routes (src/app/*):
    // /<slug>/... would collide with them
    .refine(slug => ![
      'www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost', 'staging', 'dev', 'test',
      'auth', 'maintenance', 'marketing', 'onboarding', 'pricing', 'routing', 'dashboard', 'not-found',
    ].includes(slug), 'This name is reserved'),

  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional(),

  phone: z
    .string()
    .refine(p => p.replace(/\D/g, '').length === 10, 'Please enter a 10-digit phone number'),

  // Optional; customers are sent back here after booking (PRODUCT.md onboarding)
  website: z
    .string()
    .trim()
    .max(200)
    .refine(w => w === '' || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(w), 'Website must start with http:// or https://')
    .optional(),

  // Informational only - never blocks a booking (PRODUCT.md)
  serviceAreas: z
    .array(z.object({
      city: z.string().trim().min(2, 'City is required').max(60),
      state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'State must be 2 letters'),
    }))
    .min(1, 'Add at least one city you serve')
    .max(20),

  timeZone: z
    .string()
    .refine(isAgencyTimeZone, 'Please choose your time zone'),

  basePrice: z.number({ required_error: 'Enter your base price', invalid_type_error: 'Enter your base price' }).positive('Base price must be more than $0').max(10000),
  extraDayPrice: z.number({ required_error: 'Enter your extra-day price (0 if you don\'t charge for extra days)', invalid_type_error: 'Enter your extra-day price' }).min(0, 'Extra-day price cannot be negative').max(1000, 'Extra-day price cannot exceed $1,000'),
})

export type CreateAgencyInput = z.infer<typeof createAgencySchema>

// Subdomain availability check schema
export const checkSubdomainSchema = z.object({
  slug: z.string().min(1, 'Subdomain is required')
})

export type CheckSubdomainInput = z.infer<typeof checkSubdomainSchema>

// Response types
export interface SubdomainCheckResult {
  available: boolean
  message: string
}

export interface CreateAgencyResult {
  success: boolean
  agency?: {
    id: string
    name: string
    slug: string
  }
  error?: string
}