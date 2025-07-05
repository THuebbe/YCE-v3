import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Your agency ID from the debug output
const WEST_BRANCH_AGENCY_ID = 'cmcpq75r40000q8x9umnkdn4s';

// Utility functions
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(startDays: number, endDays: number): Date {
  const start = new Date();
  start.setDate(start.getDate() + startDays);
  const end = new Date();
  end.setDate(end.getDate() + endDays);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

// Sample data
const CUSTOMER_NAMES = [
  'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Thompson', 
  'Jessica Williams', 'Robert Kim', 'Ashley Davis', 'Christopher Lee',
  'Amanda Wilson', 'Matthew Garcia', 'Lauren Martinez', 'James Anderson',
  'Nicole Brown', 'Daniel Miller', 'Rachel Taylor', 'Kevin Moore',
  'Stephanie Jackson', 'Brian Wilson', 'Jennifer White', 'Andrew Harris',
  'Maria Lopez', 'Thomas Clark', 'Lisa Turner', 'John Parker',
  'Michelle Evans', 'Ryan Murphy', 'Karen Phillips', 'Steven Carter'
];

const DELIVERY_TIMES = ['morning', 'afternoon', 'evening'];
const ORDER_STATUSES = ['pending', 'processing', 'deployed', 'completed', 'cancelled'];

async function createInventory() {
  console.log('📦 Creating inventory for West Branch...');
  
  // Get all available signs
  const signs = await prisma.sign.findMany();
  
  let inventoryCount = 0;
  
  for (const sign of signs) {
    const quantity = randomBetween(15, 80);
    const deployed = randomBetween(0, Math.floor(quantity * 0.25));
    const allocated = randomBetween(0, Math.floor((quantity - deployed) * 0.15));
    const available = quantity - deployed - allocated;
    
    // Check if inventory already exists
    const existingInventory = await prisma.inventory.findUnique({
      where: {
        agencyId_signId: {
          agencyId: WEST_BRANCH_AGENCY_ID,
          signId: sign.id
        }
      }
    });
    
    if (!existingInventory) {
      await prisma.inventory.create({
        data: {
          agencyId: WEST_BRANCH_AGENCY_ID,
          signId: sign.id,
          quantity,
          availableQuantity: available,
          allocatedQuantity: allocated,
          deployedQuantity: deployed
        }
      });
      inventoryCount++;
    }
  }
  
  console.log(`✅ Created ${inventoryCount} inventory records for West Branch`);
}

async function createOrders() {
  console.log('📋 Creating orders for West Branch...');
  
  const signs = await prisma.sign.findMany();
  const orderCount = randomBetween(45, 65);
  
  for (let i = 0; i < orderCount; i++) {
    const orderNumber = `WB${String(i + 1).padStart(4, '0')}`;
    const internalNumber = `AG004-${orderNumber}`;
    
    // Varied order dates and statuses
    let eventDate: Date;
    let status: string;
    let createdAt: Date;
    
    if (i < orderCount * 0.55) {
      // 55% past orders (completed or cancelled)
      eventDate = randomPastDate(120);
      status = randomFromArray(['completed', 'completed', 'completed', 'cancelled']);
      createdAt = new Date(eventDate.getTime() - randomBetween(7, 30) * 24 * 60 * 60 * 1000);
    } else if (i < orderCount * 0.75) {
      // 20% current/recent orders (various statuses)
      eventDate = randomDate(-5, 5);
      status = randomFromArray(['pending', 'processing', 'deployed']);
      createdAt = new Date(eventDate.getTime() - randomBetween(1, 10) * 24 * 60 * 60 * 1000);
    } else {
      // 25% future orders
      eventDate = randomDate(6, 45);
      status = randomFromArray(['pending', 'processing']);
      createdAt = randomPastDate(20);
    }
    
    const customerName = randomFromArray(CUSTOMER_NAMES);
    const customerEmail = `${customerName.replace(' ', '.').toLowerCase()}@email.com`;
    
    const subtotal = randomBetween(85, 280);
    const extraDays = randomBetween(0, 4);
    const extraDayFee = extraDays * randomBetween(8, 12);
    const lateFee = status === 'completed' && Math.random() < 0.08 ? randomBetween(20, 30) : 0;
    const total = subtotal + extraDayFee + lateFee;
    
    const order = await prisma.order.create({
      data: {
        agencyId: WEST_BRANCH_AGENCY_ID,
        orderNumber,
        internalNumber,
        customerName,
        customerEmail,
        customerPhone: `(${randomBetween(200, 999)}) ${randomBetween(100, 999)}-${randomBetween(1000, 9999)}`,
        eventDate,
        deliveryTime: randomFromArray(DELIVERY_TIMES),
        deliveryNotes: Math.random() < 0.25 ? 'Please call upon arrival' : null,
        message: Math.random() < 0.7 ? `Happy ${randomFromArray(['Birthday', 'Anniversary', 'Graduation', 'Wedding'])} ${customerName.split(' ')[0]}!` : null,
        status,
        subtotal,
        extraDays,
        extraDayFee,
        lateFee,
        total,
        paymentStatus: status === 'completed' ? 'paid' : status === 'cancelled' ? 'refunded' : 'pending',
        eventAddress: {
          street: `${randomBetween(100, 9999)} ${randomFromArray(['Main', 'Oak', 'Elm', 'First', 'Second', 'Park', 'Maple', 'Cedar'])} ${randomFromArray(['St', 'Ave', 'Dr', 'Ln', 'Ct'])}`,
          city: 'Your City',
          state: 'ST',
          zip: '12345'
        },
        createdAt,
        updatedAt: createdAt,
        completedAt: status === 'completed' ? eventDate : null,
        cancelledAt: status === 'cancelled' ? createdAt : null
      }
    });
    
    // Create order items
    const itemCount = randomBetween(1, 3);
    for (let j = 0; j < itemCount; j++) {
      const sign = randomFromArray(signs);
      const quantity = randomBetween(1, 6);
      const unitPrice = randomBetween(18, 35);
      const lineTotal = quantity * unitPrice;
      
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          signId: sign.id,
          quantity,
          unitPrice,
          lineTotal
        }
      });
    }
    
    // Create transaction for completed orders
    if (status === 'completed') {
      const grossAmount = total;
      const platformFee = Math.round(grossAmount * 0.05); // 5% platform fee
      const stripeFee = Math.round(grossAmount * 0.029 + 30); // Stripe fees
      const netAmount = grossAmount - platformFee - stripeFee;
      
      await prisma.transaction.create({
        data: {
          agencyId: WEST_BRANCH_AGENCY_ID,
          orderId: order.id,
          grossAmount,
          platformFee,
          stripeFee,
          netAmount,
          processingType: 'connect',
          stripePaymentId: `pi_${Math.random().toString(36).substring(7)}`,
          status: 'completed',
          releasedAt: order.completedAt
        }
      });
    }
  }
  
  console.log(`✅ Created ${orderCount} orders for West Branch`);
}

