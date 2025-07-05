import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// Sample data arrays
const SIGN_CATEGORIES = [
  'Birthday', 'Graduation', 'Anniversary', 'Wedding', 'Baby Shower',
  'Real Estate', 'Business', 'Holiday', 'Sports', 'Celebration'
];

const SIGN_THEMES = [
  'Classic', 'Modern', 'Rustic', 'Elegant', 'Fun', 'Professional', 'Festive'
];

const SIGN_HOLIDAYS = [
  'Christmas', 'Halloween', 'Easter', 'New Year', 'Thanksgiving', 
  'Valentine\'s Day', 'Fourth of July', 'Mother\'s Day', 'Father\'s Day'
];

const CUSTOMER_NAMES = [
  'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Thompson', 
  'Jessica Williams', 'Robert Kim', 'Ashley Davis', 'Christopher Lee',
  'Amanda Wilson', 'Matthew Garcia', 'Lauren Martinez', 'James Anderson',
  'Nicole Brown', 'Daniel Miller', 'Rachel Taylor', 'Kevin Moore',
  'Stephanie Jackson', 'Brian Wilson', 'Jennifer White', 'Andrew Harris'
];

const DELIVERY_TIMES = ['morning', 'afternoon', 'evening'];
const ORDER_STATUSES = ['pending', 'processing', 'deployed', 'completed', 'cancelled'];

// Sign library data
const SAMPLE_SIGNS = [
  {
    name: 'Happy Birthday - Classic',
    category: 'Birthday',
    theme: 'Classic',
    sizeWidth: 24,
    sizeHeight: 18,
    themes: ['Classic', 'Fun'],
    holidays: [],
    keywords: ['birthday', 'party', 'celebration'],
    imageUrl: '/images/signs/birthday-classic.jpg'
  },
  {
    name: 'Congratulations Graduate',
    category: 'Graduation',
    theme: 'Modern',
    sizeWidth: 30,
    sizeHeight: 20,
    themes: ['Modern', 'Elegant'],
    holidays: [],
    keywords: ['graduation', 'congrats', 'achievement'],
    imageUrl: '/images/signs/graduation-modern.jpg'
  },
  {
    name: 'Welcome Home',
    category: 'Celebration',
    theme: 'Rustic',
    sizeWidth: 36,
    sizeHeight: 24,
    themes: ['Rustic', 'Classic'],
    holidays: [],
    keywords: ['welcome', 'home', 'family'],
    imageUrl: '/images/signs/welcome-home.jpg'
  },
  {
    name: 'For Sale - Professional',
    category: 'Real Estate',
    theme: 'Professional',
    sizeWidth: 24,
    sizeHeight: 18,
    themes: ['Professional', 'Modern'],
    holidays: [],
    keywords: ['for sale', 'real estate', 'property'],
    imageUrl: '/images/signs/for-sale-pro.jpg'
  },
  {
    name: 'Open House',
    category: 'Real Estate',
    theme: 'Professional',
    sizeWidth: 18,
    sizeHeight: 24,
    themes: ['Professional'],
    holidays: [],
    keywords: ['open house', 'real estate', 'viewing'],
    imageUrl: '/images/signs/open-house.jpg'
  },
  {
    name: 'Merry Christmas',
    category: 'Holiday',
    theme: 'Festive',
    sizeWidth: 30,
    sizeHeight: 20,
    themes: ['Festive', 'Classic'],
    holidays: ['Christmas'],
    keywords: ['christmas', 'holiday', 'merry'],
    imageUrl: '/images/signs/merry-christmas.jpg'
  },
  {
    name: 'Happy New Year 2024',
    category: 'Holiday',
    theme: 'Festive',
    sizeWidth: 36,
    sizeHeight: 24,
    themes: ['Festive', 'Modern'],
    holidays: ['New Year'],
    keywords: ['new year', 'celebration', '2024'],
    imageUrl: '/images/signs/new-year-2024.jpg'
  },
  {
    name: 'Baby Shower - Pink',
    category: 'Baby Shower',
    theme: 'Fun',
    sizeWidth: 24,
    sizeHeight: 18,
    themes: ['Fun', 'Elegant'],
    holidays: [],
    keywords: ['baby shower', 'pink', 'girl'],
    imageUrl: '/images/signs/baby-shower-pink.jpg'
  },
  {
    name: 'Baby Shower - Blue',
    category: 'Baby Shower',
    theme: 'Fun',
    sizeWidth: 24,
    sizeHeight: 18,
    themes: ['Fun', 'Elegant'],
    holidays: [],
    keywords: ['baby shower', 'blue', 'boy'],
    imageUrl: '/images/signs/baby-shower-blue.jpg'
  },
  {
    name: 'Happy Anniversary',
    category: 'Anniversary',
    theme: 'Elegant',
    sizeWidth: 30,
    sizeHeight: 20,
    themes: ['Elegant', 'Classic'],
    holidays: [],
    keywords: ['anniversary', 'love', 'celebration'],
    imageUrl: '/images/signs/anniversary-elegant.jpg'
  },
  {
    name: 'Wedding Celebration',
    category: 'Wedding',
    theme: 'Elegant',
    sizeWidth: 36,
    sizeHeight: 24,
    themes: ['Elegant', 'Modern'],
    holidays: [],
    keywords: ['wedding', 'marriage', 'celebration'],
    imageUrl: '/images/signs/wedding-celebration.jpg'
  },
  {
    name: 'Grand Opening',
    category: 'Business',
    theme: 'Professional',
    sizeWidth: 48,
    sizeHeight: 24,
    themes: ['Professional', 'Modern'],
    holidays: [],
    keywords: ['grand opening', 'business', 'new'],
    imageUrl: '/images/signs/grand-opening.jpg'
  },
  {
    name: 'Halloween Spooky',
    category: 'Holiday',
    theme: 'Fun',
    sizeWidth: 30,
    sizeHeight: 20,
    themes: ['Fun', 'Festive'],
    holidays: ['Halloween'],
    keywords: ['halloween', 'spooky', 'trick or treat'],
    imageUrl: '/images/signs/halloween-spooky.jpg'
  },
  {
    name: 'Sports Team Victory',
    category: 'Sports',
    theme: 'Fun',
    sizeWidth: 36,
    sizeHeight: 24,
    themes: ['Fun', 'Modern'],
    holidays: [],
    keywords: ['sports', 'victory', 'team'],
    imageUrl: '/images/signs/sports-victory.jpg'
  },
  {
    name: 'Thank You',
    category: 'Celebration',
    theme: 'Classic',
    sizeWidth: 24,
    sizeHeight: 18,
    themes: ['Classic', 'Elegant'],
    holidays: [],
    keywords: ['thank you', 'gratitude', 'appreciation'],
    imageUrl: '/images/signs/thank-you.jpg'
  }
];

