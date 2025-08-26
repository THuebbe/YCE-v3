import { NextRequest, NextResponse } from "next/server";
import { supabase, getAgencyBySlug } from "@/lib/db/supabase-client";
import { BookingOrderResult } from "@/features/booking/types";
import { sendOrderNotificationEmail } from "@/lib/email";
import { z } from "zod";

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
			deliveryAddress: z
				.object({
					street: z.string().min(5),
					city: z.string().min(2),
					state: z.string().length(2),
					zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
				})
				.optional(), // Make optional to allow minimal data
			timeWindow: z.enum(["morning", "afternoon", "evening"]).optional(),
			deliveryNotes: z.string().optional(),
		}),
		display: z
			.object({
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
			})
			.optional(), // Make entire display section optional for minimal testing
		payment: z
			.object({
				paymentMethod: z
					.enum(["card", "apple_pay", "paypal", "venmo"])
					.optional(),
				paymentMethodId: z.string().optional(),
				billingAddress: z
					.object({
						zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
					})
					.optional(),
			})
			.optional(),
	}),
	holdId: z.string().min(1, "Hold ID is required"),
	paymentIntentId: z.string().min(1, "Payment Intent ID is required"),
	agencyId: z.string().min(1, "Agency ID is required"),
	totalAmount: z.number().positive("Total amount must be positive"),
});

export async function POST(
	request: NextRequest
): Promise<NextResponse<BookingOrderResult>> {
	try {
		console.log("🚀 Creating new booking order...");

		// Parse and validate request body
		const body = await request.json();
		console.log("📝 Received order data:", {
			hasFormData: !!body.formData,
			holdId: body.holdId,
			paymentIntentId: body.paymentIntentId,
			agencyId: body.agencyId,
			totalAmount: body.totalAmount,
			eventDateType: typeof body.formData?.event?.eventDate,
			eventDateValue: body.formData?.event?.eventDate,
			fullFormData: JSON.stringify(body.formData, null, 2),
		});

		console.log("🔍 About to validate with createOrderInputSchema...");
		console.log(
			"🔍 Schema expects eventDate as string, received:",
			typeof body.formData?.event?.eventDate
		);

		const validationResult = createOrderInputSchema.safeParse(body);
		if (!validationResult.success) {
			console.error("❌ Validation failed:", validationResult.error.errors);
			console.error(
				"❌ Detailed validation errors:",
				JSON.stringify(validationResult.error.issues, null, 2)
			);
			return NextResponse.json(
				{
					success: false,
					error:
						"Invalid order data: " +
						validationResult.error.errors.map((e) => e.message).join(", "),
				},
				{ status: 400 }
			);
		}

		const { formData, holdId, paymentIntentId, agencyId, totalAmount } =
			validationResult.data;

		// Convert agency slug to UUID
		console.log('🔍 Looking up agency by slug:', agencyId);
		const agency = await getAgencyBySlug(agencyId);
		if (!agency) {
			return NextResponse.json({
				success: false,
				error: 'Agency not found: ' + agencyId
			}, { status: 400 });
		}
		const actualAgencyId = agency.id;
		console.log('✅ Agency UUID found:', actualAgencyId);

		// Convert eventDate string to Date object manually
		const eventDate = new Date(formData.event.eventDate);
		if (isNaN(eventDate.getTime())) {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid event date format",
				},
				{ status: 400 }
			);
		}

		// Validate date is at least 48 hours from now
		const now = new Date();
		const minDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
		if (eventDate < minDate) {
			return NextResponse.json(
				{
					success: false,
					error: "Event date must be at least 48 hours from now",
				},
				{ status: 400 }
			);
		}

		// Generate order number (format: YCE-YYYY-NNNNNN)
		const year = new Date().getFullYear();
		const randomNumber = Math.floor(Math.random() * 900000) + 100000; // 6-digit number
		const orderNumber = `YCE-${year}-${randomNumber}`;

		// Generate confirmation code (8 characters)
		const confirmationCode = Math.random()
			.toString(36)
			.substring(2, 10)
			.toUpperCase();

		console.log("🔢 Generated order number:", orderNumber);
		console.log("🎫 Generated confirmation code:", confirmationCode);

		// Create order record in database - mapping to actual database columns
		const orderData = {
			orderNumber,
			agencyId: actualAgencyId, // Use the UUID, not the slug
			status: "pending",

			// Map totalAmount to existing 'total' and 'subtotal' columns
			total: totalAmount,
			subtotal: totalAmount, // Set subtotal equal to total for now (no extra fees)

			// Customer information (essential) - using existing column names
			customerName: formData.contact.fullName,
			customerEmail: formData.contact.email,
			customerPhone: formData.contact.phone,

			// Event details - using existing column names
			eventDate: eventDate.toISOString(),
			eventAddress: formData.event.deliveryAddress
				? `${formData.event.deliveryAddress.street}, ${formData.event.deliveryAddress.city}, ${formData.event.deliveryAddress.state} ${formData.event.deliveryAddress.zipCode}`
				: "Address not provided",
			deliveryTime: formData.event.timeWindow || null,
			deliveryNotes: formData.event.deliveryNotes || null,

			// Display customization - mapping to existing columns
			message: formData.display?.eventMessage || "Event Message",
			messageText:
				formData.display?.eventMessage === "Custom Message"
					? formData.display?.customMessage
					: formData.display?.eventMessage,
			theme: formData.display?.characterTheme || null,

			// Payment information
			paymentMethod: formData.payment?.paymentMethod || null,
			paymentIntentId: paymentIntentId,
			paymentStatus: "pending",

			// Additional metadata
			specialInstructions: formData.event.deliveryNotes || null,

			// Store confirmation code (now working!)
			confirmationCode: confirmationCode,

			// Add updatedAt since it's required (createdAt has default, updatedAt doesn't)
			updatedAt: new Date().toISOString(),
		};

		console.log("💾 Inserting order into database...");
		const { data: orderRecord, error: insertError } = await supabase
			.from("orders")
			.insert([orderData])
			.select("id, orderNumber")
			.single();

		if (insertError) {
			console.error("❌ Database insert failed:", insertError);
			return NextResponse.json(
				{
					success: false,
					error: "Failed to create order: " + insertError.message,
				},
				{ status: 500 }
			);
		}

		console.log("✅ Order created successfully:", orderRecord?.id);

		// Send email notification to agency
		try {
			await sendOrderNotificationEmail({
				orderNumber: orderRecord.orderNumber,
				customerName: formData.contact.fullName,
				eventDate: eventDate.toISOString(),
				totalAmount: totalAmount,
				agencyName: agency.name,
				agencyEmail: agency.contactEmail || agency.email || 'no-email@agency.com',
			});
			console.log("📧 Order notification email sent successfully");
		} catch (emailError) {
			console.error("⚠️ Failed to send order notification email:", emailError);
			// Don't fail the order creation if email fails
		}

		// TODO: Convert soft hold to hard hold (inventory management)
		// TODO: Send confirmation email to customer
		// TODO: Create calendar event for delivery

		return NextResponse.json({
			success: true,
			orderId: orderRecord.id,
			orderNumber: orderRecord.orderNumber,
			confirmationCode: confirmationCode, // Use generated code since it may not be stored in DB
		});
	} catch (error) {
		console.error("❌ Unexpected error creating order:", error);
		return NextResponse.json(
			{
				success: false,
				error: "An unexpected error occurred while creating your order",
			},
			{ status: 500 }
		);
	}
}
