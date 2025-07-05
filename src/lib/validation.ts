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
    .refine(slug => !['www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost', 'staging', 'dev', 'test'].includes(slug), 'This subdomain is reserved'),

  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional(),
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