import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// West Branch Agency ID from the seed script
const WEST_BRANCH_AGENCY_ID = 'cmcpq75r40000q8x9umnkdn4s';

// Test customer names that were seeded (to identify test orders)
const TEST_CUSTOMER_NAMES = [
  'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Thompson', 
  'Jessica Williams', 'Robert Kim', 'Ashley Davis', 'Christopher Lee',
  'Amanda Wilson', 'Matthew Garcia', 'Lauren Martinez', 'James Anderson',
  'Nicole Brown', 'Daniel Miller', 'Rachel Taylor', 'Kevin Moore',
  'Stephanie Jackson', 'Brian Wilson', 'Jennifer White', 'Andrew Harris',
  'Maria Lopez', 'Thomas Clark', 'Lisa Turner', 'John Parker',
  'Michelle Evans', 'Ryan Murphy', 'Karen Phillips', 'Steven Carter'
];

async function cleanupTestData() {
  console.log('🧹 Starting cleanup of test/seed data...');
  console.log(`🎯 Target Agency ID: ${WEST_BRANCH_AGENCY_ID}`);
  
  try {
    // 1. Get test orders to delete (by customer names and order number pattern)
    console.log('\n📋 Finding test orders...');
    const testOrders = await prisma.order.findMany({
      where: {
        AND: [
          { agencyId: WEST_BRANCH_AGENCY_ID },
          {
            OR: [
              { customerName: { in: TEST_CUSTOMER_NAMES } },
              { orderNumber: { startsWith: 'WB' } }, // WB0001, WB0002, etc.
              { internalNumber: { startsWith: 'AG004-WB' } }
            ]
          }
        ]
      },
      include: {
        orderItems: true
      }
    });
    
    console.log(`Found ${testOrders.length} test orders to delete`);
    
    // 2. Delete related data first (due to foreign key constraints)
    if (testOrders.length > 0) {
      const orderIds = testOrders.map(order => order.id);
      
      // Delete transactions first
      console.log('\n🗑️  Deleting transactions...');
      const { count: transactionsDeleted } = await prisma.transaction.deleteMany({
        where: {
          orderId: { in: orderIds }
        }
      });
      console.log(`✅ Deleted ${transactionsDeleted} transactions`);
      
      // Delete order items
      console.log('\n🗑️  Deleting order items...');
      const { count: itemsDeleted } = await prisma.orderItem.deleteMany({
        where: {
          orderId: { in: orderIds }
        }
      });
      console.log(`✅ Deleted ${itemsDeleted} order items`);
      
      // Note: No deployment table exists in schema, skipping
      
      // Finally delete the orders
      console.log('\n🗑️  Deleting test orders...');
      const { count: ordersDeleted } = await prisma.order.deleteMany({
        where: {
          id: { in: orderIds }
        }
      });
      console.log(`✅ Deleted ${ordersDeleted} test orders`);
    }
    
    // 4. Reset inventory quantities to zero or remove test inventory
    console.log('\n📦 Cleaning up test inventory...');
    const inventoryUpdated = await prisma.inventory.updateMany({
      where: {
        agencyId: WEST_BRANCH_AGENCY_ID
      },
      data: {
        quantity: 0,
        availableQuantity: 0,
        allocatedQuantity: 0,
        deployedQuantity: 0
      }
    });
    
    console.log(`✅ Reset ${inventoryUpdated.count} inventory records`);
    
    // 5. Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const remainingOrders = await prisma.order.count({
      where: { agencyId: WEST_BRANCH_AGENCY_ID }
    });
    
    const remainingItems = await prisma.orderItem.count({
      where: {
        order: { agencyId: WEST_BRANCH_AGENCY_ID }
      }
    });
    
    console.log(`\n✅ Cleanup completed successfully!`);
    console.log(`📊 Remaining orders: ${remainingOrders}`);
    console.log(`📊 Remaining order items: ${remainingItems}`);
    
    if (remainingOrders === 0) {
      console.log(`🎉 All test data has been removed. The dashboard will now show empty states for new orders.`);
    } else {
      console.log(`ℹ️  ${remainingOrders} orders remain (these may be real orders, not test data)`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Backup function to show what would be deleted (dry run)
async function previewCleanup() {
  console.log('👁️  Preview of data that would be deleted:');
  
  const testOrders = await prisma.order.findMany({
    where: {
      AND: [
        { agencyId: WEST_BRANCH_AGENCY_ID },
        {
          OR: [
            { customerName: { in: TEST_CUSTOMER_NAMES } },
            { orderNumber: { startsWith: 'WB' } },
            { internalNumber: { startsWith: 'AG004-WB' } }
          ]
        }
      ]
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      status: true,
      total: true,
      eventDate: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  console.log(`\n📊 Found ${testOrders.length} test orders. Here are the first 10:`);
  testOrders.forEach((order, index) => {
    console.log(`${index + 1}. ${order.orderNumber} - ${order.customerName} - $${order.total} - ${order.status}`);
  });
  
  const inventoryCount = await prisma.inventory.count({
    where: { agencyId: WEST_BRANCH_AGENCY_ID }
  });
  
  console.log(`\n📦 Found ${inventoryCount} inventory records that will be reset to zero`);
  
  await prisma.$disconnect();
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--preview')) {
    await previewCleanup();
  } else if (args.includes('--confirm')) {
    await cleanupTestData();
  } else {
    console.log(`
🧹 YardCard Elite Test Data Cleanup Script

Usage:
  npm run cleanup:preview  - Show what data would be deleted (safe)
  npm run cleanup:confirm  - Actually delete the test data (destructive)

This script will remove:
  ✅ All test orders with customer names from the seed script
  ✅ All orders with WB#### order numbers 
  ✅ All related order items
  ✅ Reset inventory quantities to zero

⚠️  Make sure to backup your database before running with --confirm!
    `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { cleanupTestData, previewCleanup };