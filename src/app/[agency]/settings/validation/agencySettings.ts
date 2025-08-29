import { z } from 'zod'

// Time validation regex (24-hour format HH:MM)
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/

// Color validation regex (hex color format)
const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

// Operating hours schema for each day
export const dayHoursSchema = z.object({
  open: z
    .string()
    .regex(timeRegex, 'Invalid time format (use HH:MM)')
    .optional(),
  close: z
    .string()
    .regex(timeRegex, 'Invalid time format (use HH:MM)')
    .optional(),
  isOpen: z.boolean(),
}).refine((data) => {
  if (data.isOpen && (!data.open || !data.close)) {
    return false
  }
  if (data.isOpen && data.open && data.close) {
    const [openHour, openMin] = data.open.split(':').map(Number)
    const [closeHour, closeMin] = data.close.split(':').map(Number)
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin
    return closeTime > openTime
  }
  return true
}, {
  message: 'Opening time must be before closing time, and both are required when open'
})

// Operating hours schema
export const operatingHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
  timeZone: z
    .string()
    .min(1, 'Time zone is required')
    .default('America/New_York'),
})

// Delivery window schema
export const deliveryWindowSchema = z.object({
  start: z.string().regex(timeRegex, 'Invalid time format (use HH:MM)'),
  end: z.string().regex(timeRegex, 'Invalid time format (use HH:MM)'),
  enabled: z.boolean(),
}).refine((data) => {
  if (data.enabled) {
    const [startHour, startMin] = data.start.split(':').map(Number)
    const [endHour, endMin] = data.end.split(':').map(Number)
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin
    return endTime > startTime
  }
  return true
}, {
  message: 'End time must be after start time'
})

// Delivery windows schema
export const deliveryWindowsSchema = z.object({
  morningWindow: deliveryWindowSchema,
  afternoonWindow: deliveryWindowSchema,
  eveningWindow: deliveryWindowSchema,
  customWindows: z.array(z.object({
    name: z.string().min(1, 'Window name is required').max(50, 'Window name too long'),
    start: z.string().regex(timeRegex, 'Invalid time format (use HH:MM)'),
    end: z.string().regex(timeRegex, 'Invalid time format (use HH:MM)'),
  })).default([]),
})

// Blackout date schema
export const blackoutDateSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  date: z.string().refine((date) => {
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate >= today
  }, {
    message: 'Date cannot be in the past'
  }),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title too long'),
  reason: z
    .string()
    .max(500, 'Reason too long')
    .optional(),
  type: z.enum(['holiday', 'maintenance', 'vacation', 'special_event']),
  recurring: z.boolean().default(false),
  recurringPattern: z.object({
    frequency: z.enum(['yearly', 'monthly', 'weekly']),
    interval: z.number().min(1, 'Interval must be at least 1').max(12, 'Interval too large'),
  }).optional(),
})

// Booking rules schema
export const bookingRulesSchema = z.object({
  minimumLeadTimeHours: z
    .number()
    .min(0, 'Lead time cannot be negative')
    .max(168, 'Lead time cannot exceed 1 week (168 hours)'),
  maximumRentalDays: z
    .number()
    .min(1, 'Maximum rental must be at least 1 day')
    .max(30, 'Maximum rental cannot exceed 30 days'),
  minimumRentalDays: z
    .number()
    .min(1, 'Minimum rental must be at least 1 day')
    .max(7, 'Minimum rental cannot exceed 7 days'),
  allowSameDayBooking: z.boolean(),
}).refine((data) => {
  return data.maximumRentalDays >= data.minimumRentalDays
}, {
  message: 'Maximum rental days must be greater than or equal to minimum rental days'
})

// Service area schema
export const serviceAreaSchema = z.object({
  baseServiceRadius: z
    .number()
    .min(0, 'Service radius cannot be negative')
    .max(100, 'Service radius cannot exceed 100 miles'),
  travelFee: z.object({
    freeRadius: z
      .number()
      .min(0, 'Free radius cannot be negative')
      .max(50, 'Free radius cannot exceed 50 miles'),
    feePerMile: z
      .number()
      .min(0, 'Fee per mile cannot be negative')
      .max(10, 'Fee per mile cannot exceed $10'),
  }),
  deliveryZones: z.array(z.object({
    name: z.string().min(1, 'Zone name is required'),
    boundaries: z.string(), // Could be geo coordinates or area descriptions
    additionalFee: z.number().min(0, 'Additional fee cannot be negative'),
  })).default([]),
})

// Customer experience schema
export const customerExperienceSchema = z.object({
  branding: z.object({
    welcomeMessage: z
      .string()
      .max(500, 'Welcome message too long')
      .optional(),
    primaryColor: z
      .string()
      .regex(colorRegex, 'Invalid color format (use #RRGGBB or #RGB)')
      .default('#3B82F6'),
    secondaryColor: z
      .string()
      .regex(colorRegex, 'Invalid color format (use #RRGGBB or #RGB)')
      .default('#1E40AF'),
    logoUrl: z.string().url('Invalid logo URL').optional(),
    backgroundImageUrl: z.string().url('Invalid background image URL').optional(),
  }),
  customContent: z.object({
    termsAndConditions: z.string().optional(),
    privacyPolicyUrl: z.string().url('Invalid privacy policy URL').optional(),
    additionalInfo: z.string().max(1000, 'Additional info too long').optional(),
    supportEmail: z
      .string()
      .email('Invalid support email format')
      .min(1, 'Support email is required'),
    supportPhone: z
      .string()
      .min(1, 'Support phone is required')
      .regex(/^(\+?1[-.\\s]?)?\(?([0-9]{3})\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})$/, 'Invalid phone format'),
  }),
})

