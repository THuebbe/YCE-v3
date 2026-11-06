// Server only (PDFKit). The pick ticket: what to pull from the shelves for one
// order, grouped the way signs are stored (one bin per style and color), with
// the booked display's picture and the setup/event/pickup days.
import PDFDocument from 'pdfkit';
import { COLORS, PALETTE } from '@/lib/brand';
import { formatAddress, formatTimeWindow, type OrderSignLine } from '../client-utils';
import { messageWords } from '@/features/booking/services/line-elements';

export interface PickBin {
  title: string;
  /** Swatch color for a colorway bin */
  swatch?: string;
  items: { label: string; quantity: number }[];
  count: number;
}

const COLORWAY_SWATCH: Record<string, string> = {
  black: '#1F1F1F', blue: '#2563EB', gold: '#F2B705', green: '#2E7D4F',
  pink: '#F28AB2', purple: '#7C3AED', red: '#D7263D',
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const KIND_ORDER = ['letter', 'number', 'punctuation', 'shape'];

/**
 * Sign lines grouped into storage bins: one per style and color (letters
 * A-Z, then numbers, punctuation and shapes), then ordinals, decorations and
 * the rest by category. Pure, so it can be tested.
 */
export function pickBins(lines: OrderSignLine[]): PickBin[] {
  type Item = PickBin['items'][number] & { sort: string };
  const bins = new Map<string, { title: string; swatch?: string; sortKey: string; items: Item[] }>();
  const add = (key: string, sortKey: string, title: string, swatch: string | undefined, item: Item) => {
    const bin = bins.get(key) ?? { title, swatch, sortKey, items: [] };
    bin.items.push(item);
    bins.set(key, bin);
  };
  for (const line of lines) {
    const sign = (line.sign ?? {}) as Record<string, string | null | undefined>;
    const name = sign.name || line.signId;
    const quantity = line.quantity;
    if (sign.colorway && sign.style && sign.character) {
      const colorway = sign.colorway.toLowerCase();
      const kind = KIND_ORDER.indexOf((sign.sign_type || '').toLowerCase());
      add(`c:${sign.style}|${colorway}`, `0:${sign.style}|${colorway}`, `${cap(sign.style)} · ${cap(colorway)}`, COLORWAY_SWATCH[colorway],
        { label: sign.character, quantity, sort: `${kind === -1 ? 9 : kind}:${sign.character}` });
    } else if ((sign.category || '').toLowerCase() === 'ordinals') {
      add('ordinals', '1', 'Ordinals (ST, ND, RD, TH)', undefined,
        { label: sign.character || name.replace(/^Ordinal\s+/i, ''), quantity, sort: name });
    } else {
      const category = sign.category || 'Other';
      add(`k:${category}`, `${category === 'Decorations' ? 2 : 3}:${category}`, category, undefined, { label: name, quantity, sort: name });
    }
  }
  return [...bins.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(bin => ({
      title: bin.title,
      swatch: bin.swatch,
      count: bin.items.reduce((n, i) => n + i.quantity, 0),
      items: bin.items.sort((a, b) => a.sort.localeCompare(b.sort, undefined, { numeric: true })).map(({ label, quantity }) => ({ label, quantity })),
    }));
}

export interface PickTicketInput {
  order: Record<string, any> & { lines: OrderSignLine[]; specialInstructions?: string };
  agencyName?: string | null;
  /** YYYY-MM-DD: the hold's first and last day (signs out, signs back) */
  setupDay?: string | null;
  pickupDay?: string | null;
  displayImage?: Buffer | null;
}

const day = (key?: string | null) => key
  ? new Date(`${key}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
  : '—';

export function generatePickTicket({ order, agencyName, setupDay, pickupDay, displayImage }: PickTicketInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER', margin: 40, bufferPages: true,
        info: { Title: `Pick Ticket - Order ${order.order_number}`, Author: agencyName || 'YardCard Elite', Subject: 'Pick Ticket' },
      });
      const buffers: Buffer[] = [];
      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const L = doc.page.margins.left;
      const W = doc.page.width - L - doc.page.margins.right;
      const bottom = () => doc.page.height - doc.page.margins.bottom - 24;
      const ensure = (h: number) => { if (doc.y + h > bottom()) { doc.addPage(); doc.y = doc.page.margins.top; } };
      const sunken = PALETTE.ink[50] ?? '#F3F1EC';

      // Header band
      doc.rect(L, 40, W, 46).fill(COLORS.brand);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(15).text(agencyName || 'Pick ticket', L + 14, 55, { width: W / 2 });
      doc.font('Helvetica-Bold').fontSize(13).text('PICK TICKET', L, 56, { width: W - 14, align: 'right' });
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(18).text(`Order ${order.order_number}`, L, 100);
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.textMuted)
        .text(`Printed ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, L, 106, { width: W, align: 'right' });

      // Setup / Event / Pickup
      const boxY = 130, gap = 10, boxW = (W - 2 * gap) / 3;
      const window = formatTimeWindow({ delivery_time: order.delivery_time as string | null });
      const eventDay = order.event_date ? String(order.event_date).slice(0, 10) : null;
      [['SETUP', day(setupDay), window ? `${window} window` : ''], ['EVENT', day(eventDay), ''], ['PICKUP', day(pickupDay), '']]
        .forEach(([label, value, sub], i) => {
          const x = L + i * (boxW + gap);
          doc.roundedRect(x, boxY, boxW, 51, 6).fillAndStroke(sunken, COLORS.line);
          doc.fillColor(COLORS.textMuted).font('Helvetica-Bold').fontSize(8).text(label, x + 10, boxY + 9);
          doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(14).text(value, x + 10, boxY + 21, { width: boxW - 20 });
          if (sub) doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.textMuted).text(sub, x + 10, boxY + 38, { width: boxW - 20 });
        });

      // Deliver to
      const deliverY = boxY + 59;
      doc.roundedRect(L, deliverY, W, 40, 6).stroke(COLORS.line);
      doc.fillColor(COLORS.textMuted).font('Helvetica-Bold').fontSize(8).text('DELIVER TO', L + 10, deliverY + 9);
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(11).text(formatAddress(order.event_address), L + 10, deliverY + 20, { width: W * 0.6 });
      doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.text)
        .text([order.customer_name, order.customer_phone].filter(Boolean).join(' · '), L + W * 0.6, deliverY + 21, { width: W * 0.4 - 10, align: 'right' });
      doc.y = deliverY + 52;

      // The display as booked
      const config = (order.display_config ?? {}) as Record<string, any>;
      if (displayImage) {
        try {
          // Centered, at most 140pt tall, the frame hugging the picture
          // openImage is PDFKit's, missing from its type definitions
          const img = (doc as unknown as { openImage(src: Buffer): { width: number; height: number } }).openImage(displayImage);
          const scale = Math.min((W - 8) / img.width, 128 / img.height);
          const w = img.width * scale, h = img.height * scale, x = L + (W - w) / 2, y = doc.y;
          doc.image(displayImage, x, y, { width: w, height: h });
          doc.roundedRect(x - 3, y - 3, w + 6, h + 6, 6).lineWidth(0.8).stroke(COLORS.line);
          doc.y = y + h + 12;
        } catch {
          // An unreadable picture is left out
        }
      }
      const lineOf = (label: string, words: string, style?: string, colorway?: string) => {
        if (!words) return;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.textMuted).text(`${label}  `, L, doc.y, { continued: true });
        doc.fillColor(COLORS.text).fontSize(12).text(words.toUpperCase(), { continued: !!(style || colorway) });
        if (style || colorway) doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted).text(`   ${[style, colorway].filter(Boolean).map(s => cap(String(s))).join(' ')}`);
      };
      const message = config.eventMessage === 'Custom Message' ? config.customMessage : (order.message_text || config.eventMessage || '');
      lineOf('MESSAGE', message ? messageWords(message, config.eventNumber, config.ordinalMode) : '', config.messageStyle, config.messageColorway);
      lineOf('NAME', config.recipientName || '', config.nameStyle || config.messageStyle, config.nameColorway);
      if (config.ordinalMode === 'letters') doc.font('Helvetica').fontSize(9).fillColor(COLORS.textMuted).text('The number\'s suffix (TH, ST...) is plain letters in the name color.');
      if (config.ordinalMode === 'number') doc.font('Helvetica').fontSize(9).fillColor(COLORS.textMuted).text('The number goes up without its suffix (no TH, ST... sign).');
      doc.moveDown(0.6);

      // Special instructions
      if (order.specialInstructions) {
        doc.font('Helvetica').fontSize(10);
        const h = doc.heightOfString(order.specialInstructions, { width: W - 20 }) + 28;
        ensure(h);
        const y = doc.y;
        doc.roundedRect(L, y, W, h, 6).fillAndStroke(PALETTE.tangerine[50] ?? '#FFF4EC', PALETTE.tangerine[500]);
        doc.fillColor(PALETTE.tangerine[800] ?? COLORS.actionText).font('Helvetica-Bold').fontSize(8).text('SPECIAL INSTRUCTIONS', L + 10, y + 8);
        doc.fillColor(COLORS.text).font('Helvetica').fontSize(10).text(order.specialInstructions, L + 10, y + 20, { width: W - 20 });
        doc.y = y + h + 10;
      }

      // Signs to pull, by bin, two columns of check boxes
      const bins = pickBins(order.lines);
      const total = bins.reduce((n, b) => n + b.count, 0);
      ensure(40);
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(13).text(`Signs to pull`, L, doc.y, { continued: true })
        .font('Helvetica').fontSize(11).fillColor(COLORS.textMuted).text(`   ${total} total`);
      doc.moveDown(0.4);
      const rowH = 16;
      for (const bin of bins) {
        // Letters and numbers are short: 4 columns. Read down each column,
        // in the bin's order (A-Z, then 0-9). A long bin carries on over pages.
        const cols = bin.items.every(i => i.label.length <= 3) ? 4 : 2;
        const colW = W / cols;
        // A small bin isn't split over two pages
        const binRows = Math.ceil(bin.items.length / cols);
        ensure(26 + (binRows <= 6 ? binRows : 1) * rowH);
        const y = doc.y;
        doc.rect(L, y, W, 20).fill(sunken);
        let tx = L + 8;
        if (bin.swatch) { doc.circle(L + 14, y + 10, 5).fillAndStroke(bin.swatch, COLORS.line); tx = L + 26; }
        doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(10.5).text(bin.title, tx, y + 5.5, { continued: true })
          .font('Helvetica').fillColor(COLORS.textMuted).text(`   ${bin.count} sign${bin.count === 1 ? '' : 's'}`);
        let rowY = y + 26;
        let items = bin.items;
        while (items.length) {
          // As many rows as fit on this page, filled column by column
          const rowsLeft = Math.max(1, Math.floor((bottom() - rowY) / rowH));
          const rows = Math.min(rowsLeft, Math.ceil(items.length / cols));
          const chunk = items.slice(0, rows * cols);
          chunk.forEach((item, i) => {
            const x = L + 8 + Math.floor(i / rows) * colW;
            const iy = rowY + (i % rows) * rowH;
            doc.rect(x, iy + 1, 10, 10).lineWidth(0.8).stroke(COLORS.textMuted);
            doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(10.5).text(`${item.quantity} ×`, x + 18, iy, { width: 30, lineBreak: false });
            doc.font('Helvetica').text(item.label, x + 48, iy, { width: colW - 60, ellipsis: true, lineBreak: false });
          });
          rowY += rows * rowH;
          items = items.slice(chunk.length);
          if (items.length) { doc.addPage(); rowY = doc.page.margins.top; }
        }
        doc.y = rowY + 6;
      }

      // Sign-off: it may use the space down to the page number
      if (doc.y + 34 > doc.page.height - doc.page.margins.bottom - 4) { doc.addPage(); doc.y = doc.page.margins.top; }
      const y = doc.y + 4;
      doc.moveTo(L, y).lineTo(L + W, y).lineWidth(0.5).stroke(COLORS.line);
      doc.fillColor(COLORS.textMuted).font('Helvetica').fontSize(9.5);
      doc.text('Pulled by ____________________', L, y + 14);
      doc.text('Checked by ____________________', L + W / 3 + 10, y + 14);
      doc.rect(L + (2 * W) / 3 + 40, y + 13, 10, 10).stroke(COLORS.textMuted);
      doc.text('Loaded on the truck', L + (2 * W) / 3 + 56, y + 14);

      // Page numbers
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        // Below the bottom margin, where PDFKit would otherwise start a new page
        doc.page.margins.bottom = 0;
        doc.fillColor(COLORS.textMuted).font('Helvetica').fontSize(8)
          .text(`Order ${order.order_number} · page ${i + 1} of ${range.count}`, L, doc.page.height - 30, { width: W, align: 'center', lineBreak: false });
      }
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
