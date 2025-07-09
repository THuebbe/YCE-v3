'use server';

// TODO: All functions in this file are temporarily disabled due to Prisma removal
// These need to be reimplemented with direct Supabase queries

import { CreateOrderInput, CancelOrderInput, CheckInSignsInput, EditSignsInput } from './types';
import { OrderStatus, OrderAction } from './stateMachine';
import { DocumentType } from './documents/generator';

export async function createOrder(data: CreateOrderInput) {
  throw new Error('Order creation temporarily disabled - Prisma removed');
}

export async function advanceOrderStatus(orderId: string, action: OrderAction) {
  throw new Error('Order status advancement temporarily disabled - Prisma removed');
}

export async function cancelOrder(input: CancelOrderInput) {
  throw new Error('Order cancellation temporarily disabled - Prisma removed');
}

export async function checkInSigns(input: CheckInSignsInput) {
  throw new Error('Sign check-in temporarily disabled - Prisma removed');
}

export async function editOrderSigns(input: EditSignsInput) {
  throw new Error('Order sign editing temporarily disabled - Prisma removed');
}

export async function getOrdersByStatus(status?: OrderStatus) {
  throw new Error('Order fetching temporarily disabled - Prisma removed');
}

export async function generateDocument(orderId: string, type: DocumentType) {
  throw new Error('Document generation temporarily disabled - Prisma removed');
}

export async function generatePickTicket(orderId: string) {
  throw new Error('Pick ticket generation temporarily disabled - Prisma removed');
}

export async function generateOrderSummary(orderId: string) {
  throw new Error('Order summary generation temporarily disabled - Prisma removed');
}

export async function generatePickupChecklist(orderId: string) {
  throw new Error('Pickup checklist generation temporarily disabled - Prisma removed');
}