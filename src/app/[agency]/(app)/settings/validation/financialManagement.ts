import { z } from 'zod'
import { MAX_SALES_TAX_RATE } from '@/features/booking/pricing'

// Payment method options
export const paymentMethodSchema = z.enum(['stripe_connect', 'paypal_connect', 'yce_processing'])

// Pricing configuration validation schema
export const pricingConfigSchema = z.object({
  basePrice: z
    .number()
    .min(0.01, 'Base price must be greater than 0')
    .max(10000, 'Base price cannot exceed $10,000'),
    
  extraDayPrice: z
    .number()
    .min(0, 'Extra day price cannot be negative')
    .max(1000, 'Extra day price cannot exceed $1,000'),
    
  // Optional: the late fee is saved with the booking policies now
  lateFee: z
    .number()
    .min(0, 'Late fee cannot be negative')
    .max(1000, 'Late fee cannot exceed $1,000')
    .optional(),
})

// The agency's sales tax answer. rate 0 = "I don't charge sales tax".
export const salesTaxSchema = z.object({
  rate: z
    .number()
    .min(0, 'The rate can’t be negative')
    .max(MAX_SALES_TAX_RATE, `The rate can’t be over ${MAX_SALES_TAX_RATE}%`)
    .refine(n => Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-6, 'Use at most 3 decimals'),
  included: z.boolean(),
})

// YCE Payment Processing configuration
export const ycePaymentConfigSchema = z.object({
  enabled: z.boolean(),
  payoutSchedule: z.enum(['weekly', 'biweekly', 'monthly']),
  minimumPayoutAmount: z
    .number()
    .min(1, 'Minimum payout amount must be at least $1')
    .max(1000, 'Minimum payout amount cannot exceed $1,000'),
  bankAccountDetails: z.object({
    accountHolderName: z
      .string()
      .min(2, 'Account holder name must be at least 2 characters')
      .max(100, 'Account holder name cannot exceed 100 characters'),
    routingNumber: z
      .string()
      .regex(/^\d{9}$/, 'Routing number must be exactly 9 digits'),
    accountNumber: z
      .string()
      .min(4, 'Account number must be at least 4 digits')
      .max(17, 'Account number cannot exceed 17 digits')
      .regex(/^\d+$/, 'Account number must contain only digits'),
    accountType: z.enum(['checking', 'savings']),
  }).optional(),
})

// Stripe Connect status schema
export const stripeConnectStatusSchema = z.object({
  accountId: z.string().nullable(),
  isConnected: z.boolean(),
  hasCompletedOnboarding: z.boolean(),
  chargesEnabled: z.boolean(),
  payoutsEnabled: z.boolean(),
  detailsSubmitted: z.boolean(),
  currentlyDue: z.array(z.string()),
  eventuallyDue: z.array(z.string()),
  pastDue: z.array(z.string()),
  pendingVerification: z.array(z.string()),
})

// PayPal Connect status schema (Partner Referrals API structure)
export const paypalConnectStatusSchema = z.object({
  accountId: z.string().nullable(),
  isConnected: z.boolean(),
  hasCompletedOnboarding: z.boolean(),
  permissionsGranted: z.boolean(),
  emailConfirmed: z.boolean(),
  paymentsReceivable: z.boolean(),
  detailsSubmitted: z.boolean(),
  authCode: z.string().nullable(),
  sharedId: z.string().nullable(),
  lastSyncAt: z.string().datetime().nullable(),
  integrationData: z.record(z.any()).optional(),
})

// Subscription information schema
export const subscriptionInfoSchema = z.object({
  status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'unpaid']),
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  planName: z.string(),
  planPrice: z.number().min(0),
  billingInterval: z.enum(['month', 'year']),
  nextBillingDate: z.string().datetime(),
  paymentMethodType: z.string(),
  lastFourDigits: z.string().optional(),
})

