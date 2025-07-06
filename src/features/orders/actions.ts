'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getCurrentTenant } from '@/lib/tenant-context';
import { auth } from '@clerk/nextjs/server';
import { OrderStatus, OrderAction, getNextStatusForAction, getAvailableActions } from './stateMachine';
import { generateOrderNumber, requireOrder, requireOrderWithDetails, shouldAutoRefund } from './utils';
import { CreateOrderInput, CancelOrderInput, CheckInSignsInput, EditSignsInput } from './types';
import { generateOrderDocument, DocumentType } from './documents/generator';
import { updateOrderDocuments } from './utils';

export async function createOrder(data: CreateOrderInput) {
  const agencyId = await getCurrentTenant();
  const { userId } = await auth();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  if (!userId) {
    throw new Error('Authentication required');
  }

  try {
    // Use transaction for atomicity
    const order = await prisma.$transaction(async (tx) => {
      // Validate that the hold exists and hasn't expired
      const hold = await tx.inventoryHold.findFirst({
        where: {
          id: data.holdId,
          agencyId,
          isActive: true
        },
        include: {
          items: {
            include: {
              sign: true
            }
          }
        }
      });

      if (!hold) {
        throw new Error('Hold not found or has expired');
      }

      // Check if hold is still valid (not expired)
      const now = new Date();
      const holdExpiry = new Date(hold.createdAt.getTime() + 15 * 60 * 1000); // 15 minutes
      
      if (now > holdExpiry) {
        throw new Error('Hold has expired');
      }

      // Generate order numbers
      const { orderNumber, internalNumber } = await generateOrderNumber(agencyId);

      // Calculate totals
      const subtotal = hold.items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
      const total = subtotal; // Add tax/fees here if needed

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          agencyId,
          orderNumber,
          internalNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          eventDate: data.eventDate,
          eventAddress: data.eventAddress,
          eventType: data.eventType,
          specialInstructions: data.specialInstructions,
          subtotal,
          total,
          status: 'pending',
          paymentIntentId: data.paymentIntentId,
          stripePaymentIntentId: data.stripePaymentIntentId,
          createdById: userId
        }
      });

      // Create order items from hold items
      const orderItems = await Promise.all(
        hold.items.map(item => 
          tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              signId: item.signId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.unitPrice * item.quantity
            }
          })
        )
      );

      // Update inventory hold with order ID
      await tx.inventoryHold.update({
        where: { id: hold.id },
        data: { orderId: newOrder.id }
      });

      // Create initial order activity
      await tx.orderActivity.create({
        data: {
          orderId: newOrder.id,
          userId,
          action: 'created',
          status: 'pending',
          notes: 'Order created from booking'
        }
      });

      // TODO: Send order confirmation email
      // await EmailService.sendOrderConfirmation(newOrder);

      return newOrder;
    });

    // Revalidate the dashboard orders
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');

    return order;

  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create order');
  }
}

export async function advanceOrderStatus(orderId: string, action: OrderAction) {
  const agencyId = await getCurrentTenant();
  const { userId } = await auth();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  if (!userId) {
    throw new Error('Authentication required');
  }

  try {
    const order = await requireOrder(orderId);

    // Validate action is available for current status
    const availableActions = getAvailableActions(order.status as OrderStatus);
    if (!availableActions.includes(action)) {
      throw new Error(`Action ${action} not available for status ${order.status}`);
    }

    // Get next status
    const nextStatus = getNextStatusForAction(order.status as OrderStatus, action);
    if (!nextStatus) {
      throw new Error(`Invalid action ${action} for status ${order.status}`);
    }

    let updateData: any = { status: nextStatus };
    let activityNotes = '';

    // Handle specific actions
    switch (action) {
      case 'generatePickTicket':
        try {
          const result = await generateOrderDocument(orderId, 'pickTicket');
          await updateOrderDocuments(orderId, {
            type: result.type,
            url: result.url,
            filename: result.filename,
            generatedAt: result.generatedAt.toISOString()
          });
          activityNotes = 'Pick ticket generated and saved';
        } catch (error) {
          console.error('Error generating pick ticket:', error);
          activityNotes = 'Pick ticket generation failed - advancing status anyway';
        }
        break;

      case 'printOrderSummary':
        try {
          const result = await generateOrderDocument(orderId, 'orderSummary');
          await updateOrderDocuments(orderId, {
            type: result.type,
            url: result.url,
            filename: result.filename,
            generatedAt: result.generatedAt.toISOString()
          });
          activityNotes = 'Order summary generated and ready for deployment';
        } catch (error) {
          console.error('Error generating order summary:', error);
          activityNotes = 'Order summary generation failed - advancing status anyway';
        }
        break;

      case 'markDeployed':
        updateData.deployedAt = new Date();
        activityNotes = 'Order marked as deployed';
        break;

      case 'checkInSigns':
        updateData.completedAt = new Date();
        activityNotes = 'Signs checked in, order completed';
        break;

      case 'cancel':
        updateData.cancelledAt = new Date();
        activityNotes = 'Order cancelled';
        break;

      default:
        activityNotes = `Status changed to ${nextStatus}`;
    }

    // Update order in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: updateData
      });

      // Create activity log
      await tx.orderActivity.create({
        data: {
          orderId,
          userId,
          action,
          status: nextStatus,
          notes: activityNotes
        }
      });

      return updated;
    });

    // Revalidate pages
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');

    return updatedOrder;

  } catch (error) {
    console.error('Error advancing order status:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update order status');
  }
}