// Agency sample data
const SAMPLE_AGENCIES = [
  {
    name: 'Elite Yard Signs Denver',
    slug: 'elite-denver',
    subdomain: 'elite-denver',
    city: 'Denver',
    businessName: 'Elite Yard Signs Denver LLC',
    agencyCode: 'AG001',
    email: 'contact@elite-denver.com',
    phone: '(303) 555-0123',
    address: {
      street: '1234 Main St',
      city: 'Denver',
      state: 'CO',
      zip: '80202'
    },
    orderCounter: 150
  },
  {
    name: 'Sunny Signs California',
    slug: 'sunny-signs-ca',
    subdomain: 'sunny-signs-ca',
    city: 'Los Angeles',
    businessName: 'Sunny Signs California Inc',
    agencyCode: 'AG002',
    email: 'hello@sunnysigns.com',
    phone: '(323) 555-0456',
    address: {
      street: '5678 Sunset Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90028'
    },
    orderCounter: 89
  },
  {
    name: 'Texas Sign Solutions',
    slug: 'texas-signs',
    subdomain: 'texas-signs',
    city: 'Austin',
    businessName: 'Texas Sign Solutions LLC',
    agencyCode: 'AG003',
    email: 'info@texassigns.com',
    phone: '(512) 555-0789',
    address: {
      street: '9012 Ranch Rd',
      city: 'Austin',
      state: 'TX',
      zip: '78701'
    },
    orderCounter: 234
  }
];

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  // Delete in correct order to respect foreign key constraints
  await prisma.transaction.deleteMany({});
  await prisma.orderActivity.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.orderSign.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.inventoryHoldItem.deleteMany({});
  await prisma.inventoryHold.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.sign.deleteMany({});
  await prisma.bundle.deleteMany({});
  await prisma.agency.deleteMany({});
  
  console.log('✅ Database cleared');
}

