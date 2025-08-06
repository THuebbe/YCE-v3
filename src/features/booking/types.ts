import { z } from 'zod';

// Contact Information Step
export const contactSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number').refine(
    (phone) => {
      // Check for exactly 10 digits in (###) ###-#### format
      const digits = phone.replace(/\D/g, '');
      return digits.length === 10;
    },
    'Please enter a valid 10-digit phone number'
  ),
});

// Event Details Step
export const eventSchema = z.object({
  eventDate: z.date().refine(
    (date) => {
      const now = new Date();
      const minDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
      return date >= minDate;
    },
    'Event date must be at least 48 hours from now'
  ),
  deliveryAddress: z.object({
    street: z.string().min(5, 'Please enter a complete street address'),
    city: z.string().min(2, 'City is required'),
    state: z.string().length(2, 'State must be 2 letters'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  }),
  timeWindow: z.enum(['morning', 'afternoon', 'evening'], {
    required_error: 'Please select a preferred time window',
  }),
  deliveryNotes: z.string().optional(),
});

// Display Customization Step
export const displaySchema = z.object({
  eventMessage: z.string().min(1, 'Please select an event message'),
  customMessage: z.string().optional(),
  eventNumber: z.number().positive().optional(),
  messageStyle: z.string().min(1, 'Please select a message style'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  nameStyle: z.string().min(1, 'Please select a name style'),
  characterTheme: z.string().optional(),
  hobbies: z.array(z.string()).optional(),
  extraDaysBefore: z.number().min(0).max(7).default(0),
  extraDaysAfter: z.number().min(0).max(7).default(0),
  previewUrl: z.string().optional(),
  holdId: z.string().min(1, 'Please generate your display layout first'),
});

// Payment Step
export const paymentSchema = z.object({
  paymentMethod: z.enum(['card', 'apple_pay', 'paypal', 'venmo'], {
    required_error: 'Please select a payment method',
  }),
  paymentMethodId: z.string().optional(),
  billingAddress: z.object({
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  }).optional(),
});

// Complete form data
export const bookingFormSchema = z.object({
  contact: contactSchema,
  event: eventSchema,
  display: displaySchema,
  payment: paymentSchema,
});

// Extended form data with order result (for confirmation step)
export const extendedBookingFormSchema = bookingFormSchema.extend({
  orderResult: z.object({
    orderId: z.string(),
    orderNumber: z.string(),
    confirmationCode: z.string(),
  }).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type DisplayFormData = z.infer<typeof displaySchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type ExtendedBookingFormData = z.infer<typeof extendedBookingFormSchema>;

// Wizard state types
export interface WizardStep {
  id: number;
  name: string;
  title: string;
  description?: string;
  component: React.ComponentType<any>;
  validation: z.ZodSchema<any> | null;
}

export interface WizardContextType {
  currentStep: number;
  totalSteps: number;
  furthestStep: number;
  formData: Partial<ExtendedBookingFormData>;
  updateFormData: (stepData: Partial<ExtendedBookingFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

// Preview generation types
export interface PreviewInput {
  message: string;
  theme?: string;
  layoutPreference?: LayoutStyle;
  recipientName?: string;
  eventNumber?: number;
}

export interface PreviewResult {
  success: boolean;
  previewUrl?: string;
  holdId?: string;
  signs?: Sign[];
  alternatives?: PreviewAlternative[];
  error?: string;
}

export interface PreviewAlternative {
  type: 'shorter_message' | 'different_theme' | 'different_style';
  suggestion: string;
  previewUrl?: string;
}

export type LayoutStyle = 'compact' | 'spread' | 'centered' | 'auto';
export type TimeWindow = 'morning' | 'afternoon' | 'evening';

// Zone-specific sign types for 5-zone display system
export type SignZone = 'zone1' | 'zone2' | 'zone3' | 'zone4' | 'zone5';
export type SignType = 'letter' | 'number' | 'ordinal' | 'decoration' | 'backdrop' | 'bookend';

// 5-Zone Display System Types
export interface DisplayZone {
  zone: SignZone;
  signs: ZoneSign[];
  totalWidth: number;
  fillPercentage?: number; // Only applicable to Zone 3
}

export interface ZoneSign {
  signId: string;
  zone: SignZone;
  type: SignType;
  position: number; // Order within the zone
  character?: string; // For letters/numbers
  isOrdinal?: boolean; // For ordinal indicators (st, nd, rd, th)
  style: SignStyle;
}

export interface SignStyle {
  // Development styling (colored shapes)
  dev?: {
    backgroundColor?: string;
    borderRadius?: string;
    width?: string;
    height?: string;
  };
  // Production styling (actual sign images)
  prod?: {
    imageUrl?: string;
    width?: string;
    height?: string;
  };
}

export interface LayoutCalculation {
  zone1: DisplayZone; // Event message + numbers
  zone2: DisplayZone; // Recipient name(s)
  zone3: DisplayZone; // Decorative fill (left/right sides)
  zone4: DisplayZone; // Backdrop elements
  zone5: DisplayZone; // Bookend signs
  totalWidth: number;
  gridColumns: number;
  meetsMinimumFill: boolean;
}

// Enhanced sign interface with zone information
export interface Sign {
  id: string;
  name: string;
  category: string;
  theme?: string;
  dimensions: {
    width: number;
    height: number;
  };
  imageUrl: string;
  isBundle?: boolean;
  bundleContents?: string[];
  keywords: string[];
  available: boolean;
  totalQuantity: number;
  availableQuantity: number;
  agencyId?: string; // For agency-specific signs
  isPlatformSign: boolean;
  // Zone-specific properties
  zone: SignZone;
  type: SignType;
  character?: string; // For letters/numbers (A-Z, 0-9)
  isOrdinal?: boolean; // For ordinal indicators
  style: SignStyle;
}

export interface InventoryHold {
  id: string;
  sessionId: string;
  agencyId: string;
  signAllocations: SignAllocation[];
  expiresAt: Date;
  createdAt: Date;
  status: 'active' | 'expired' | 'converted';
  customerId?: string;
  orderId?: string;
}

export interface SignAllocation {
  signId: string;
  quantity: number;
  holdType: 'soft' | 'hard';
}

export interface InventoryAvailability {
  signId: string;
  available: boolean;
  availableQuantity: number;
  maxQuantity: number;
  reasons?: string[];
}

export interface BulkAvailabilityResult {
  success: boolean;
  availability: InventoryAvailability[];
  alternatives?: Sign[];
  totalSigns: number;
  totalWidth: number;
  fillPercentage: number;
  meetsMinimumFill: boolean;
}

export interface SignSelectionCriteria {
  message: string;
  theme?: string;
  style?: string;
  hobbies?: string[];
  eventType?: string;
  agencyId: string;
  maxSigns?: number;
  preferredWidth?: number;
}

// Order creation types
export interface CreateBookingOrderInput {
  formData: BookingFormData;
  holdId: string;
  paymentIntentId: string;
  agencyId: string;
  totalAmount: number;
}

export interface BookingOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  confirmationCode?: string;
  error?: string;
}

// Pricing calculation
export interface PricingBreakdown {
  basePackage: number;
  extraDaysBefore: number;
  extraDaysAfter: number;
  extraDaysTotal: number;
  subtotal: number;
  platformFee: number;
  total: number;
}

// Agency booking site configuration
export interface AgencyBookingConfig {
  agencyId: string;
  agencyName: string;
  subdomain: string;
  isActive: boolean;
  customBranding?: {
    logoUrl?: string;
    primaryColor?: string;
    backgroundImage?: string;
  };
  basePrice: number;
  extraDayPrice: number;
  availableThemes: string[];
  availableSignStyles: string[];
}