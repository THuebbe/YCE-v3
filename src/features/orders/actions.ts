'use server';

import { generateOrderDocument, DocumentType } from './documents/generator';
import { getOrderWithDetails, updateOrderDocuments } from './utils';
import { revalidatePath } from 'next/cache';
import { getCurrentTenant } from '@/lib/tenant-context-supabase';
import { requireAgencyMember } from '@/features/auth/guards';

export async function generateDocument(orderId: string, type: DocumentType) {
  try {
    // Downstream lookups scope by the URL's agency; make sure the caller
    // actually belongs to it (this action is callable from the browser)
    await requireAgencyMember(await getCurrentTenant());

    // Generate the document
    const result = await generateOrderDocument(orderId, type);
    
    // Store document metadata in order
    await updateOrderDocuments(orderId, {
      type: result.type,
      url: result.url,
      filename: result.filename,
      generatedAt: result.generatedAt.toISOString()
    });

    // Revalidate order pages (note: revalidatePath will work for all agency routes)
    revalidatePath(`/[agency]/orders/${orderId}`, 'page');
    revalidatePath('/[agency]/orders', 'page');

    return {
      success: true,
      result: {
        url: result.url,
        filename: result.filename,
        type: result.type
      }
    };
  } catch (error) {
    console.error(`Failed to generate ${type} document:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate document'
    };
  }
}

export async function generatePickTicket(orderId: string) {
  return generateDocument(orderId, 'pickTicket');
}

export async function generateOrderSummary(orderId: string) {
  return generateDocument(orderId, 'orderSummary');
}

export async function generatePickupChecklist(orderId: string) {
  return generateDocument(orderId, 'pickupChecklist');
}