async function seedSigns() {
  console.log('🎨 Creating sign library...');
  
  const signs = [];
  
  for (const signData of SAMPLE_SIGNS) {
    const sign = await prisma.sign.create({
      data: {
        name: signData.name,
        category: signData.category,
        theme: signData.theme,
        sizeWidth: signData.sizeWidth,
        sizeHeight: signData.sizeHeight,
        dimensions: {
          width: signData.sizeWidth,
          height: signData.sizeHeight,
          unit: 'inches'
        },
        themes: signData.themes,
        holidays: signData.holidays,
        keywords: signData.keywords,
        imageUrl: signData.imageUrl,
        thumbnailUrl: signData.imageUrl.replace('.jpg', '-thumb.jpg'),
        isPlatform: true,
        description: `Professional ${signData.category.toLowerCase()} sign with ${signData.theme.toLowerCase()} styling.`
      }
    });
    
    signs.push(sign);
  }
  
  console.log(`✅ Created ${signs.length} signs`);
  return signs;
}

async function seedAgencies() {
  console.log('🏢 Creating agencies...');
  
  const agencies = [];
  
  for (const agencyData of SAMPLE_AGENCIES) {
    const agency = await prisma.agency.create({
      data: {
        name: agencyData.name,
        slug: agencyData.slug,
        subdomain: agencyData.subdomain,
        city: agencyData.city,
        businessName: agencyData.businessName,
        agencyCode: agencyData.agencyCode,
        email: agencyData.email,
        phone: agencyData.phone,
        address: agencyData.address,
        orderCounter: agencyData.orderCounter,
        isActive: true,
        description: `Premier yard sign rental service in ${agencyData.city}. Quality signs for all your special occasions and business needs.`,
        subscriptionStatus: 'active',
        subscriptionStartDate: randomPastDate(365),
        stripeConnectStatus: 'active',
        pricingConfig: {
          basePrice: randomBetween(75, 125),
          extraDayPrice: randomBetween(8, 15),
          lateFee: randomBetween(20, 35)
        }
      }
    });
    
    agencies.push(agency);
    
    // Create users for each agency
    await prisma.user.create({
      data: {
        email: `admin@${agency.slug}.com`,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        agencyId: agency.id,
        emailVerified: new Date()
      }
    });
    
    await prisma.user.create({
      data: {
        email: `manager@${agency.slug}.com`,
        firstName: 'Manager',
        lastName: 'User',
        role: 'MANAGER',
        agencyId: agency.id,
        emailVerified: new Date()
      }
    });
  }
  
  console.log(`✅ Created ${agencies.length} agencies with users`);
  return agencies;
}

async function seedInventory(agencies: any[], signs: any[]) {
  console.log('📦 Creating inventory...');
  
  let totalInventory = 0;
  
  for (const agency of agencies) {
    // Each agency gets inventory for 80% of available signs
    const agencySigns = signs.slice(0, Math.floor(signs.length * 0.8));
    
    for (const sign of agencySigns) {
      const quantity = randomBetween(10, 100);
      const deployed = randomBetween(0, Math.floor(quantity * 0.3));
      const allocated = randomBetween(0, Math.floor((quantity - deployed) * 0.2));
      const available = quantity - deployed - allocated;
      
      await prisma.inventory.create({
        data: {
          agencyId: agency.id,
          signId: sign.id,
          quantity,
          availableQuantity: available,
          allocatedQuantity: allocated,
          deployedQuantity: deployed
        }
      });
      
      totalInventory++;
    }
  }
  
  console.log(`✅ Created ${totalInventory} inventory records`);
}

