# Order Document Generation System

This system generates PDF documents for order management operations using PDFKit and stores them in Vercel Blob storage.

## Document Types

### 1. Pick Ticket (`pickTicket`)
- **Purpose**: Used by field teams to gather signs for deployment
- **Contains**: Customer info, event details, itemized sign list with checkboxes
- **Generated**: When order status advances from 'pending' to 'processing'

### 2. Order Summary (`orderSummary`)
- **Purpose**: Complete order invoice/receipt for customer and internal records
- **Contains**: Full order details, pricing breakdown, payment information
- **Generated**: When order status advances from 'processing' to 'deployed'

### 3. Pickup Checklist (`pickupChecklist`)
- **Purpose**: Used for sign return/check-in process
- **Contains**: Sign condition tracking, damage assessment, late fee calculation
- **Generated**: Manual generation for deployed orders

## Technical Implementation

### Core Components

- **Generator Service** (`generator.ts`): Main PDF generation logic using PDFKit
- **Storage Service** (`vercel-blob.ts`): File upload and management via Vercel Blob
- **Server Actions** (`../actions.ts`): Document generation endpoints
- **UI Components** (`../components/order-details.tsx`): Document generation interface

### PDF Features

- Professional layout with company branding
- Structured data presentation
- Checkboxes and form fields for manual completion
- Proper metadata and accessibility tags
- Error handling with HTML fallback generation

### Storage & Access

- Documents stored in Vercel Blob with public access
- Unique filenames with timestamps to prevent conflicts
- URL-based access for downloads
- Document metadata stored in order records

## Setup Requirements

### Environment Variables
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxx
```

### Dependencies
```bash
pnpm add pdfkit @types/pdfkit @vercel/blob
```

## Usage

### Automatic Generation
Documents are automatically generated during order status transitions:
- Pick Ticket: `pending` → `processing`
- Order Summary: `processing` → `deployed`

### Manual Generation
Users can generate documents on-demand from the order details page:
```typescript
const result = await generatePickTicket(orderId);
const result = await generateOrderSummary(orderId);
const result = await generatePickupChecklist(orderId);
```

### Document Access
Generated documents are accessible via:
1. Direct URL from the document generation result
2. Order details page document section
3. Stored in order.documents JSON field

## Error Handling

- PDF generation failures fall back to HTML versions
- Storage failures are logged and user-notified
- Order status progression continues even if document generation fails
- Comprehensive error boundaries and user feedback

## Future Enhancements

- [ ] Custom branding/templates per agency
- [ ] Email delivery integration
- [ ] Batch document generation
- [ ] Document versioning and history
- [ ] Digital signatures for pickup checklists
- [ ] Mobile-optimized document viewing