export async function cancelOrder(input: CancelOrderInput) {
  const agencyId = await getCurrentTenant();
  const { userId } = await auth();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  if (!userId) {
    throw new Error('Authentication required');
  }

  try {
    const order = await requireOrder(input.orderId);

    // Check if order can be cancelled
    if (['completed', 'cancelled'].includes(order.status)) {
      throw new Error('Cannot cancel completed or already cancelled order');
    }

    const shouldRefund = shouldAutoRefund(order);
    let refundAmount = 0;

    // Calculate refund amount
    if (input.refundType === 'full') {
      refundAmount = Number(order.total);
    } else if (input.refundType === 'partial' && input.refundAmount) {
      refundAmount = Math.min(input.refundAmount, Number(order.total));
    }

    // Update order in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: input.orderId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          refundAmount: refundAmount,
          cancellationReason: input.reason
        }
      });

      // Create activity log
      await tx.orderActivity.create({
        data: {
          orderId: input.orderId,
          userId,
          action: 'cancel',
          status: 'cancelled',
          notes: `Order cancelled${input.reason ? `: ${input.reason}` : ''}${refundAmount > 0 ? ` (Refund: $${refundAmount / 100})` : ''}`
        }
      });

      // TODO: Process refund via Stripe if refundAmount > 0
      if (refundAmount > 0 && order.stripePaymentIntentId) {
        // await processRefund(order.stripePaymentIntentId, refundAmount);
      }

      return updated;
    });

    // Revalidate pages
    revalidatePath(`/dashboard/orders/${input.orderId}`);
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');

    return updatedOrder;

  } catch (error) {
    console.error('Error cancelling order:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to cancel order');
  }
}

export async function checkInSigns(input: CheckInSignsInput) {
  const agencyId = await getCurrentTenant();
  const { userId } = await auth();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  if (!userId) {
    throw new Error('Authentication required');
  }

  try {
    const order = await requireOrder(input.orderId);

    if (order.status !== 'deployed') {
      throw new Error('Order must be deployed to check in signs');
    }

    // Update order and create check-in records
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: input.orderId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      // Create check-in records for each sign
      await Promise.all(
        input.signCheckins.map(checkin => 
          tx.signCheckIn.create({
            data: {
              orderId: input.orderId,
              signId: checkin.signId,
              condition: checkin.condition,
              notes: checkin.notes,
              damagePhotos: checkin.damagePhotos || [],
              checkedInById: userId
            }
          })
        )
      );

      // Create activity log
      await tx.orderActivity.create({
        data: {
          orderId: input.orderId,
          userId,
          action: 'checkInSigns',
          status: 'completed',
          notes: `Signs checked in${input.additionalNotes ? `: ${input.additionalNotes}` : ''}`
        }
      });

      return updated;
    });

    // Revalidate pages
    revalidatePath(`/dashboard/orders/${input.orderId}`);
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');

    return updatedOrder;

  } catch (error) {
    console.error('Error checking in signs:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to check in signs');
  }
}