async function updateAgencyCounter() {
  console.log('🔄 Updating order counter...');
  
  const orderCount = await prisma.order.count({
    where: { agencyId: WEST_BRANCH_AGENCY_ID }
  });
  
  await prisma.agency.update({
    where: { id: WEST_BRANCH_AGENCY_ID },
    data: { orderCounter: orderCount }
  });
  
  console.log(`✅ Updated order counter to ${orderCount}`);
}

async function main() {
  console.log('🌱 Seeding data for YardCard Elite West Branch...');
  
  try {
    // Check if agency exists
    const agency = await prisma.agency.findUnique({
      where: { id: WEST_BRANCH_AGENCY_ID }
    });
    
    if (!agency) {
      console.error('❌ West Branch agency not found');
      return;
    }
    
    console.log(`🏢 Seeding data for: ${agency.name}`);
    
    await createInventory();
    await createOrders();
    await updateAgencyCounter();
    
    // Get final stats
    const stats = await Promise.all([
      prisma.inventory.count({ where: { agencyId: WEST_BRANCH_AGENCY_ID } }),
      prisma.order.count({ where: { agencyId: WEST_BRANCH_AGENCY_ID } }),
      prisma.order.count({ where: { agencyId: WEST_BRANCH_AGENCY_ID, status: 'completed' } }),
      prisma.order.count({ where: { agencyId: WEST_BRANCH_AGENCY_ID, status: 'pending' } }),
      prisma.order.count({ where: { agencyId: WEST_BRANCH_AGENCY_ID, status: 'processing' } }),
      prisma.order.count({ where: { agencyId: WEST_BRANCH_AGENCY_ID, status: 'deployed' } })
    ]);
    
    console.log('\n🎉 West Branch seeding completed!');
    console.log(`\n📊 Your Agency Stats:`);
    console.log(`   • ${stats[0]} inventory items`);
    console.log(`   • ${stats[1]} total orders`);
    console.log(`   • ${stats[2]} completed orders`);
    console.log(`   • ${stats[3]} pending orders`);
    console.log(`   • ${stats[4]} processing orders`);
    console.log(`   • ${stats[5]} deployed orders`);
    console.log(`\n🔗 Your Dashboard: http://yardcard-elite-west-branch.localhost:3000/dashboard`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});