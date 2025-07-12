#Yard Card Rental Platform - Design Style Guide

## Color Palette

### Primary Colors

Primary Purple - #7B3FF2 (Main brand color for key actions and brand identity)
Primary Dark - #1A1D29 (Dark backgrounds and high-contrast elements)

### Secondary Colors

Secondary Purple Light - #9D6FFF (Hover states and interactive elements)
Secondary Purple Pale - #F0E9FF (Subtle backgrounds and selected states)
Secondary Gray - #6B7280 (Secondary text and neutral elements)

### Accent Colors

Accent Green - #10B981 (Success states and positive actions)
Accent Pink - #EC4899 (Celebration elements and special highlights)
Accent Yellow - #F59E0B (Warnings and attention-grabbing elements)
Accent Blue - #3B82F6 (Information and links)

### Functional Colors

Success Green - #059669 (Confirmations and completed actions)
Error Red - #DC2626 (Errors and destructive actions)
Warning Orange - #EA580C (Warnings and cautions)
Info Blue - #0EA5E9 (Informational messages)

### Background Colors

Background White - #FFFFFF (Primary light background)
Background Light - #F9FAFB (Subtle gray background)
Background Gray - #F3F4F6 (Card backgrounds in light mode)
Background Dark - #111827 (Dark mode primary)
Background Dark Surface - #1F2937 (Dark mode cards and surfaces)

### Neutral Colors

Neutral 900 - #111827 (Primary text in light mode)
Neutral 700 - #374151 (Secondary text in light mode)
Neutral 500 - #6B7280 (Tertiary text and placeholders)
Neutral 300 - #D1D5DB (Borders and dividers)
Neutral 100 - #F3F4F6 (Subtle backgrounds)

## Typography

### Font Family

Primary Font: Inter (All platforms)
Fallback Font: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto

### Font Weights

Light: 300
Regular: 400
Medium: 500
Semibold: 600
Bold: 700

### Text Styles

#### Headings

H1: 32px/40px, Bold, Letter spacing -0.025em

- Page titles and major headers
  H2: 28px/36px, Bold, Letter spacing -0.025em
- Section headers
  H3: 24px/32px, Semibold, Letter spacing -0.02em
- Card titles and subsections
  H4: 20px/28px, Semibold, Letter spacing -0.015em
- Minor headers
  H5: 18px/26px, Medium, Letter spacing -0.01em
- Small headers

#### Body Text

Body Large: 18px/28px, Regular, Letter spacing 0

- Primary content and important information
  Body: 16px/24px, Regular, Letter spacing 0
- Standard text throughout the app
  Body Small: 14px/20px, Regular, Letter spacing 0.01em
- Secondary information
  Caption: 12px/16px, Regular, Letter spacing 0.02em
- Metadata and smallest text

#### Special Text

