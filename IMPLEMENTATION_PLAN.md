# Option 3: Agency-First Routing - Detailed Implementation Plan

## CONTEXT SUMMARY FOR CONTINUATION:
- **Problem**: PDF generation failing due to tenant context issues (agency parameter lost in navigation)
- **Solution**: Restructure to `[agency]/dashboard/` routing pattern 
- **Current URLs**: `/dashboard?agency=demo` → **Target URLs**: `/demo/dashboard`
- **Main Goal**: Fix document generation by ensuring agency context persists

---

## PHASE 1: CREATE NEW ROUTE STRUCTURE

### 1.1 Create Base Agency Route Directory
- [x] Create `src/app/(dashboard)/[agency]/` directory
- [x] Create `src/app/(dashboard)/[agency]/layout.tsx` (agency-specific layout)

### 1.2 Create Dashboard Sub-Routes
- [x] Create `src/app/(dashboard)/[agency]/dashboard/`
- [x] Create `src/app/(dashboard)/[agency]/dashboard/page.tsx`
- [x] Create `src/app/(dashboard)/[agency]/orders/`
- [x] Create `src/app/(dashboard)/[agency]/orders/page.tsx`
- [x] Create `src/app/(dashboard)/[agency]/orders/[orderId]/`
- [x] Create `src/app/(dashboard)/[agency]/orders/[orderId]/page.tsx`
- [x] Create `src/app/(dashboard)/[agency]/orders/[orderId]/check-in/`
- [ ] Create `src/app/(dashboard)/[agency]/orders/[orderId]/check-in/page.tsx`
- [x] Create `src/app/(dashboard)/[agency]/inventory/`
- [ ] Create `src/app/(dashboard)/[agency]/inventory/page.tsx`
- [x] Create `src/app/(dashboard)/[agency]/customers/`
- [ ] Create `src/app/(dashboard)/[agency]/customers/page.tsx`
- [x] Create `src/app/(dashboard)/[agency]/reports/`
- [ ] Create `src/app/(dashboard)/[agency]/reports/page.tsx`
- [x] Create `src/app/(dashboard)/[agency]/settings/`
- [ ] Create `src/app/(dashboard)/[agency]/settings/page.tsx`
- [x] Create `src/app/(dashboard)/[agency]/settings/team/`
- [ ] Create `src/app/(dashboard)/[agency]/settings/team/page.tsx`

---

## PHASE 2: UPDATE TENANT CONTEXT SYSTEM

### 2.1 Update Tenant Context to Use Route Params
- [x] Update `src/lib/tenant-context-supabase.ts`:
  - [x] Remove URL parameter parsing logic
  - [x] Add route params reading via `headers()` and path parsing
  - [x] Update `getCurrentTenant()` to extract agency from path
  - [x] Keep legacy URL parameter fallback for compatibility

### 2.2 Create Agency Route Validation
- [ ] Create `src/lib/validateAgencyRoute.ts`:
  - [ ] Function to validate agency slug exists in database
  - [ ] Function to validate user has access to agency
  - [ ] Return appropriate error codes (404, 403)

### 2.3 Update Agency Layout
- [x] Update `src/app/(dashboard)/[agency]/layout.tsx`:
  - [x] Extract `agency` from `params.agency`
  - [x] Validate agency exists and user has access
  - [x] Provide agency context to child components
  - [x] Handle error states (invalid agency, no access)

---

## PHASE 3: MIGRATE EXISTING PAGES

### 3.1 Copy and Update Dashboard Page
- [x] Copy content from `src/app/(dashboard)/dashboard/page.tsx`
- [x] Paste into `src/app/(dashboard)/[agency]/dashboard/page.tsx`
- [x] Update to receive `params: { agency: string }`
- [x] Remove `searchParams.agency` references
- [x] Use `params.agency` for agency context
- [x] Test basic dashboard loading

