'use server';

import { generateOrderDocument, DocumentType } from './documents/generator';
import { getOrderWithDetails, updateOrderDocuments } from './utils';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/db/supabase-client';
import { requireAgencyMember } from '@/features/auth/guards';

export async function generateDocument(orderId: string, type: DocumentType) {
  try {
    // Browser-callable: check the caller belongs to the order's own agency.
    // (Not getCurrentTenant(): it resolves from the URL, proves nothing about
    // the caller, and currently can't resolve at all - see STATE.md.)
    const { data: owner } = await supabase
      .from('orders')
      .select('agency_id')
      .eq('id', orderId)
      .single();
    await requireAgencyMember(owner?.agency_id);

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