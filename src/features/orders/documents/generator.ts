import PDFDocument from 'pdfkit';
import { createBlobService } from '@/lib/storage/vercel-blob';
import { getOrderWithDetails } from '../utils';

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

export async function generateOrderDocument(
  orderId: string,
  type: DocumentType
): Promise<DocumentResult> {
  try {
    // Fetch order details
    const order = await getOrderWithDetails(orderId);
    if (!order) {
      throw new DocumentGenerationError(
        `Order not found: ${orderId}`,
        type,
        orderId
      );
    }

    // Generate PDF buffer based on type
    let pdfBuffer: Buffer;
    let filename: string;

    switch (type) {
      case 'pickTicket':
        pdfBuffer = await generatePickTicketPDF(order);
        filename = `pick-ticket-${order.orderNumber}.pdf`;
        break;
      case 'orderSummary':
        pdfBuffer = await generateOrderSummaryPDF(order);
        filename = `order-summary-${order.orderNumber}.pdf`;
        break;
      case 'pickupChecklist':
        pdfBuffer = await generatePickupChecklistPDF(order);
        filename = `pickup-checklist-${order.orderNumber}.pdf`;
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

async function generatePickTicketPDF(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: {
          Title: `Pick Ticket - Order ${order.orderNumber}`,
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
      doc.fontSize(14).text(`Order #: ${order.orderNumber}`, { continued: true });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      // Customer information
      doc.fontSize(16).text('Customer Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Name: ${order.customerName}`)
        .text(`Email: ${order.customerEmail}`)
        .text(`Phone: ${order.customerPhone || 'Not provided'}`)
        .text(`Event Date: ${new Date(order.eventDate).toLocaleDateString()}`)
        .text(`Event Address: ${order.eventAddress || 'Not provided'}`);
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

      const signCount = order.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
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

      order.orderItems?.forEach((item: any, index: number) => {
        doc.text(item.quantity.toString(), 50, yPosition, { width: 50 });
        doc.text(item.sign.name, 100, yPosition, { width: 200 });
        doc.text(item.sign.category, 300, yPosition, { width: 100 });
        doc.text('□ Picked', 400, yPosition, { width: 150 });
        yPosition += 25;
      });

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

async function generateOrderSummaryPDF(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Order Summary - ${order.orderNumber}`,
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
      doc.fontSize(14).text(`Order #: ${order.orderNumber}`, { continued: true });
      doc.text(`Status: ${order.status.toUpperCase()}`, { align: 'right' });
      doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, { continued: true });
      doc.text(`Event Date: ${new Date(order.eventDate).toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      // Customer information
      doc.fontSize(16).text('Customer Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Name: ${order.customerName}`)
        .text(`Email: ${order.customerEmail}`)
        .text(`Phone: ${order.customerPhone || 'Not provided'}`)
        .text(`Event Address: ${order.eventAddress || 'Not provided'}`);
      doc.moveDown();

      // Order items
      doc.fontSize(16).text('Order Items', { underline: true });
      doc.moveDown(0.5);

      // Items table header
      let yPosition = doc.y;
      doc.fontSize(12).text('Qty', 50, yPosition, { width: 50 });
      doc.text('Sign Name', 100, yPosition, { width: 200 });
      doc.text('Category', 300, yPosition, { width: 100 });
      doc.text('Unit Price', 400, yPosition, { width: 75 });
      doc.text('Total', 475, yPosition, { width: 75 });
      
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      // Items
      order.orderItems?.forEach((item: any) => {
        doc.text(item.quantity.toString(), 50, yPosition, { width: 50 });
        doc.text(item.sign.name, 100, yPosition, { width: 200 });
        doc.text(item.sign.category, 300, yPosition, { width: 100 });
        doc.text(`$${(item.unitPrice / 100).toFixed(2)}`, 400, yPosition, { width: 75 });
        doc.text(`$${(item.lineTotal / 100).toFixed(2)}`, 475, yPosition, { width: 75 });
        yPosition += 25;
      });

      // Totals
      yPosition += 20;
      doc.moveTo(400, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      doc.fontSize(12).text(`Subtotal: $${(order.subtotal / 100).toFixed(2)}`, 400, yPosition, { width: 150 });
      yPosition += 20;
      if (order.extraDayFee > 0) {
        doc.text(`Extra Day Fee: $${(order.extraDayFee / 100).toFixed(2)}`, 400, yPosition, { width: 150 });
        yPosition += 20;
      }
      if (order.lateFee > 0) {
        doc.text(`Late Fee: $${(order.lateFee / 100).toFixed(2)}`, 400, yPosition, { width: 150 });
        yPosition += 20;
      }
      
      doc.fontSize(14).text(`Total: $${(order.total / 100).toFixed(2)}`, 400, yPosition, { width: 150 });

      // Payment information
      doc.moveDown(2);
      doc.fontSize(16).text('Payment Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Payment Status: ${order.paymentStatus.toUpperCase()}`)
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

async function generatePickupChecklistPDF(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Pickup Checklist - Order ${order.orderNumber}`,
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
      doc.fontSize(14).text(`Order #: ${order.orderNumber}`, { continued: true });
      doc.text(`Pickup Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      // Customer information
      doc.fontSize(16).text('Customer Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
        .text(`Name: ${order.customerName}`)
        .text(`Address: ${order.eventAddress || 'Not provided'}`)
        .text(`Phone: ${order.customerPhone || 'Not provided'}`);
      doc.moveDown();

      // Items to collect
      doc.fontSize(16).text('Items to Collect', { underline: true });
      doc.moveDown(0.5);

      const signCount = order.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      doc.fontSize(12).text(`Total Signs: ${signCount}`);
      doc.moveDown();

      // Checklist table
      let yPosition = doc.y;
      doc.fontSize(12).text('Qty', 50, yPosition, { width: 50 });
      doc.text('Sign Name', 100, yPosition, { width: 200 });
      doc.text('Condition', 300, yPosition, { width: 100 });
      doc.text('Notes', 400, yPosition, { width: 150 });
      
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      order.orderItems?.forEach((item: any) => {
        doc.text(item.quantity.toString(), 50, yPosition, { width: 50 });
        doc.text(item.sign.name, 100, yPosition, { width: 200 });
        doc.text('□ Good  □ Damaged', 300, yPosition, { width: 100 });
        doc.text('_________________', 400, yPosition, { width: 150 });
        yPosition += 30;
      });

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
      doc.text('□ No late fee assessed    □ Late fee will be charged');

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

export function generateHTMLFallback(order: any, type: DocumentType): string {
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
      <div>Order #: ${order.orderNumber}</div>
      <div>Date: ${new Date().toLocaleDateString()}</div>
    </div>
  `;

  const customerInfo = `
    <div class="customer-info">
      <h2>Customer Information</h2>
      <p><strong>Name:</strong> ${order.customerName}</p>
      <p><strong>Email:</strong> ${order.customerEmail}</p>
      <p><strong>Phone:</strong> ${order.customerPhone || 'Not provided'}</p>
      <p><strong>Event Date:</strong> ${new Date(order.eventDate).toLocaleDateString()}</p>
      <p><strong>Address:</strong> ${order.eventAddress || 'Not provided'}</p>
    </div>
  `;

  switch (type) {
    case 'pickTicket':
      return `
        <html>
          <head>
            <title>Pick Ticket - Order ${order.orderNumber}</title>
            ${commonStyles}
          </head>
          <body>
            <h1>PICK TICKET</h1>
            ${orderInfo}
            ${customerInfo}
            <h2>Items to Pick</h2>
            <table>
              <tr><th>Qty</th><th>Sign Name</th><th>Category</th><th>Notes</th></tr>
              ${order.orderItems?.map((item: any) => `
                <tr>
                  <td>${item.quantity}</td>
                  <td>${item.sign.name}</td>
                  <td>${item.sign.category}</td>
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
            <title>Order Summary - ${order.orderNumber}</title>
            ${commonStyles}
          </head>
          <body>
            <h1>ORDER SUMMARY</h1>
            ${orderInfo}
            ${customerInfo}
            <h2>Order Items</h2>
            <table>
              <tr><th>Qty</th><th>Sign Name</th><th>Unit Price</th><th>Total</th></tr>
              ${order.orderItems?.map((item: any) => `
                <tr>
                  <td>${item.quantity}</td>
                  <td>${item.sign.name}</td>
                  <td>$${(item.unitPrice / 100).toFixed(2)}</td>
                  <td>$${(item.lineTotal / 100).toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>
            <div class="total">
              <p>Subtotal: $${(order.subtotal / 100).toFixed(2)}</p>
              <p><strong>Total: $${(order.total / 100).toFixed(2)}</strong></p>
            </div>
          </body>
        </html>
      `;

    case 'pickupChecklist':
      return `
        <html>
          <head>
            <title>Pickup Checklist - Order ${order.orderNumber}</title>
            ${commonStyles}
          </head>
          <body>
            <h1>PICKUP CHECKLIST</h1>
            ${orderInfo}
            ${customerInfo}
            <h2>Items to Collect</h2>
            <table>
              <tr><th>Qty</th><th>Sign Name</th><th>Condition</th><th>Notes</th></tr>
              ${order.orderItems?.map((item: any) => `
                <tr>
                  <td>${item.quantity}</td>
                  <td>${item.sign.name}</td>
                  <td>☐ Good  ☐ Damaged</td>
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