// Complete financial management data schema
export const financialManagementSchema = z.object({
  paymentMethod: paymentMethodSchema,
  pricingConfig: pricingConfigSchema,
  ycePaymentConfig: ycePaymentConfigSchema.optional(),
  stripeConnectStatus: stripeConnectStatusSchema.optional(),
  paypalConnectStatus: paypalConnectStatusSchema.optional(),
  subscriptionInfo: subscriptionInfoSchema.optional(),
})

// Type exports
export type PaymentMethod = z.infer<typeof paymentMethodSchema>
export type PricingConfig = z.infer<typeof pricingConfigSchema>
export type YCEPaymentConfig = z.infer<typeof ycePaymentConfigSchema>
export type StripeConnectStatus = z.infer<typeof stripeConnectStatusSchema>
export type PayPalConnectStatus = z.infer<typeof paypalConnectStatusSchema>
export type SubscriptionInfo = z.infer<typeof subscriptionInfoSchema>
export type FinancialManagementData = z.infer<typeof financialManagementSchema>
export type PayPalPartnerReferralRequest = z.infer<typeof paypalPartnerReferralRequestSchema>
export type PayPalCallback = z.infer<typeof paypalCallbackSchema>
export type PayPalPollingConfig = z.infer<typeof paypalPollingConfigSchema>


// Form data type for internal state management
export interface FinancialManagementFormData {
  paymentMethod: PaymentMethod
  pricingConfig: PricingConfig
  ycePaymentConfig?: YCEPaymentConfig
}

// Validation error type
export interface FinancialValidationErrors {
  paymentMethod?: string[]
  pricingConfig?: {
    basePrice?: string[]
    extraDayPrice?: string[]
    lateFee?: string[]
    rushOrderFee?: string[]
    deliveryFee?: string[]
    salesTaxRate?: string[]
  }
  ycePaymentConfig?: {
    minimumPayoutAmount?: string[]
    bankAccountDetails?: {
      accountHolderName?: string[]
      routingNumber?: string[]
      accountNumber?: string[]
      accountType?: string[]
    }
  }
}

// PayPal Partner Referral request validation
export const paypalPartnerReferralRequestSchema = z.object({
  trackingId: z.string().min(1, 'Tracking ID is required'),
  returnUrl: z.string().url('Return URL must be a valid URL'),
  agencyId: z.string().uuid('Agency ID must be a valid UUID'),
})

// PayPal callback validation
export const paypalCallbackSchema = z.object({
  authCode: z.string().min(1, 'Auth code is required'),
  sharedId: z.string().min(1, 'Shared ID is required'),
})

// PayPal polling configuration
export const paypalPollingConfigSchema = z.object({
  enabled: z.boolean(),
  intervalMinutes: z.number().min(5).max(120), // Between 5 minutes and 2 hours
  maxRetries: z.number().min(1).max(10),
  backoffMultiplier: z.number().min(1).max(5),
})

// API response types
export interface FinancialManagementResponse {
  success: boolean
  data?: FinancialManagementData
  error?: string
}

export interface UpdateFinancialSettingsResponse {
  success: boolean
  error?: string
  details?: Array<{ field: string; message: string }>
}

export interface PayPalPartnerReferralResponse {
  success: boolean
  onboardingUrl?: string
  trackingId?: string
  accountId?: string
  message?: string
  error?: string
}

export interface PayPalCallbackResponse {
  success: boolean
  accountId?: string
  status?: PayPalConnectStatus
  error?: string
}

export interface PayPalPollingResponse {
  success: boolean
  polledCount: number
  updatedCount: number
  agencies?: Array<{ id: string; slug: string; accountId: string }>
  error?: string
}

// Service fee calculation utility
export const calculateServiceFee = (amount: number, percentage: number = 0.05): number => {
  return Math.round(amount * percentage * 100) / 100
}

// Payout calculation utility
export const calculateNetPayout = (grossAmount: number, serviceFeePercentage: number = 0.05): {
  grossAmount: number
  serviceFee: number
  netPayout: number
} => {
  const serviceFee = calculateServiceFee(grossAmount, serviceFeePercentage)
  const netPayout = grossAmount - serviceFee
  
  return {
    grossAmount,
    serviceFee,
    netPayout
  }
}