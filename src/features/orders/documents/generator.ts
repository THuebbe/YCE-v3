import PDFDocument from 'pdfkit';
import { createBlobService } from '@/lib/storage/vercel-blob';
import { getOrderWithDetails } from '../utils';
import { formatAddress, getOrderSignLines } from '../client-utils';

/**
 * The order as the documents read it. Signs come from order_signs (wizard
 * bookings) with order_items as the fallback, same as the dashboard; the
 * camelCase names map the real snake_case columns; money is in dollars.
 * Wizard bookings are priced as a package (base + extra days), not per sign.
 */
export function toDocumentOrder(order: any) {
  const total = Number(order.total) || 0;
  const extraDayFee = Number(order.extra_day_fee) || 0;
  return {
    ...order,
    lines: getOrderSignLines(order),
    specialInstructions: order.special_instructions || order.delivery_notes || '',
    extraDays: Number(order.extra_days) || 0,
    extraDayFee,
    basePackage: total - extraDayFee,
    lateFee: Number(order.late_fee) || 0,
    paymentMethod: order.payment_method || '',
    total,
  };
}

export type DocumentType = 'pickTicket' | 'orderSummary' | 'pickupChecklist';

export interface DocumentResult {
  url: string;
  type: DocumentType;
  filename: string;
  generatedAt: Date;
}

export interface DocumentMetadata {
  type: DocumentType;
  url: string;
  filename: string;
  generatedAt: string;
}

export class DocumentGenerationError extends Error {
  constructor(
    message: string,
    public documentType: DocumentType,
    public orderId: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DocumentGenerationError';
  }
}


/** Table rows are placed at absolute y; start a new page before running off
 *  this one (wizard orders have ~20 sign lines). */
function nextRowY(doc: PDFKit.PDFDocument, y: number, rowHeight: number): number {
  if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    return doc.page.margins.top;
  }
  return y;
}

/** After an absolutely positioned table, continue full-width below it. */
function endTable(doc: PDFKit.PDFDocument, y: number) {
  doc.x = doc.page.margins.left;
  doc.y = Math.max(doc.y, y);
}

