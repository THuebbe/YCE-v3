import { z } from 'zod'

// Payment method options
export const paymentMethodSchema = z.enum(['stripe_connect', 'yce_processing'])

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
    
  lateFee: z
    .number()
    .min(0, 'Late fee cannot be negative')
    .max(1000, 'Late fee cannot exceed $1,000'),
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
  subscriptionInfo: subscriptionInfoSchema.optional(),
})

// Type exports
export type PaymentMethod = z.infer<typeof paymentMethodSchema>
export type PricingConfig = z.infer<typeof pricingConfigSchema>
export type YCEPaymentConfig = z.infer<typeof ycePaymentConfigSchema>
export type StripeConnectStatus = z.infer<typeof stripeConnectStatusSchema>
export type SubscriptionInfo = z.infer<typeof subscriptionInfoSchema>
export type FinancialManagementData = z.infer<typeof financialManagementSchema>

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