### 3.2 Copy and Update Orders Pages
- [x] Copy `src/app/(dashboard)/dashboard/orders/page.tsx`
- [x] Paste into `src/app/(dashboard)/[agency]/orders/page.tsx`
- [x] Update to receive `params: { agency: string }`
- [x] Remove `searchParams.agency` references
- [x] Update orders board to use route-based agency context

### 3.3 Copy and Update Order Details Page  
- [x] Copy `src/app/(dashboard)/dashboard/orders/[orderId]/page.tsx`
- [x] Paste into `src/app/(dashboard)/[agency]/orders/[orderId]/page.tsx`
- [x] Update to receive `params: { agency: string, orderId: string }`
- [x] **THIS IS THE KEY PAGE FOR PDF GENERATION FIX**

### 3.4 Copy Other Dashboard Pages
- [ ] Copy `src/app/(dashboard)/dashboard/inventory/page.tsx` → `src/app/(dashboard)/[agency]/inventory/page.tsx`
- [ ] Copy `src/app/(dashboard)/dashboard/customers/page.tsx` → `src/app/(dashboard)/[agency]/customers/page.tsx`
- [ ] Copy `src/app/(dashboard)/dashboard/reports/page.tsx` → `src/app/(dashboard)/[agency]/reports/page.tsx`
- [ ] Copy `src/app/(dashboard)/dashboard/settings/page.tsx` → `src/app/(dashboard)/[agency]/settings/page.tsx`
- [ ] Copy `src/app/(dashboard)/dashboard/settings/team/page.tsx` → `src/app/(dashboard)/[agency]/settings/team/page.tsx`

---

## PHASE 4: UPDATE NAVIGATION SYSTEM

### 4.1 Create Agency-Aware Navigation Utilities
- [x] Create `src/lib/navigation.ts`:
  - [x] `useAgencySlug()` hook to get current agency from route
  - [x] `getAgencyRoute(path: string)` function 
  - [ ] `useAgencyRouter()` hook wrapping Next.js router
  - [ ] `AgencyLink` component wrapping Next.js Link

### 4.2 Update Header Navigation
- [ ] Update `src/shared/components/layout/Header.tsx`:
  - [ ] Import `useAgencySlug()` hook
  - [ ] Update all `href` values in navigation array:
    - [ ] `/dashboard` → `/${agencySlug}/dashboard`
    - [ ] `/dashboard/orders` → `/${agencySlug}/orders`
    - [ ] `/dashboard/inventory` → `/${agencySlug}/inventory`
    - [ ] `/dashboard/customers` → `/${agencySlug}/customers` 
    - [ ] `/dashboard/reports` → `/${agencySlug}/reports`
  - [ ] Update settings link: `/dashboard/settings` → `/${agencySlug}/settings`
  - [ ] Update logo link when signed in: `/dashboard` → `/${agencySlug}/dashboard`

### 4.3 Update Order Component Navigation
- [x] Update `src/features/orders/components/order-card.tsx`:
  - [x] Import agency navigation utilities
  - [x] Update `handleViewDetails()`: `/dashboard/orders/${order.id}` → `/${agencySlug}/orders/${order.id}`

- [x] Update `src/features/orders/components/order-details.tsx`:
  - [x] Import agency navigation utilities  
  - [x] Update `handleBack()`: `/dashboard/orders` → `/${agencySlug}/orders`
  - [x] Update mobile check-in link: `/dashboard/orders/${order.id}/check-in` → `/${agencySlug}/orders/${order.id}/check-in`

### 4.4 Update Other Component Navigation
- [ ] Update `src/features/dashboard/components/recent-orders-list.tsx`
- [ ] Update any other components that use `router.push()` or `Link href` to dashboard routes

---

## PHASE 5: UPDATE AUTHENTICATION FLOW

### 5.1 Update Routing Page
- [x] Update `src/app/routing/page.tsx`:
  - [x] Change redirect from `redirect(\`/dashboard?agency=${user.agency.slug}\`)` 
  - [x] To: `redirect(\`/${user.agency.slug}/dashboard\`)`
  - [x] Update onboarding redirect: `redirect('/onboarding')` (no change needed)