export async function generateOrderDocument(
  orderId: string,
  type: DocumentType
): Promise<DocumentResult> {
  try {
    // Fetch order details
    const rawOrder = await getOrderWithDetails(orderId);
    if (!rawOrder) {
      throw new DocumentGenerationError(
        `Order not found: ${orderId}`,
        type,
        orderId
      );
    }
    const order = toDocumentOrder(rawOrder);

    // Generate PDF buffer based on type
    let pdfBuffer: Buffer;
    let filename: string;

    switch (type) {
      case 'pickTicket':
        pdfBuffer = await generatePickTicketPDF(order);
        filename = `pick-ticket-${order.order_number}.pdf`;
        break;
      case 'orderSummary':
        pdfBuffer = await generateOrderSummaryPDF(order);
        filename = `order-summary-${order.order_number}.pdf`;
        break;
      case 'pickupChecklist':
        pdfBuffer = await generatePickupChecklistPDF(order);
        filename = `pickup-checklist-${order.order_number}.pdf`;
        break;
      default:
        throw new DocumentGenerationError(
          `Unknown document type: ${type}`,
          type,
          orderId
        );
    }

    // Upload to Vercel Blob
    const blobService = createBlobService();
    const url = await blobService.uploadDocument(filename, pdfBuffer, 'application/pdf');

    const result: DocumentResult = {
      url,
      type,
      filename,
      generatedAt: new Date()
    };

    return result;
  } catch (error) {
    if (error instanceof DocumentGenerationError) {
      throw error;
    }
    throw new DocumentGenerationError(
      `Failed to generate ${type} document for order ${orderId}`,
      type,
      orderId,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

export async function generatePickTicketPDF(order: ReturnType<typeof toDocumentOrder>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: {
          Title: `Pick Ticket - Order ${order.order_number}`,
          Author: 'YardCard Elite',
          Subject: 'Pick Ticket',
          Keywords: 'pick ticket, order, deployment'
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('PICK TICKET', { align: 'center' });
      doc.moveDown();

      // Order information
      doc.fontSize(14).text(`Order #: ${order.order_number}`, { continued: true });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      // Customer information
      doc.fontSize(16).text('Customer Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Name: ${order.customer_name}`)
        .text(`Email: ${order.customer_email}`)
        .text(`Phone: ${order.customer_phone || 'Not provided'}`)
        .text(`Event Date: ${new Date(order.event_date).toLocaleDateString()}`)
        .text(`Event Address: ${formatAddress(order.event_address)}`);
      doc.moveDown();

      // Special instructions
      if (order.specialInstructions) {
        doc.fontSize(14).text('Special Instructions', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(order.specialInstructions);
        doc.moveDown();
      }

      // Order items
      doc.fontSize(16).text('Items to Pick', { underline: true });
      doc.moveDown(0.5);

      const signCount = order.lines.reduce((sum: number, item: any) => sum + item.quantity, 0);
      doc.fontSize(12).text(`Total Signs: ${signCount}`);
      doc.moveDown();

      // Items table
      let yPosition = doc.y;
      doc.fontSize(12).text('Qty', 50, yPosition, { width: 50 });
      doc.text('Sign Name', 100, yPosition, { width: 200 });
      doc.text('Category', 300, yPosition, { width: 100 });
      doc.text('Notes', 400, yPosition, { width: 150 });
      
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      order.lines.forEach((item: any) => {
        yPosition = nextRowY(doc, yPosition, 25);
        doc.text(item.quantity.toString(), 50, yPosition, { width: 50 });
        doc.text((item.sign?.name ?? item.signId), 100, yPosition, { width: 200 });
        doc.text((item.sign?.category ?? ''), 300, yPosition, { width: 100 });
        doc.text('[  ] Picked', 400, yPosition, { width: 150 });
        yPosition += 25;
      });
      endTable(doc, yPosition);

      // Footer
      doc.moveDown(2);
      doc.fontSize(12).text('Picked by: ________________________    Date: _______________', { align: 'center' });
      doc.moveDown();
      doc.text('Notes: _______________________________________________________________', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateOrderSummaryPDF(order: ReturnType<typeof toDocumentOrder>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Order Summary - ${order.order_number}`,
          Author: 'YardCard Elite',
          Subject: 'Order Summary',
          Keywords: 'order summary, invoice, receipt'
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(24).text('ORDER SUMMARY', { align: 'center' });
      doc.moveDown();

      // Order details
      doc.fontSize(14).text(`Order #: ${order.order_number}`, { continued: true });
      doc.text(`Status: ${order.status.toUpperCase()}`, { align: 'right' });
      doc.text(`Order Date: ${new Date(order.created_at).toLocaleDateString()}`, { continued: true });
      doc.text(`Event Date: ${new Date(order.event_date).toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      // Customer information
      doc.fontSize(16).text('Customer Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Name: ${order.customer_name}`)
        .text(`Email: ${order.customer_email}`)
        .text(`Phone: ${order.customer_phone || 'Not provided'}`)
        .text(`Event Address: ${formatAddress(order.event_address)}`);
      doc.moveDown();

      // Order items
      doc.fontSize(16).text('Order Items', { underline: true });
      doc.moveDown(0.5);

      // Items table header
      let yPosition = doc.y;
      doc.fontSize(12).text('Qty', 50, yPosition, { width: 50 });
      doc.text('Sign Name', 100, yPosition, { width: 200 });
      doc.text('Category', 300, yPosition, { width: 100 });
      
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      // Items
      order.lines.forEach((item: any) => {
        yPosition = nextRowY(doc, yPosition, 25);
        doc.text(item.quantity.toString(), 50, yPosition, { width: 50 });
        doc.text((item.sign?.name ?? item.signId), 100, yPosition, { width: 200 });
        doc.text((item.sign?.category ?? ''), 300, yPosition, { width: 100 });
        yPosition += 25;
      });

      // Totals
      yPosition = nextRowY(doc, yPosition + 20, 110);
      doc.moveTo(400, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      doc.fontSize(12).text(`Base Package: $${order.basePackage.toFixed(2)}`, 350, yPosition, { width: 200 });
      yPosition += 20;
      if (order.extraDayFee > 0) {
        doc.text(`Extra Days (${order.extraDays}): $${order.extraDayFee.toFixed(2)}`, 350, yPosition, { width: 200 });
        yPosition += 20;
      }
      if (order.lateFee > 0) {
        doc.text(`Late Fee: $${order.lateFee.toFixed(2)}`, 350, yPosition, { width: 200 });
        yPosition += 20;
      }

      doc.fontSize(14).text(`Total: $${(order.total + order.lateFee).toFixed(2)}`, 350, yPosition, { width: 200 });
      endTable(doc, yPosition + 25);

      // Payment information
      doc.moveDown(2);
      doc.fontSize(16).text('Payment Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Payment Status: ${order.payment_status.toUpperCase()}`)
        .text(`Payment Method: ${order.paymentMethod || 'Not specified'}`);

      // Special instructions
      if (order.specialInstructions) {
        doc.moveDown();
        doc.fontSize(16).text('Special Instructions', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(order.specialInstructions);
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(10).text('Thank you for your business!', { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generatePickupChecklistPDF(order: ReturnType<typeof toDocumentOrder>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Pickup Checklist - Order ${order.order_number}`,
          Author: 'YardCard Elite',
          Subject: 'Pickup Checklist',
          Keywords: 'pickup checklist, return, inventory'
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('PICKUP CHECKLIST', { align: 'center' });
      doc.moveDown();

      // Order information
      doc.fontSize(14).text(`Order #: ${order.order_number}`, { continued: true });
      doc.text(`Pickup Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      // Customer information
      doc.fontSize(16).text('Customer Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Name: ${order.customer_name}`)
        .text(`Address: ${formatAddress(order.event_address)}`)
        .text(`Phone: ${order.customer_phone || 'Not provided'}`);
      doc.moveDown();

      // Items to collect
      doc.fontSize(16).text('Items to Collect', { underline: true });
      doc.moveDown(0.5);

      const signCount = order.lines.reduce((sum: number, item: any) => sum + item.quantity, 0);
      doc.fontSize(12).text(`Total Signs: ${signCount}`);
      doc.moveDown();

      // Checklist table
      let yPosition = doc.y;
      doc.fontSize(12).text('Qty', 50, yPosition, { width: 50 });
      doc.text('Sign Name', 100, yPosition, { width: 180 });
      doc.text('Returned (count)', 280, yPosition, { width: 200 });
      doc.text('Notes', 480, yPosition, { width: 70 });
      
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      order.lines.forEach((item: any) => {
        yPosition = nextRowY(doc, yPosition, 30);
        doc.text(item.quantity.toString(), 50, yPosition, { width: 50 });
        doc.text((item.sign?.name ?? item.signId), 100, yPosition, { width: 180 });
        // Counts, not checkboxes: a line can be several signs (matches check-in)
        doc.fontSize(10).text('Good ___  Damaged ___  Missing ___', 280, yPosition + 1, { width: 200 });
        doc.text('__________', 480, yPosition + 1, { width: 70 });
        doc.fontSize(12);
        yPosition += 30;
      });
      endTable(doc, yPosition);

      // Additional notes section
      doc.moveDown(2);
      doc.fontSize(16).text('Additional Notes', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text('_'.repeat(80));
      doc.moveDown();
      doc.text('_'.repeat(80));
      doc.moveDown();
      doc.text('_'.repeat(80));

      // Late fee section
      doc.moveDown(2);
      doc.fontSize(16).text('Late Fee Assessment', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text('Days Late: ______    Late Fee: $______');
      doc.moveDown();
      doc.text('[  ] No late fee assessed    [  ] Late fee will be charged');

      // Footer
      doc.moveDown(2);
      doc.fontSize(12).text('Collected by: ________________________    Date: _______________', { align: 'center' });
      doc.moveDown();
      doc.text('Customer Signature: ________________________', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export function generateHTMLFallback(rawOrder: any, type: DocumentType): string {
  const order = toDocumentOrder(rawOrder);
  const commonStyles = `
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #333; text-align: center; }
      h2 { color: #666; border-bottom: 2px solid #eee; padding-bottom: 5px; }
      .order-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
      .customer-info { background: #f9f9f9; padding: 15px; border-radius: 5px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f5f5f5; }
      .total { text-align: right; font-weight: bold; }
      .signature { margin-top: 40px; }
    </style>
  `;

  const orderInfo = `
    <div class="order-info">
      <div>Order #: ${order.order_number}</div>
      <div>Date: ${new Date().toLocaleDateString()}</div>
    </div>
  `;

  const customerInfo = `
    <div class="customer-info">
      <h2>Customer Information</h2>
      <p><strong>Name:</strong> ${order.customer_name}</p>
      <p><strong>Email:</strong> ${order.customer_email}</p>
      <p><strong>Phone:</strong> ${order.customer_phone || 'Not provided'}</p>
      <p><strong>Event Date:</strong> ${new Date(order.event_date).toLocaleDateString()}</p>
      <p><strong>Address:</strong> ${formatAddress(order.event_address)}</p>
    </div>
  `;

  switch (type) {
    case 'pickTicket':
      return `
        <html>
          <head>
            <title>Pick Ticket - Order ${order.order_number}</title>
            ${commonStyles}
          </head>
          <body>
            <h1>PICK TICKET</h1>
            ${orderInfo}
            ${customerInfo}
            <h2>Items to Pick</h2>
            <table>
              <tr><th>Qty</th><th>Sign Name</th><th>Category</th><th>Notes</th></tr>
              ${order.lines.map((item: any) => `
                <tr>
                  <td>${item.quantity}</td>
                  <td>${(item.sign?.name ?? item.signId)}</td>
                  <td>${(item.sign?.category ?? '')}</td>
                  <td>☐ Picked</td>
                </tr>
              `).join('')}
            </table>
            <div class="signature">
              <p>Picked by: ________________________    Date: _______________</p>
            </div>
          </body>
        </html>
      `;

    case 'orderSummary':
      return `
        <html>
          <head>
            <title>Order Summary - ${order.order_number}</title>
            ${commonStyles}
          </head>
          <body>
            <h1>ORDER SUMMARY</h1>
            ${orderInfo}
            ${customerInfo}
            <h2>Order Items</h2>
            <table>
              <tr><th>Qty</th><th>Sign Name</th><th>Category</th></tr>
              ${order.lines.map((item: any) => `
                <tr>
                  <td>${item.quantity}</td>
                  <td>${(item.sign?.name ?? item.signId)}</td>
                  <td>${(item.sign?.category ?? '')}</td>
                </tr>
              `).join('')}
            </table>
            <div class="total">
              <p>Base Package: $${order.basePackage.toFixed(2)}</p>
              ${order.extraDayFee > 0 ? `<p>Extra Days (${order.extraDays}): $${order.extraDayFee.toFixed(2)}</p>` : ''}
              <p><strong>Total: $${(order.total + order.lateFee).toFixed(2)}</strong></p>
            </div>
          </body>
        </html>
      `;

    case 'pickupChecklist':
      return `
        <html>
          <head>
            <title>Pickup Checklist - Order ${order.order_number}</title>
            ${commonStyles}
          </head>
          <body>
            <h1>PICKUP CHECKLIST</h1>
            ${orderInfo}
            ${customerInfo}
            <h2>Items to Collect</h2>
            <table>
              <tr><th>Qty</th><th>Sign Name</th><th>Returned (count)</th><th>Notes</th></tr>
              ${order.lines.map((item: any) => `
                <tr>
                  <td>${item.quantity}</td>
                  <td>${(item.sign?.name ?? item.signId)}</td>
                  <td>Good ___ Damaged ___ Missing ___</td>
                  <td>_________________</td>
                </tr>
              `).join('')}
            </table>
            <div class="signature">
              <p>Collected by: ________________________    Date: _______________</p>
              <p>Customer Signature: ________________________</p>
            </div>
          </body>
        </html>
      `;

    default:
      return `<html><body><h1>Unknown Document Type</h1></body></html>`;
  }
}