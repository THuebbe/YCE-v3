import { NextRequest, NextResponse } from "next/server";
import { EmailTemplate } from "@/components/email-template";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
	try {
		const { data, error } = await resend.emails.send({
			from: "YardCard Elite <onboarding@resend.dev>",
			to: ["thuebbe@gmail.com"],
			subject: "Hello world",
			react: EmailTemplate({ firstName: "John" }),
		});

		if (error) {
			return NextResponse.json(error, { status: 400 });
		}

		return NextResponse.json(data, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