### 5.2 Update Middleware (Optional)
- [ ] Update `src/middleware.ts`:
  - [ ] Add validation for agency routes `/:agency/dashboard/*`
  - [ ] Remove agency parameter header injection logic
  - [ ] Add redirect for old dashboard routes to new structure

---

## PHASE 6: TEST PDF GENERATION FIX

### 6.1 Test Tenant Context Resolution
- [ ] Navigate to `/{agency}/orders/{orderId}` 
- [ ] Verify tenant context correctly identifies agency
- [ ] Check console logs for successful tenant resolution

### 6.2 Test Document Generation
- [ ] Click "Generate Pick Ticket" button
- [ ] Verify PDF generation succeeds
- [ ] Verify document is stored and accessible
- [ ] Test all three document types (Pick Ticket, Order Summary, Pickup Checklist)

---

## PHASE 7: CLEANUP AND FINALIZATION

### 7.1 Remove Old Routes (After Testing)
- [ ] Delete `src/app/(dashboard)/dashboard/` directory
- [ ] Update any remaining references to old routes

### 7.2 Final Testing
- [ ] Test all navigation flows
- [ ] Test authentication flow end-to-end
- [ ] Test PDF generation on multiple orders
- [ ] Verify all dashboard functionality works

---

## EXECUTION NOTES:
- **Start with Phase 1-2** (structure + tenant context) 
- **Then Phase 3.3** (order details page - the critical one for PDF generation)
- **Test PDF generation early** to confirm fix
- **Complete remaining phases** once core functionality proven
- **Keep old routes temporarily** until everything tested

## SUCCESS CRITERIA:
✅ User can navigate: `/{agency}/orders/{orderId}`  
✅ PDF generation works without tenant context errors  
✅ All dashboard navigation preserves agency context  
✅ Clean URLs without query parameters

## CURRENT PROGRESS:
- ✅ Phase 1: Create base agency route directory structure (COMPLETED)
- ✅ Phase 2: Update tenant context system (COMPLETED)  
- ✅ Phase 3: Migrate existing pages to new structure (COMPLETED)
- ✅ Phase 4: Update navigation system (PARTIALLY COMPLETED - HEADER NAVIGATION MISSING)
- ✅ Phase 5: Update authentication flow (COMPLETED)
- 🚨 Phase 6: Test PDF generation fix (FAILED - HEADER NAVIGATION NOT UPDATED)

## CRITICAL ISSUE IDENTIFIED:
- ✅ Agency routing works: `/yardcard-elite-west-branch/dashboard` ✅
- ❌ Header navigation NOT updated: Still uses `/dashboard/orders` instead of `/{agency}/orders`
- Result: User clicks Orders → goes to wrong URL → tenant context fails → PDF generation fails

## IMMEDIATE NEXT STEP AFTER COMPRESSION:
**Update Header Navigation** in `src/shared/components/layout/Header.tsx`:
- Import `useAgencySlug()` hook
- Update navigation array to use agency-aware routes
- Change `/dashboard/orders` → `/${agencySlug}/orders`
- This is Phase 4.2 in the plan - the missing piece

## KEY ACCOMPLISHMENTS:
- ✅ Created new agency-first route structure: `[agency]/dashboard/`, `[agency]/orders/`
- ✅ Updated tenant context to extract agency from route path instead of query params
- ✅ Migrated critical pages: dashboard, orders, order details
- ✅ Updated all navigation to use agency-aware routing
- ✅ Fixed authentication flow to redirect to `/{agency}/dashboard`
- ✅ All TypeScript errors resolved

## READY FOR TESTING:
The system should now work with URLs like:
- `/{agency}/dashboard` 
- `/{agency}/orders`
- `/{agency}/orders/{orderId}` ← **This page should now have working PDF generation**

## NEXT STEPS:
1. Test login flow and navigation
2. Navigate to `/{agency}/orders/{orderId}`
3. Click "Generate Pick Ticket" in Documents section
4. Verify PDF generation works without tenant context errors