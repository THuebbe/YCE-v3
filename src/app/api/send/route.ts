import type { NextApiRequest, NextApiResponse } from "next";
import { EmailTemplate } from "@/components/email-template";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	const { data, error } = await resend.emails.send({
		from: "YardCard Elite <onboarding@resend.dev>",
		to: ["thuebbe@gmail.com"],
		subject: "Hello world",
		react: EmailTemplate({ firstName: "John" }),
	});

	if (error) {
		return res.status(400).json(error);
	}

	res.status(200).json(data);
};

export default handler;
