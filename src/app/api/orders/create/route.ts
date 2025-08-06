import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase-client';
import { BookingOrderResult } from '@/features/booking/types';
import { z } from 'zod';

// Relaxed input validation schema - only validate essential fields
const createOrderInputSchema = z.object({
  formData: z.object({
    contact: z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10),
    }),
    event: z.object({
      eventDate: z.string(), // Accept as string, convert manually
      deliveryAddress: z.object({
        street: z.string().min(5),
        city: z.string().min(2),
        state: z.string().length(2),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      }).optional(), // Make optional to allow minimal data
      timeWindow: z.enum(['morning', 'afternoon', 'evening']).optional(),
      deliveryNotes: z.string().optional(),
    }),
    display: z.object({
      eventMessage: z.string().min(1).optional(),
      customMessage: z.string().optional(),
      eventNumber: z.number().positive().optional(),
      messageStyle: z.string().min(1).optional(),
      recipientName: z.string().min(1).optional(),
      nameStyle: z.string().min(1).optional(),
      characterTheme: z.string().optional(),
      hobbies: z.array(z.string()).optional(),
      extraDaysBefore: z.number().min(0).max(7).default(0),
      extraDaysAfter: z.number().min(0).max(7).default(0),
      previewUrl: z.string().optional(),
      holdId: z.string().min(1),
    }).optional(), // Make entire display section optional for minimal testing
    payment: z.object({
      paymentMethod: z.enum(['card', 'apple_pay', 'paypal', 'venmo']).optional(),
      paymentMethodId: z.string().optional(),
      billingAddress: z.object({
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      }).optional(),
    }).optional(),
  }),
  holdId: z.string().min(1, 'Hold ID is required'),
  paymentIntentId: z.string().min(1, 'Payment Intent ID is required'),
  agencyId: z.string().min(1, 'Agency ID is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
});

export async function POST(request: NextRequest): Promise<NextResponse<BookingOrderResult>> {
  try {
    console.log('🚀 Creating new booking order...');
    
    // Parse and validate request body
    const body = await request.json();
    console.log('📝 Received order data:', {
      hasFormData: !!body.formData,
      holdId: body.holdId,
      paymentIntentId: body.paymentIntentId,
      agencyId: body.agencyId,
      totalAmount: body.totalAmount,
      eventDateType: typeof body.formData?.event?.eventDate,
      eventDateValue: body.formData?.event?.eventDate,
      fullFormData: JSON.stringify(body.formData, null, 2)
    });

    console.log('🔍 About to validate with createOrderInputSchema...');
    console.log('🔍 Schema expects eventDate as string, received:', typeof body.formData?.event?.eventDate);
    
    const validationResult = createOrderInputSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error.errors);
      console.error('❌ Detailed validation errors:', JSON.stringify(validationResult.error.issues, null, 2));
      return NextResponse.json({
        success: false,
        error: 'Invalid order data: ' + validationResult.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const { formData, holdId, paymentIntentId, agencyId, totalAmount } = validationResult.data;

    // Convert eventDate string to Date object manually
    const eventDate = new Date(formData.event.eventDate);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid event date format'
      }, { status: 400 });
    }

    // Validate date is at least 48 hours from now  
    const now = new Date();
    const minDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    if (eventDate < minDate) {
      return NextResponse.json({
        success: false,
        error: 'Event date must be at least 48 hours from now'
      }, { status: 400 });
    }

    // Generate order number (format: YCE-YYYY-NNNNNN)
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(Math.random() * 900000) + 100000; // 6-digit number
    const orderNumber = `YCE-${year}-${randomNumber}`;
    
    // Generate confirmation code (8 characters)
    const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    console.log('🔢 Generated order number:', orderNumber);
    console.log('🎫 Generated confirmation code:', confirmationCode);

    // Create order record in database (ultra-minimal for schema compatibility)
    const orderData = {
      orderNumber,
      agencyId,
      status: 'pending',
      totalAmount,
      
      // Customer information (essential)
      customerName: formData.contact.fullName,
      customerEmail: formData.contact.email,
      customerPhone: formData.contact.phone,
      
      // Event details (essential)
      eventDate: eventDate.toISOString(),
      
      // Store confirmation code in a safe way or skip if column doesn't exist
      // confirmationCode will be returned in response but not stored if column missing
    };

    console.log('💾 Inserting order into database...');
    const { data: orderRecord, error: insertError } = await supabase
      .from('orders')
      .insert([orderData])
      .select('id, orderNumber')
      .single();

    if (insertError) {
      console.error('❌ Database insert failed:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create order: ' + insertError.message
      }, { status: 500 });
    }

    console.log('✅ Order created successfully:', orderRecord?.id);

    // TODO: Convert soft hold to hard hold (inventory management)
    // TODO: Send confirmation email
    // TODO: Create calendar event for delivery
    // TODO: Notify agency of new order

    return NextResponse.json({
      success: true,
      orderId: orderRecord.id,
      orderNumber: orderRecord.orderNumber,
      confirmationCode: confirmationCode // Use generated code since it may not be stored in DB
    });

  } catch (error) {
    console.error('❌ Unexpected error creating order:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while creating your order'
    }, { status: 500 });
  }
}