export async function editOrderSigns(input: EditSignsInput) {
  const agencyId = await getCurrentTenant();
  const { userId } = await auth();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  if (!userId) {
    throw new Error('Authentication required');
  }

  try {
    const order = await requireOrder(input.orderId);

    if (['completed', 'cancelled'].includes(order.status)) {
      throw new Error('Cannot edit signs for completed or cancelled orders');
    }

    // Update order items in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      let changes = [];

      // Handle additions
      if (input.changes.add) {
        for (const addition of input.changes.add) {
          const existingItem = await tx.orderItem.findFirst({
            where: {
              orderId: input.orderId,
              signId: addition.signId
            }
          });

          if (existingItem) {
            // Update existing item
            await tx.orderItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: existingItem.quantity + addition.quantity,
                lineTotal: Number(existingItem.unitPrice) * (existingItem.quantity + addition.quantity)
              }
            });
            changes.push(`Added ${addition.quantity} more of sign ${addition.signId}`);
          } else {
            // Create new item
            const sign = await tx.sign.findUnique({
              where: { id: addition.signId },
              select: { rentalPrice: true }
            });

            if (!sign) {
              throw new Error(`Sign ${addition.signId} not found`);
            }

            await tx.orderItem.create({
              data: {
                orderId: input.orderId,
                signId: addition.signId,
                quantity: addition.quantity,
                unitPrice: sign.rentalPrice,
                lineTotal: sign.rentalPrice * addition.quantity
              }
            });
            changes.push(`Added ${addition.quantity} of sign ${addition.signId}`);
          }
        }
      }

      // Handle removals
      if (input.changes.remove) {
        for (const removal of input.changes.remove) {
          const existingItem = await tx.orderItem.findFirst({
            where: {
              orderId: input.orderId,
              signId: removal.signId
            }
          });

          if (existingItem) {
            const newQuantity = existingItem.quantity - removal.quantity;
            if (newQuantity <= 0) {
              await tx.orderItem.delete({
                where: { id: existingItem.id }
              });
              changes.push(`Removed sign ${removal.signId}`);
            } else {
              await tx.orderItem.update({
                where: { id: existingItem.id },
                data: {
                  quantity: newQuantity,
                  lineTotal: Number(existingItem.unitPrice) * newQuantity
                }
              });
              changes.push(`Removed ${removal.quantity} of sign ${removal.signId}`);
            }
          }
        }
      }

      // Handle updates
      if (input.changes.update) {
        for (const update of input.changes.update) {
          const existingItem = await tx.orderItem.findFirst({
            where: {
              orderId: input.orderId,
              signId: update.signId
            }
          });

          if (existingItem) {
            await tx.orderItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: update.newQuantity,
                lineTotal: Number(existingItem.unitPrice) * update.newQuantity
              }
            });
            changes.push(`Updated sign ${update.signId} to ${update.newQuantity} quantity`);
          }
        }
      }

      // Recalculate order totals
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: input.orderId }
      });

      const newSubtotal = orderItems.reduce((total, item) => total + Number(item.lineTotal), 0);
      const newTotal = newSubtotal; // Add tax/fees if needed

      const updated = await tx.order.update({
        where: { id: input.orderId },
        data: {
          subtotal: newSubtotal,
          total: newTotal
        }
      });

      // Create activity log
      await tx.orderActivity.create({
        data: {
          orderId: input.orderId,
          userId,
          action: 'editSigns',
          status: order.status,
          notes: `Signs edited: ${changes.join(', ')}${input.reason ? ` (Reason: ${input.reason})` : ''}`
        }
      });

      return updated;
    });

    // Revalidate pages
    revalidatePath(`/dashboard/orders/${input.orderId}`);
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');

    return updatedOrder;

  } catch (error) {
    console.error('Error editing order signs:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to edit order signs');
  }
}

export async function getOrdersByStatus(status?: OrderStatus) {
  const agencyId = await getCurrentTenant();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        agencyId,
        ...(status && { status })
      },
      include: {
        orderItems: {
          include: {
            sign: {
              select: {
                id: true,
                name: true,
                category: true,
                imageUrl: true
              }
            }
          }
        },
        agency: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return orders;

  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }
}

// Document generation functions
export async function generateDocument(orderId: string, type: DocumentType) {
  const agencyId = await getCurrentTenant();
  const { userId } = await auth();
  
  if (!agencyId) {
    throw new Error('No tenant context available');
  }

  if (!userId) {
    throw new Error('Authentication required');
  }

  try {
    // Verify order access
    await requireOrder(orderId);

    // Generate the document
    const result = await generateOrderDocument(orderId, type);
    
    // Update the order with the new document
    await updateOrderDocuments(orderId, {
      type: result.type,
      url: result.url,
      filename: result.filename,
      generatedAt: result.generatedAt.toISOString()
    });

    // Create activity log
    await prisma.orderActivity.create({
      data: {
        orderId,
        userId,
        action: `generate${type.charAt(0).toUpperCase() + type.slice(1)}`,
        status: 'completed',
        notes: `${result.type} document generated: ${result.filename}`
      }
    });

    // Revalidate the order pages
    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/orders/${orderId}`);

    return { success: true, result };
  } catch (error) {
    console.error('Error generating document:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
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