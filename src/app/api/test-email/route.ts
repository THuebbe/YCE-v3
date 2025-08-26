import { NextRequest, NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();
		
		if (!email) {
			return NextResponse.json(
				{ success: false, error: "Email address is required" },
				{ status: 400 }
			);
		}

		console.log("🧪 Testing email functionality with:", email);
		const result = await sendTestEmail(email);

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: "Test email sent successfully",
				emailId: result.emailId,
			});
		} else {
			return NextResponse.json(
				{ success: false, error: "Failed to send test email", details: result.error },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("❌ Test email error:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}