Button Text: 15px/24px, Medium, Letter spacing 0.02em
Label: 14px/20px, Medium, Letter spacing 0.05em, Uppercase
Link: Inherit size, Medium, Primary Purple (#7B3FF2)

## Component Styling

### Buttons

####Primary Button

- Background: Primary Purple (#7B3FF2)
- Text: White (#FFFFFF)
- Height: 44px (mobile) / 40px (desktop)
- Corner Radius: 10px
- Padding: 12px 24px
- Hover: Secondary Purple Light (#9D6FFF)
- Active: Darken 10%
- Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)

#### Secondary Button

- Background: White (#FFFFFF)
- Border: 1.5px Primary Purple (#7B3FF2)
- Text: Primary Purple (#7B3FF2)
- Height: 44px (mobile) / 40px (desktop)
- Corner Radius: 10px
- Hover: Secondary Purple Pale (#F0E9FF) background

#### Ghost Button

- Background: Transparent
- Text: Primary Purple (#7B3FF2)
- Height: 40px
- Hover: Secondary Purple Pale (#F0E9FF) background

### Cards

Background: White (#FFFFFF)
Shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)
Corner Radius: 16px
Padding: 24px
Border: 1px solid #F3F4F6 (optional for definition)
Hover Shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)

### Input Fields

Height: 48px
Corner Radius: 10px
Border: 1.5px Neutral 300 (#D1D5DB)
Background: White (#FFFFFF)
Focus Border: 2px Primary Purple (#7B3FF2)
Padding: 12px 16px
Text: Neutral 900 (#111827)
Placeholder: Neutral 500 (#6B7280)

### Navigation

#### Top Navigation

- Height: 64px
- Background: White with subtle shadow
- Logo area: 200px width

#### Side Navigation

- Width: 260px (expanded) / 64px (collapsed)
- Background: Background Light (#F9FAFB)
- Item Height: 48px
- Active Item: Primary Purple (#7B3FF2) with Secondary Purple Pale (#F0E9FF) background
- Corner Radius: 8px for items

### Icons

Large Icons: 24px x 24px
Standard Icons: 20px x 20px
Small Icons: 16px x 16px
Navigation Icons: 24px x 24px
Primary color: Inherit from text or Primary Purple (#7B3FF2)
Secondary color: Neutral 500 (#6B7280)

## Layout & Spacing

### Spacing System

4px - Micro spacing (icon to text)
8px - Tight spacing (within components)
12px - Small spacing (compact layouts)
16px - Default spacing (standard gap)
24px - Medium spacing (between elements)
32px - Large spacing (between sections)
48px - Extra large spacing (major sections)
64px - Huge spacing (page level)

### Grid System

12-column grid
Gutter: 24px
Margin: 24px (mobile) / 32px (tablet) / 48px (desktop)

### Container Widths

Max Width: 1440px
Content Max Width: 1200px
Narrow Content: 800px

## Motion & Animation

### Timing Functions

Standard: 200ms, cubic-bezier(0.4, 0, 0.2, 1)
Entrance: 300ms, cubic-bezier(0, 0, 0.2, 1)
Exit: 150ms, cubic-bezier(0.4, 0, 1, 1)
Bounce: 400ms, cubic-bezier(0.68, -0.55, 0.265, 1.55)

### Common Animations

Hover States: Scale 1.02, 200ms ease
Card Hover: Lift with shadow, 200ms
Button Press: Scale 0.98, 100ms
Page Transitions: Fade + slide, 300ms
Loading States: Pulse or skeleton screens
Success Animations: Check mark draw, 400ms

## Visual Effects

### Shadows

Small: 0 1px 2px rgba(0, 0, 0, 0.05)
Default: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)
Medium: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)
Large: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)
Extra Large: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)

### Gradients

Primary Gradient: linear-gradient(135deg, #7B3FF2 0%, #9D6FFF 100%)
Success Gradient: linear-gradient(135deg, #10B981 0%, #34D399 100%)
Celebration Gradient: linear-gradient(135deg, #EC4899 0%, #F472B6 100%)

## Dark Mode Variants

### Dark Mode Colors

Background Primary: #0F172A
Background Secondary: #1E293B
Surface: #334155
Border: #475569
Text Primary: #F1F5F9
Text Secondary: #CBD5E1
Text Tertiary: #94A3B8

### Dark Mode Adjustments

Primary Purple: #9D6FFF (increased brightness)
Cards: Background Dark Surface (#1F2937)
Shadows: Reduced opacity (0.3 instead of 0.1)
Borders: Subtle light borders for definition

## Special Components

### Yard Display Preview

Corner Radius: 20px
Background: Gradient overlay for depth
Shadow: Extra Large shadow for prominence
Animation: Subtle float animation on hover

### Booking Calendar

Selected Date: Primary Purple background
Available Date: Hover shows Secondary Purple Pale
Unavailable Date: Neutral 100 with strikethrough

### Inventory Cards

Image Ratio: 4:3
Corner Radius: 12px
Overlay gradient for text readability
Quick action buttons on hover

## Accessibility

### Contrast Ratios

Normal Text: 4.5:1 minimum
Large Text: 3:1 minimum
Interactive Elements: 3:1 minimum
Focus Indicators: 3:1 minimum

### Focus States

Outline: 2px solid Primary Purple
Outline Offset: 2px
Border Radius: Inherit from element

###Interactive States

All interactive elements must have visible hover, focus, and active states
Minimum touch target: 44px x 44px
Clear visual feedback for all actions

================================================================================================================================================

#Yard Card Rental Platform - Design Guide

## Agency Dashboard & Management

### Dashboard Overview Screen

#### Dashboard Overview - Initial Load State

Skeleton screens appear for all 4 metric cards using subtle pulse animation with Background Gray (#F3F4F6)
Top navigation bar (64px height) with white background and subtle shadow (0 1px 3px rgba(0, 0, 0, 0.1))
Logo positioned left (200px width area) with agency name in H5 style (18px/26px Medium)
User avatar and settings icon (24x24px) positioned right with dropdown menu
Main content area uses 48px top padding with 32px horizontal margins on desktop
Loading indicators use Primary Purple (#7B3FF2) with smooth 1.5s pulse cycle
Page title "Dashboard" in H1 (32px/40px Bold) appears immediately in Neutral 900 (#111827)
Grid layout with 4 equal cards starts forming with 24px gaps between cards
Cards maintain 16px corner radius even in skeleton state
Animation choreography staggers card appearance by 100ms each

#### Dashboard Overview - Loaded State

Four metric cards arranged in responsive grid (4 columns desktop, 2x2 tablet, single column mobile)
Each card has white background (#FFFFFF) with default shadow and 16px corner radius
Card padding of 24px on all sides with hover shadow transition (200ms ease)
Open Orders Card:

- Label in Caption style (12px/16px) reading "OPEN ORDERS" in Neutral 500 (#6B7280)
- Large number in H1 style (32px/40px Bold) with dynamic color:
  -- 0-5: Success Green (#059669)
  -- 6-10: Warning Orange (#EA580C)
  -- 11+: Error Red (#DC2626)
- Number animates from 0 with 800ms duration using easeOut curve
- Subtle icon (package icon, 24x24px) in top right, matching number color at 40% opacity
  Upcoming Orders Card:
- Label "NEXT 5 ORDERS" with scrollable list below
- Each order item shows: Customer name (Body Small), Event date (Caption), Status badge
- Status badges use 8px corner radius, 4px vertical padding, 8px horizontal padding
- Badge colors: Pending (Warning Orange), Processing (Info Blue), Deployed (Success Green)
- Vertical scroll appears if >5 orders with custom scrollbar styling
- "View All" ghost button at bottom on hover
  Popular Signs Card:
- Toggle switch at top: "My Signs" | "Platform Trends" with smooth slide animation
- Horizontal bar chart showing top 5 signs with names and counts
- Bars use Primary Purple (#7B3FF2) with 4px corner radius
- Bar width animations stagger by 50ms each when toggling
- Hover on bar shows exact count in tooltip
  Revenue Comparison Card:
- "LAST 30 DAYS" label with large revenue number below
- Comparison line: "vs previous 30 days" in Body Small
- Percentage change with arrow icon (16x16px):
  -- Positive: Accent Green (#10B981) with up arrow
  -- Negative: Error Red (#DC2626) with down arrow
- Numbers count up animation matches Open Orders timing
  Quick action buttons below cards:
- Primary button "View All Orders" and Secondary button "Manage Inventory"
- 44px height on mobile, 40px on desktop with 16px gap between
- Buttons centered on mobile, left-aligned on desktop

#### Dashboard Overview - Error State

Cards that fail to load show inline error message
Error container maintains card structure with Error Red (#DC2626) icon (20x20px)
"Unable to load data" message in Body Small with Neutral 700 (#374151)
"Retry" ghost button with Primary Purple text
Other cards continue functioning independently
Network error toast appears bottom-right with slide-in animation

#### Dashboard Overview - Empty State

Cards with no data show contextual empty states
Illustration or icon (48x48px) in Neutral 300 (#D1D5DB)
Helpful message in Body text with Neutral 700 color
CTA button appropriate to context:

- Open Orders: "Share your booking link" (Primary button)
- Popular Signs: "Add inventory to get started" (Primary button)
  Empty states fade in gently to avoid jarring appearance

### Dashboard Mobile Adaptations

#### Dashboard Mobile - Navigation State

Bottom tab navigation replaces side nav on mobile
5 tabs with icons (24x24px) and labels (Caption size)
Active tab uses Primary Purple with filled icon variant
Tab bar height 56px with white background and top border
Safe area padding for devices with home indicators
Swipe gestures between main sections with page indicators

## Sign Inventory Management

### Sign Library Screen

#### Sign Library - Initial State

Two-tab interface below main navigation with 48px height tabs
Tabs use Body text (16px) with Medium weight, 24px horizontal padding
Active tab has Primary Purple (#7B3FF2) text with 2px bottom border
Inactive tab uses Neutral 500 (#6B7280) with hover state showing Neutral 700
Tab content area has smooth slide transition (300ms) when switching
Left sidebar (260px desktop, full-width drawer mobile) for filters
Main content area with 24px padding shows loading grid

#### Sign Library - Loaded State

Search bar spans full width with 48px height and 10px corner radius
Search icon (20x20px) left-aligned with Neutral 500 color
Placeholder text "Search by name, category, theme, or keywords..." in Neutral 500
Real-time search with 300ms debounce showing inline loading spinner
Filter sidebar sections with collapsible headers:

- Each section header has chevron icon (16x16px) with 180° rotation on expand
- Smooth height animation (200ms) for expand/collapse
- Size Filters: Checkbox list with options like "Small (2-3 ft)", "Medium (3-4 ft)", "Large (4+ ft)"
- Theme Filters: "Birthday", "Graduation", "Holiday", etc. with count badges
- Holiday Filters: Seasonal options with small icon indicators
  Sign grid uses responsive columns: 4 desktop, 3 tablet, 2 mobile
  Each sign card (aspect ratio 4:3) contains:
- Image with lazy loading and blur-up effect
- White scrim gradient at bottom for text legibility
- Sign name in Body text (16px) with Neutral 900
- Dimensions in Caption (12px) with Neutral 500
- Category tags using Secondary Purple Pale (#F0E9FF) background
- "Add to Inventory" button appears on hover/focus
- Button uses Primary Purple with white text, 8px corner radius
  Infinite scroll triggers 200px before bottom
  Loading spinner uses Primary Purple with smooth rotation

#### Sign Library - Search Active State

Search results update live with match highlighting
Matching terms highlighted with Warning Orange (#EA580C) background
Result count shows below search bar: "Showing X of Y signs"
Recent searches dropdown (max 5) appears on focus if available
Clear search button (X icon) appears when text entered
No results state shows friendly message with suggestions

#### Sign Library - Bundle Selection State

Bundle cards show 2x2 grid preview of included signs
"View Bundle" button expands to show all signs in modal
Modal uses white background with 20px corner radius
Bundle contents listed with quantities and images
"Add Complete Bundle" primary button at modal bottom
Individual bundle items can't be selected separately

#### Sign Library - Custom Upload State

"Upload Custom Sign" button uses Secondary button style
Click opens stepped modal (600px max width):

- Step 1: Drag & drop zone with dashed border
- Drop zone shows Primary Purple on drag-over
- Image preview appears immediately after selection
- Transparency check warning if applicable
- Background preview toggles (grass, pavement, snow)
- Step 2: Form fields for sign details
- Step 3: Review and confirm
  Upload progress bar uses Primary Purple fill
  Success state shows sign added to "My Inventory" with badge

### My Inventory Screen

#### My Inventory - Default State

Grid matches Sign Library layout but shows only owned signs
Each card adds:

- Quantity badge in top-right corner (Primary Purple background)
- Inline quantity editor on click/tap
- Increment/decrement buttons (28x28px) with number input
- "Custom" badge for uploaded signs using Accent Pink (#EC4899)
  Bulk selection mode toggle in toolbar
  Selected cards show Primary Purple border (2px) with checkbox
  Floating action bar appears with bulk actions when items selected

#### My Inventory - Editing State

Quantity editor appears inline with smooth expand animation
Number input has validation for positive integers only
Save/Cancel buttons appear below with 8px gap
Other cards dim slightly (opacity 0.7) during edit
Auto-save after 2 seconds of inactivity
Success toast confirms "Inventory updated"

#### My Inventory - Empty State

Large illustration (200x200px) centered
"No signs in inventory yet" heading in H3
Body text explaining how to add signs
Primary button "Browse Sign Library" with arrow icon

## Order Management System

### Order Board Screen

#### Order Board - Default Kanban View

Four columns with equal width and 16px gaps
Column headers with status names and count badges
Headers use H5 style with Neutral 700 color
Count badges use Neutral 100 background with Neutral 700 text
Columns have subtle Background Light (#F9FAFB) with 8px corner radius
Vertical scroll per column with fade gradient at top/bottom
Order cards within columns:

- White background with default card shadow
- 12px corner radius and 16px padding
- Order number in Caption style with Neutral 500
- Customer name in Body text with Neutral 900
- Event date with calendar icon (16x16px)
- Sign count with package icon
- Status-specific action button at bottom
  Drag & drop between columns:
- Card lifts with increased shadow on drag start
- Placeholder appears in target position
- Smooth snap animation on drop
- Status update confirms with toast

#### Order Board - Order Details Sidebar

Slides in from right (400px width desktop, full-width mobile)
Overlay backdrop with 0.5 opacity black
Close button (X icon) in top-right
Content sections with 24px spacing:

- Order Header: Number, status badge, date created
- Customer Info: Name, email (clickable), phone (clickable)
- Event Details: Date, time window, full address with map link
- Display Preview: Thumbnail image (click to expand)
- Signs Allocated: List with quantities and images
- Order Timeline: Chronological events with timestamps
- Documents: Generated PDFs with download links
  Sticky footer with available actions based on status

#### Order Board - Print Pick Ticket State

Click triggers immediate PDF generation
Loading spinner overlays button during generation
Browser print dialog opens automatically
Pick ticket includes:

- QR code for mobile scanning
- Order details in clear sections
- Sign list with checkbox grid
- Signature line for picker
  Status auto-advances to Processing after print
  Card animates to new column with glow effect

#### Order Board - Deployment Checklist State

"Print Order Summary" generates customer-facing document
Includes display preview and setup instructions
"Mark as Deployed" confirmation modal:

- "Are you sure?" heading
- Deployment checklist reminders
- Confirm (Primary) and Cancel (Ghost) buttons
  Status advancement shows success animation

#### Order Board - Check-In Process State

"Check In Signs" opens dedicated modal/screen
Mobile-optimized with large touch targets
Each sign shows:

- Image and name
- Toggle: Good / Damaged
- Damaged option reveals:
  -- Text field for notes
  -- Camera button for photo
  -- Photo preview if captured
  Progress bar shows X of Y signs checked
  "Complete Check-In" disabled until all processed
  Late fee section appears if applicable:
- Auto-calculated fee shown
- Override option with reason field
  Completion updates inventory and advances status

#### Order Board - Calendar View

Toggle button switches between Kanban and Calendar
Monthly calendar with day cells
Orders shown as colored chips within days:

- Chip color matches status
- Hover shows customer and sign count
- Click opens order details
  Deployment route optimization suggestions
  Drag orders between days to reschedule

### Order Search & Filters

#### Order Search - Active State

Search bar above board with same styling as inventory
Searches across order number, customer name, and date
Filter dropdown with options:

- Date range picker
- Status multiselect
- Customer name autocomplete
  Active filters shown as removable chips
  Result count updates dynamically
  "Clear all filters" link when active

## Financial Infrastructure

### Authentication Screen

#### Login - Default State

Centered card (400px max width) on gradient background
Background uses Primary Gradient (135deg, #7B3FF2 to #9D6FFF)
Card has white background with Large shadow
Logo centered at top with 32px spacing below
"Welcome Back" heading in H2 style
Form fields with 16px spacing:

- Email input with envelope icon
- Password input with lock icon
- Show/hide password toggle (eye icon)
  "Remember me" checkbox with label
  "Forgot Password?" link aligned right in Primary Purple
  "Log In" primary button (full width)
  "New to YardCard Elite? Sign up" link below

#### Login - Error State

Error message appears above form in Error Red (#DC2626)
Red exclamation icon (20x20px) with message
Invalid fields get red border (2px) with shake animation
After 5 failed attempts:

- Error message about lockout
- Countdown timer shows remaining time
- Form inputs disabled with reduced opacity

#### Sign Up - Multi-Step State

Step indicator at top (3 dots with connecting line)
Active step in Primary Purple, completed in Success Green
Step 1: Email & Password

- Password requirements list below field
- Real-time validation with checkmarks
- Requirements turn green when met
  Step 2: Agency Details
- Agency name input
- Agency location (city/state)
- Phone number
  Step 3: Terms & Launch
- Terms of service in scrollable box
- Checkbox to accept
- "Launch My Agency" primary button

#### Password Reset - Flow States

Reset request screen:

- Email input with clear instructions
- "Send Reset Link" primary button
- Success message with email icon
  Reset confirmation screen:
- Check your email illustration
- Resend option after 60 seconds
  New password screen (from email link):
- Password and confirm password fields
- Same requirements validation
- Success leads to login with toast

### Subscription Management Screen

#### Subscription - Active State

Clean layout with status card at top
Status card shows:

- "Elite Plan" badge with crown icon
- "$49/month" in H3 style
- "Active" status in Success Green
- Next billing date in Body text
- Auto-renewal notice in Caption
  Payment method section:
- Card brand icon and last 4 digits
- Expiration date
- "Update Payment Method" secondary button
  Billing history table:
- Date, amount, status, invoice columns
- Download icon for each invoice
- Pagination if >10 entries
  Plan features list with checkmarks

#### Subscription - Lapsed State

Full-screen modal overlay (can't be dismissed)
Warning icon (48x48px) in Warning Orange
"Subscription Required" heading in H2
Explanation text about feature access
Held funds amount shown prominently:

- "$X in held payments" in H3
- "Reactivate to access your funds" in Body
  Payment form embedded directly
  "Reactivate Subscription" primary button
  Note about bookings continuing during lapse

#### Subscription - Payment Update State

Slide-over panel for payment update
Current card shown with "Remove" option
New payment form with identical styling
Stripe Elements integration for security
Form validation in real-time
Success shows toast and updates display
Proration notice if plan changes apply

#### Subscription - Promo Code State

Promo code field appears below plan selection
"Apply" button activates on valid input
Success shows:

- Green checkmark animation
- Discount details (percentage/amount)
- Updated total with strikethrough original
  Invalid code shows inline error
  Applied code shows as removable chip

### Stripe Connect Screen

#### Stripe Connect - Not Connected State

Informational card explaining benefits
Icon illustrations for key features:

- Direct deposits
- Lower fees
- Automated reconciliation
  "Connect Stripe Account" primary button
  Security badges (Stripe, SSL, PCI)
  FAQ section with expandable items

#### Stripe Connect - OAuth Flow State

Redirect to Stripe with loading spinner
YardCard Elite branding maintained in Stripe flow
Return URL handles success/failure
Success state shows:

- Animated checkmark (400ms draw)
- "Successfully connected!" message
- Account details retrieved
  Failure state shows:
- Error message with reason
- "Try Again" button
- Support contact information

#### Stripe Connect - Connected State

Success badge with green checkmark
Connected account details:

- Business name from Stripe
- Connection date
- Account status indicator
  "Disconnect" link in Error Red (requires confirmation)
  Test mode toggle for development
  Connection health indicator:
- Green dot: All systems go
- Yellow dot: Issues detected
- Red dot: Connection failed
  "View in Stripe Dashboard" external link

#### Stripe Connect - Failsafe Active State

Warning banner at top of screen
Yellow background with warning icon
Explains why failsafe is active
Shows fee difference (2% vs 5%)
"Fix Connection" primary button
Recent failsafe transactions listed

### Payment & Funds Management Screen

#### Payments Dashboard - Tab Navigation State

Three tabs below page header:

- "Received Payments" (default active)
- "Held Funds" (shows count badge if any)
- "All Transactions"
  Tab styling matches inventory tabs
  Smooth slide transition between views
  Each tab maintains its own scroll position

#### Payments Dashboard - Received Payments State

Data table with responsive design:

- Desktop: Full table with all columns
- Mobile: Card-based layout
  Column headers: Date, Order #, Customer, Amount, Status, Net Amount
  Sortable columns with arrow indicators
  Status badges:
- Completed: Success Green
- Processing: Info Blue
- Refunded: Neutral 500
  Row hover shows light background
  Click on row opens transaction details modal

#### Payments Dashboard - Held Funds State

Alert banner at top if subscription lapsed:

- Warning Orange background with icon
- "Reactivate your subscription to release $X in held funds"
- "Reactivate Now" button inline
  Table shows held transactions with:
- Original date and order details
- Gross amount with strikethrough
- Fee breakdown in smaller text
- Net amount highlighted
- "Release" button (disabled if subscription lapsed)
  Bulk selection checkboxes for multiple release
  "Release Selected" button appears when items checked
  Release animation shows funds moving to received

#### Payments Dashboard - Transaction Details Modal

Modal with 600px max width
Header with transaction ID and close button
Sections with clear spacing:

- Payment Information (amount, date, method)
- Processing Details (direct/failsafe/manual)
- Fee Breakdown table:
  -- Stripe fees
  -- Platform fees (if applicable)
  -- Net amount in bold
- Customer Information
- Order Information with link
  "Download Receipt" secondary button
  "Issue Refund" ghost button (if applicable)

#### Payments Dashboard - Empty States

Different illustrations for each tab
Helpful messages:

- Received: "No payments yet. Share your booking link!"
- Held: "No held funds. Keep your subscription active!"
- All: "No transactions to display"
  CTAs guide next actions

## Customer Booking Flow

### Booking Landing Page

#### Landing Page - Initial Load State

Custom subdomain URL (agency-city.yardcardelite.com)
Hero section with agency branding:

- Agency name in H1 style
- Tagline or welcome message
- Hero image/video with overlay gradient
  "Book Your Display" primary button (extra large)
  Trust indicators:
- "48-hour advance booking required"
- Security badges
- Example displays carousel
  Smooth fade-in animation on scroll

### Multi-Step Booking Form

#### Booking Form - Progress Indicator State

Fixed position header (mobile) or sticky top (desktop)
6 dots connected by progress line
Completed steps show Primary Purple fill
Current step pulses gently
Future steps show Neutral 300
Step labels appear on hover (desktop)
Mobile shows current step name only

#### Step 1 - Contact Information State

Clean, focused layout with single purpose
Form fields animate in with stagger (100ms each)
Field labels use Label style (14px Medium uppercase)
Input fields with proper types:

- Full Name: text input with autocomplete="name"
- Email: email input with real-time validation
- Phone: tel input with format-as-you-type
  Validation states:
- Error: Red border with message below
- Success: Green checkmark in field
  "Continue" button disabled until all valid
  Button enables with color transition
  Mobile keyboard "Next" advances fields

#### Step 2 - Event Details State

Calendar picker for event date:

- Custom styled with rounded corners
- Past dates and <48 hours grayed out
- Selected date in Primary Purple
- Month navigation with smooth slide
- Mobile uses native date picker
  Address fields with autocomplete:
- Smart address lookup integration
- Predictive dropdown with addresses
- Manual entry fallback option
  Time preference dropdown:
- Custom styled select
- Large touch targets on mobile
- Clear time windows shown
  "Back" and "Continue" navigation
  Form data persists when navigating back

#### Step 3 - Display Customization State

Three-column layout (desktop) or tabs (mobile)
Left sidebar filters:

- Collapsible sections with smooth animations
- Event Message dropdown with common options
- Custom message input appears if selected
- Number input for age/year (if applicable)
- Letter style preview thumbnails
- Character theme visual selector
- Hobby/interest checkboxes with icons
  Center preview area:
- Placeholder lawn with "Your Message Here"
- Subtle animation suggesting interactivity
- "Generate Preview" button with primary style
- Loading state shows progress bar
- Preview appears with fade/scale animation
- Display shows realistic lawn perspective
- Signs arranged in visually pleasing layout
- "Regenerate" button for new arrangement
  Right pricing panel:
- Sticky positioning on scroll
- Base price prominently displayed
- Extra days selector with +/- buttons
- Price updates with count-up animation
- Total in H3 style with Primary Purple

#### Step 3 - Preview Generation States

Loading state:

- Skeleton of preview area
- Progress bar with stages:
  -- "Checking availability..."
  -- "Designing your display..."
  -- "Generating preview..."
- Soft bounce animation on progress
  Success state:
- Preview fades in with slight zoom
- Signs have subtle float animation
- "Love it!" or "Try Another" options
- Social sharing buttons appear
  Error state:
- Friendly error message
- "Try Again" button
- Fallback to generic preview

#### Step 4 - Payment Information State

Payment method selector:

- Large, clear buttons with logos
- Radio button selection
- Selected method expands form below
  Credit card form:
- Single-line input with smart formatting
- Card type detected and shown with logo
- CVV help tooltip on hover
- Inline validation as typing
  Alternative payment redirects:
- Clear messaging about redirect
- "You'll be redirected to [PayPal]"
- Return handling with status check
  Order total in large text
  Security messaging with lock icon
  "Process Payment" button with loading state

#### Step 5 - Review Your Order State

Sectioned layout with edit capabilities:

- Each section has subtle border
- "Edit" link in Primary Purple
- Hover shows edit icon
  Display preview shown prominently
  Pricing breakdown in table format:
- Line items clearly listed
- Extra days itemized
- Total highlighted with background
  Terms checkbox with link to full terms
  "Place Order" with confirmation animation

#### Step 6 - Order Confirmation State

Success animation sequence:

- Checkmark draws in (400ms)
- "Thank You!" fades in
- Order details slide up
  Order number in large text with copy button
  Printable order summary design
  "What Happens Next" timeline:
- Visual timeline with icons
- Each step clearly explained
- Estimated timing included
  "Done" button returns to agency page
  Confetti animation (subtle, performance-conscious)

### Communication & Notifications

#### Email Template - Confirmation State

Responsive email design
Header with YardCard Elite branding
Order summary in clean table
Display preview as hero image
Clear sections:

- Order details
- Delivery information
- Contact information
- What to expect
  Mobile-optimized with single column
  Plain text fallback version
  Unsubscribe link in footer

#### Email Template - Agency Notification State

Simpler design for internal use
Alert-style header "New Order!"
Key details prominently shown
Direct link to dashboard
Mobile-friendly action buttons

## Mobile-Specific Adaptations

### Touch Interactions

All tappable elements minimum 44x44px
Gesture support:

- Swipe between form steps
- Pull-to-refresh on lists
- Long press for bulk actions
  Haptic feedback on key actions (iOS)

### Navigation Patterns

Bottom tab bar replaces side nav
Full-screen modals instead of sidebars
Back button always visible in header
Breadcrumb trail in complex flows

### Performance Optimizations

Lazy loading for images
Virtualized lists for large datasets
Optimistic UI updates
Offline state detection and messaging
Progressive Web App capabilities
