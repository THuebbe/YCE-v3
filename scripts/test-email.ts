#!/usr/bin/env tsx
/**
 * Every email we send, with sample data (src/lib/email-samples.ts).
 *
 *   pnpm test-email you@example.com          send all six to that inbox
 *   pnpm test-email --out ./tmp/emails       write them as .html files instead
 *
 * Sending needs RESEND_API_KEY and EMAIL_FROM in .env.local (a sender on a
 * domain verified in Resend, e.g. "YardCard Elite <orders@yardcard-elite.com>").
 */
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  const args = process.argv.slice(2).filter(a => a !== '--');
  const outIndex = args.indexOf('--out');
  // Imported after dotenv so lib/site and lib/email see the env
  const { sampleEmails } = await import('../src/lib/email-samples');
  const emails = sampleEmails();

  if (outIndex >= 0) {
    const dir = args[outIndex + 1];
    if (!dir) throw new Error('--out needs a folder');
    mkdirSync(dir, { recursive: true });
    emails.forEach((e, i) => {
      const file = path.join(dir, `${i + 1}-${e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`);
      writeFileSync(file, e.html);
      writeFileSync(file.replace(/\.html$/, '.subject.txt'), e.subject);
      console.log(file);
    });
    return;
  }

  const to = args[0];
  if (!to) {
    console.log('Usage: pnpm test-email you@example.com   |   pnpm test-email --out <folder>');
    process.exit(1);
  }
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.error('Set RESEND_API_KEY and EMAIL_FROM in .env.local to send.');
    process.exit(1);
  }
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  for (const e of emails) {
    const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM, to: [to], subject: `[Sample] ${e.subject}`, html: e.html });
    console.log(error ? `failed: ${e.title}: ${error.message}` : `sent: ${e.title}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
