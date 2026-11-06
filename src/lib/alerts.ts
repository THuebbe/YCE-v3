import { Resend } from 'resend';

/**
 * Tell the owner something on the money path broke, instead of waiting for
 * them to read the logs. Always logs; also emails ALERT_EMAIL when it is set
 * (set it for Production only, so previews and the demo stay quiet).
 *
 * Never throws: an alert must not turn a handled failure into a crash.
 * Detail is ids and error messages only; no card data, no customer text.
 */

const REPEAT_WINDOW_MS = 30 * 60 * 1000;
const lastSent = new Map<string, number>();

/** One email per subject per 30 minutes, per server instance (best effort:
 *  a burst across several instances can still send a few). */
export function shouldSend(subject: string, now: number, sent: Map<string, number> = lastSent): boolean {
  const last = sent.get(subject);
  if (last !== undefined && now - last < REPEAT_WINDOW_MS) return false;
  sent.set(subject, now);
  return true;
}

function describe(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

export function alertText(subject: string, detail: Record<string, unknown>): string {
  const lines = Object.entries(detail)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}: ${describe(v)}`);
  return [subject, '', ...lines, '', `Environment: ${process.env.VERCEL_ENV ?? 'local'}`, `At: ${new Date().toISOString()}`].join('\n');
}

export async function alertOwner(subject: string, detail: Record<string, unknown> = {}): Promise<void> {
  console.error(`ALERT ${subject}`, detail);
  const to = process.env.ALERT_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!to || !apiKey || !shouldSend(subject, Date.now())) return;
  try {
    await new Resend(apiKey).emails.send({
      from: process.env.EMAIL_FROM || 'YardCard Elite <onboarding@resend.dev>',
      to,
      subject: `[YCE alert] ${subject}`,
      text: alertText(subject, detail),
    });
  } catch (error) {
    console.error('Alert email failed:', error);
  }
}