async function seedOrders(agencies: any[], signs: any[]) {
  console.log('📋 Creating orders...');
  
  let totalOrders = 0;
  
  for (const agency of agencies) {
    const orderCount = randomBetween(30, 80);
    
    for (let i = 0; i < orderCount; i++) {
      const orderNumber = `${String(i + 1).padStart(4, '0')}`;
      const internalNumber = `${agency.agencyCode}-${orderNumber}`;
      
      // Varied order dates - some past, some future
      let eventDate: Date;
      let status: string;
      let createdAt: Date;
      
      if (i < orderCount * 0.6) {
        // 60% past orders (completed or cancelled)
        eventDate = randomPastDate(90);
        status = randomFromArray(['completed', 'completed', 'completed', 'cancelled']);
        createdAt = new Date(eventDate.getTime() - randomBetween(7, 30) * 24 * 60 * 60 * 1000);
      } else if (i < orderCount * 0.8) {
        // 20% current/recent orders (various statuses)
        eventDate = randomDate(-7, 7);
        status = randomFromArray(['pending', 'processing', 'deployed']);
        createdAt = new Date(eventDate.getTime() - randomBetween(1, 14) * 24 * 60 * 60 * 1000);
      } else {
        // 20% future orders
        eventDate = randomDate(8, 60);
        status = randomFromArray(['pending', 'processing']);
        createdAt = randomPastDate(30);
      }
      
      const customerName = randomFromArray(CUSTOMER_NAMES);
      const customerEmail = `${customerName.replace(' ', '.').toLowerCase()}@email.com`;
      
      const subtotal = randomBetween(75, 350);
      const extraDays = randomBetween(0, 5);
      const extraDayFee = extraDays * randomBetween(8, 15);
      const lateFee = status === 'completed' && Math.random() < 0.1 ? randomBetween(20, 35) : 0;
      const total = subtotal + extraDayFee + lateFee;
      
      const order = await prisma.order.create({
        data: {
          agencyId: agency.id,
          orderNumber,
          internalNumber,
          customerName,
          customerEmail,
          customerPhone: `(${randomBetween(200, 999)}) ${randomBetween(100, 999)}-${randomBetween(1000, 9999)}`,
          eventDate,
          deliveryTime: randomFromArray(DELIVERY_TIMES),
          deliveryNotes: Math.random() < 0.3 ? 'Please call upon arrival' : null,
          message: Math.random() < 0.7 ? `Happy ${randomFromArray(['Birthday', 'Anniversary', 'Graduation'])} ${customerName.split(' ')[0]}!` : null,
          status,
          subtotal,
          extraDays,
          extraDayFee,
          lateFee,
          total,
          paymentStatus: status === 'completed' ? 'paid' : status === 'cancelled' ? 'refunded' : 'pending',
          eventAddress: {
            street: `${randomBetween(100, 9999)} ${randomFromArray(['Main', 'Oak', 'Elm', 'First', 'Second'])} St`,
            city: agency.city,
            state: agency.address.state,
            zip: agency.address.zip
          },
          createdAt,
          updatedAt: createdAt,
          completedAt: status === 'completed' ? eventDate : null,
          cancelledAt: status === 'cancelled' ? createdAt : null
        }
      });
      
      // Create order items
      const itemCount = randomBetween(1, 4);
      for (let j = 0; j < itemCount; j++) {
        const sign = randomFromArray(signs);
        const quantity = randomBetween(1, 8);
        const unitPrice = randomBetween(15, 45);
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
            agencyId: agency.id,
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
      
      totalOrders++;
    }
  }
  
  console.log(`✅ Created ${totalOrders} orders with items and transactions`);
}

async function main() {
  console.log('🌱 Starting database seed...');
  
  try {
    await clearDatabase();
    
    const signs = await seedSigns();
    const agencies = await seedAgencies();
    await seedInventory(agencies, signs);
    await seedOrders(agencies, signs);
    
    console.log('🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${signs.length} signs created`);
    console.log(`   • ${agencies.length} agencies created`);
    console.log(`   • ${agencies.length * 2} users created`);
    console.log(`   • Inventory and orders created for testing`);
    console.log('\n🔗 Test URLs:');
    console.log('   • http://elite-denver.localhost:3000/dashboard');
    console.log('   • http://sunny-signs-ca.localhost:3000/dashboard');
    console.log('   • http://texas-signs.localhost:3000/dashboard');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});