import { z } from 'zod';

// Contact Information Step
export const contactSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(
    /^[\+]?[(]?[\d\s\-\(\)]{10,}$/,
    'Please enter a valid phone number'
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
  holdId: z.string().optional(),
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

export type ContactFormData = z.infer<typeof contactSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type DisplayFormData = z.infer<typeof displaySchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type BookingFormData = z.infer<typeof bookingFormSchema>;

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
  formData: Partial<BookingFormData>;
  updateFormData: (stepData: Partial<BookingFormData>) => void;
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

// Sign and inventory types
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