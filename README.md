# YardCard Elite v3 🏡

A modern, multi-tenant yard sign rental platform built with Next.js 15, Prisma, and Clerk authentication.

## 🚀 Features

### Multi-Tenant Architecture
- **Agency Management**: Independent agencies with their own subdomains
- **Custom Branding**: Agency-specific themes and configurations
- **Isolated Data**: Row-Level Security (RLS) for complete tenant isolation

### Order Management System
- **Complete Lifecycle**: From booking to deployment to return
- **Status Tracking**: Pending → Processing → Deployed → Completed
- **Document Generation**: Automated PDF creation for pick tickets, order summaries, and pickup checklists
- **Mobile Check-In**: Field-optimized interface for sign returns

### Dashboard & Analytics
- **Real-Time Metrics**: Orders, revenue, popular signs
- **Performance Tracking**: Monthly comparisons and trends
- **Visual Analytics**: Color-coded status indicators and progress tracking

### Sign Library & Inventory
- **Comprehensive Catalog**: Categorized signs with themes and occasions
- **Inventory Management**: Real-time availability tracking
- **Bundle Support**: Package deals and grouped offerings

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (multi-tenant aware)
- **Payments**: Stripe Connect for multi-vendor support
- **Styling**: Tailwind CSS v4
- **Storage**: Vercel Blob for documents and images
- **Email**: Resend for transactional emails

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account for authentication
- Stripe account for payments
- Vercel account for blob storage (optional)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/THuebbe/YCE-v3.git
   cd YCE-v3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your credentials:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/database"
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
   CLERK_SECRET_KEY=sk_test_xxxxxxxx
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_xxxxxxxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxx
   
   # Vercel Blob (for document generation)
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxx
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Agency dashboard
│   └── api/               # API endpoints
├── features/              # Feature-based organization
│   ├── auth/              # Authentication logic
│   ├── dashboard/         # Dashboard metrics & components
│   ├── orders/            # Order management system
│   └── payments/          # Stripe integration
├── shared/                # Shared components & utilities
│   ├── components/        # Reusable UI components
│   └── types/             # TypeScript type definitions
└── lib/                   # Core utilities
    ├── db/                # Database connection & queries
    ├── auth/              # Authentication utilities
    └── storage/           # File storage services
```

## 📄 Document Generation

The platform includes a comprehensive PDF document generation system:

- **Pick Tickets**: Field deployment checklists
- **Order Summaries**: Customer invoices and receipts
- **Pickup Checklists**: Sign return and condition tracking

Documents are automatically generated during order status transitions and stored securely in Vercel Blob.

## 🔒 Security Features

- **Row-Level Security (RLS)**: Database-level tenant isolation
- **Authentication**: Clerk-powered secure login
- **Authorization**: Role-based access control
- **Data Encryption**: Secure handling of sensitive information

## 🌐 Multi-Tenant Subdomains

Each agency gets their own subdomain:
- `agency-name.yardcardelite.com` - Customer booking site
- `dashboard.yardcardelite.com` - Agency management portal

## 📊 Order Lifecycle

```
Pending → Processing → Deployed → Completed
   ↓         ↓          ↓         ↓
Pick Ticket → Order → Mobile → Final
Generation   Summary  Check-in  Report
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary. All rights reserved.

## 🚨 Production Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Manual Deployment
```bash
npm run build
npm start
```

## 📞 Support

For support and questions, please contact the development team.

---

Built with ❤️ for efficient yard sign rental management.