// Notification settings schema
export const notificationSettingsSchema = z.object({
  sendBookingConfirmation: z.boolean().default(true),
  sendReminders: z.boolean().default(true),
  reminderDaysBefore: z
    .array(z.number().min(0).max(14))
    .default([3, 1])
    .refine((days) => days.length > 0, 'At least one reminder day is required'),
  sendDeploymentNotification: z.boolean().default(true),
  sendPickupReminder: z.boolean().default(true),
  allowSMSNotifications: z.boolean().default(false),
})

// Complete agency settings schema
export const agencySettingsSchema = z.object({
  operatingHours: operatingHoursSchema,
  deliveryWindows: deliveryWindowsSchema,
  bookingRules: bookingRulesSchema,
  blackoutDates: z.array(blackoutDateSchema).default([]),
  serviceArea: serviceAreaSchema,
  customerExperience: customerExperienceSchema,
  notifications: notificationSettingsSchema,
})

// Type exports
export type DayHours = z.infer<typeof dayHoursSchema>
export type OperatingHours = z.infer<typeof operatingHoursSchema>
export type DeliveryWindow = z.infer<typeof deliveryWindowSchema>
export type DeliveryWindows = z.infer<typeof deliveryWindowsSchema>
export type BlackoutDate = z.infer<typeof blackoutDateSchema>
export type BookingRules = z.infer<typeof bookingRulesSchema>
export type ServiceArea = z.infer<typeof serviceAreaSchema>
export type CustomerExperience = z.infer<typeof customerExperienceSchema>
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>
export type AgencySettings = z.infer<typeof agencySettingsSchema>

// Form data type for internal state management
export interface AgencySettingsFormData {
  operatingHours: OperatingHours
  deliveryWindows: DeliveryWindows
  bookingRules: BookingRules
  blackoutDates: BlackoutDate[]
  serviceArea: ServiceArea
  customerExperience: CustomerExperience
  notifications: NotificationSettings
}

// Validation error types
export interface AgencySettingsValidationErrors {
  operatingHours?: {
    [key: string]: string[]
  }
  deliveryWindows?: {
    [key: string]: string[]
  }
  bookingRules?: {
    [key: string]: string[]
  }
  blackoutDates?: {
    [index: number]: {
      [key: string]: string[]
    }
  }
  serviceArea?: {
    [key: string]: string[]
  }
  customerExperience?: {
    [key: string]: string[]
  }
  notifications?: {
    [key: string]: string[]
  }
}

// API response types
export interface AgencySettingsResponse {
  success: boolean
  data?: AgencySettings
  error?: string
}

export interface UpdateAgencySettingsResponse {
  success: boolean
  error?: string
  details?: Array<{ field: string; message: string }>
}

// Default settings for new agencies
export const defaultAgencySettings: AgencySettings = {
  operatingHours: {
    monday: { open: '09:00', close: '17:00', isOpen: true },
    tuesday: { open: '09:00', close: '17:00', isOpen: true },
    wednesday: { open: '09:00', close: '17:00', isOpen: true },
    thursday: { open: '09:00', close: '17:00', isOpen: true },
    friday: { open: '09:00', close: '17:00', isOpen: true },
    saturday: { open: '10:00', close: '16:00', isOpen: true },
    sunday: { open: '12:00', close: '16:00', isOpen: false },
    timeZone: 'America/New_York'
  },
  deliveryWindows: {
    morningWindow: { start: '08:00', end: '12:00', enabled: true },
    afternoonWindow: { start: '12:00', end: '17:00', enabled: true },
    eveningWindow: { start: '17:00', end: '20:00', enabled: true },
    customWindows: []
  },
  bookingRules: {
    minimumLeadTimeHours: 48,
    maximumRentalDays: 14,
    minimumRentalDays: 1,
    allowSameDayBooking: false
  },
  blackoutDates: [],
  serviceArea: {
    baseServiceRadius: 25,
    travelFee: {
      freeRadius: 10,
      feePerMile: 2.50
    },
    deliveryZones: []
  },
  customerExperience: {
    branding: {
      welcomeMessage: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF'
    },
    customContent: {
      supportEmail: '',
      supportPhone: ''
    }
  },
  notifications: {
    sendBookingConfirmation: true,
    sendReminders: true,
    reminderDaysBefore: [3, 1],
    sendDeploymentNotification: true,
    sendPickupReminder: true,
    allowSMSNotifications: false
  }
}

// Utility functions
export const formatTimeForDisplay = (time: string): string => {
  const [hour, minute] = time.split(':')
  const hourNum = parseInt(hour, 10)
  const ampm = hourNum >= 12 ? 'PM' : 'AM'
  const displayHour = hourNum % 12 || 12
  return `${displayHour}:${minute} ${ampm}`
}

export const calculateBusinessHours = (operatingHours: OperatingHours): string => {
  const openDays = Object.entries(operatingHours)
    .filter(([day, hours]) => day !== 'timeZone' && (hours as DayHours).isOpen)
    .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
  
  if (openDays.length === 0) return 'Closed'
  if (openDays.length === 7) return 'Open 7 days a week'
  
  return `Open ${openDays.join(', ')}`
}