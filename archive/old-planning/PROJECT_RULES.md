# YardCard Elite - Project Rules & Compliance Guidelines

## 🛡️ SECURITY RULES (CRITICAL)

### Rule 1: Row-Level Security (RLS) Compliance
- **REQUIRED**: All database queries MUST use secure functions instead of direct table access
- **REQUIRED**: Always set agency context before any database operation: `SELECT set_current_agency_id('agency-id')`
- **REQUIRED**: Use only these approved functions for data access:
  - `get_agency_users()` - Never query users table directly
  - `get_current_agency()` - Never query agencies table directly
  - `create_agency_user()` - Never insert into users table directly
  - `update_agency_user()` - Never update users table directly
  - `delete_agency_user()` - Never delete from users table directly
- **FORBIDDEN**: Direct table queries in production (`SELECT * FROM users`, `INSERT INTO users`, etc.)
- **REQUIRED**: Always handle RLS function errors properly with try-catch blocks

### Rule 2: Data Isolation
- **REQUIRED**: Every multi-tenant operation must validate agency context
- **REQUIRED**: Test cross-tenant access prevention for all new features
- **FORBIDDEN**: Exposing data from other agencies under any circumstances
- **REQUIRED**: Use the test suite (`test-final-rls.js`) to validate all RLS implementations

### Rule 3: Authentication & Authorization
- **REQUIRED**: All protected routes must verify user authentication
- **REQUIRED**: API endpoints must validate user permissions for their agency
- **REQUIRED**: Password requirements: minimum 8 characters, 1 uppercase, 1 lowercase, 1 number
- **REQUIRED**: Implement session timeout after 24 hours of inactivity
- **FORBIDDEN**: Storing passwords in plain text
- **REQUIRED**: Use JWT tokens with proper expiration and refresh logic

## 🎨 UI/UX DESIGN RULES

### Rule 4: Style Guide Compliance
- **REQUIRED**: All UI components MUST conform to standards in `/style-guide/style-guide.md`
- **REQUIRED**: Use approved color palette:
  - Primary Purple: #7B3FF2 (brand color)
  - Secondary Purple Light: #9D6FFF (hover states)
  - Success Green: #059669 (confirmations)
  - Error Red: #DC2626 (errors)
  - Warning Orange: #EA580C (warnings)
- **REQUIRED**: Typography must use Inter font family with specified weights
- **REQUIRED**: Button heights: 44px (mobile) / 40px (desktop)
- **REQUIRED**: Corner radius: 10px for buttons, 16px for cards
- **REQUIRED**: Spacing system: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

### Rule 5: Responsive Design
- **REQUIRED**: Mobile-first responsive design approach
- **REQUIRED**: Minimum touch target: 44px x 44px on mobile
- **REQUIRED**: Test on mobile, tablet, and desktop viewports
- **REQUIRED**: Maximum container width: 1440px
- **REQUIRED**: Use 12-column grid system with 24px gutters

### Rule 6: Accessibility
- **REQUIRED**: Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
- **REQUIRED**: All interactive elements must have visible focus states
- **REQUIRED**: Proper ARIA labels for screen readers
- **REQUIRED**: Keyboard navigation support for all interactive elements
- **REQUIRED**: Alt text for all images

## 💾 DATA MANAGEMENT RULES

### Rule 7: Database Operations
- **REQUIRED**: All database migrations must be tested in development first
- **REQUIRED**: Never run destructive operations without backups
- **REQUIRED**: Use transactions for multi-step operations
- **REQUIRED**: Implement proper error handling for all database operations
- **REQUIRED**: Index all frequently queried columns
- **FORBIDDEN**: N+1 query patterns - always use proper joins or batching

### Rule 8: Data Validation
- **REQUIRED**: Validate all user inputs on both client and server side
- **REQUIRED**: Sanitize all user inputs to prevent XSS attacks
- **REQUIRED**: Use type-safe validation (Zod, Yup, or similar)
- **REQUIRED**: Validate file uploads: type, size, and content
- **FORBIDDEN**: Trusting client-side validation alone

## 🔧 DEVELOPMENT RULES

### Rule 9: Code Quality
- **REQUIRED**: Follow ESLint configuration for JavaScript/TypeScript
- **REQUIRED**: Use Prettier for consistent code formatting
- **REQUIRED**: Write unit tests for all business logic
- **REQUIRED**: Maintain minimum 80% code coverage
- **REQUIRED**: Use meaningful variable and function names
- **REQUIRED**: Add JSDoc comments for all public functions
- **FORBIDDEN**: Console.log statements in production code

### Rule 10: Component Architecture
- **REQUIRED**: Create reusable components following the style guide
- **REQUIRED**: Props must be typed with TypeScript interfaces
- **REQUIRED**: Use proper React hooks (useState, useEffect, useCallback)
- **REQUIRED**: Implement proper error boundaries
- **REQUIRED**: Lazy load components where appropriate
- **FORBIDDEN**: Inline styles - use CSS modules or styled-components

### Rule 11: State Management
- **REQUIRED**: Use Redux/Zustand for global state management
- **REQUIRED**: Keep component state local when possible
- **REQUIRED**: Implement proper loading and error states
- **REQUIRED**: Use optimistic updates for better UX
- **REQUIRED**: Implement proper data fetching patterns with SWR or React Query

## 💳 PAYMENT & FINANCIAL RULES

### Rule 12: Payment Security
- **REQUIRED**: Use Stripe's secure payment processing
- **REQUIRED**: Never store credit card information directly
- **REQUIRED**: Implement proper PCI compliance measures
- **REQUIRED**: Use HTTPS for all payment-related communications
- **REQUIRED**: Validate all payment amounts server-side
- **REQUIRED**: Log all payment transactions for audit trail

### Rule 13: Subscription Management
- **REQUIRED**: Implement proper subscription lifecycle management
- **REQUIRED**: Handle payment failures gracefully
- **REQUIRED**: Implement proper proration logic
- **REQUIRED**: Send payment notifications to users
- **REQUIRED**: Hold funds for lapsed subscriptions
- **FORBIDDEN**: Processing payments without proper validation

## 📧 COMMUNICATION RULES

### Rule 14: Email & Notifications
- **REQUIRED**: Use transactional email service (SendGrid/Mailgun)
- **REQUIRED**: Implement proper email templates with branding
- **REQUIRED**: Include unsubscribe links in all marketing emails
- **REQUIRED**: Send order confirmations within 5 minutes
- **REQUIRED**: Implement proper email validation
- **REQUIRED**: Use plain text fallbacks for HTML emails

### Rule 15: Error Handling & Logging
- **REQUIRED**: Implement comprehensive error logging
- **REQUIRED**: Use structured logging with proper levels
- **REQUIRED**: Monitor application performance and errors
- **REQUIRED**: Implement proper error boundaries in React
- **REQUIRED**: Provide user-friendly error messages
- **FORBIDDEN**: Exposing sensitive information in error messages

## 🚀 DEPLOYMENT RULES

### Rule 16: Environment Management
- **REQUIRED**: Maintain separate development, staging, and production environments
- **REQUIRED**: Use environment variables for all configuration
- **REQUIRED**: Never commit secrets to version control
- **REQUIRED**: Implement proper CI/CD pipeline
- **REQUIRED**: Run automated tests before deployment
- **REQUIRED**: Use proper versioning for releases

### Rule 17: Performance Rules
- **REQUIRED**: Page load times must be under 3 seconds
- **REQUIRED**: Implement proper caching strategies
- **REQUIRED**: Optimize images and assets
- **REQUIRED**: Use code splitting for large applications
- **REQUIRED**: Implement proper lazy loading
- **REQUIRED**: Monitor Core Web Vitals

## 📋 TESTING RULES

### Rule 18: Testing Requirements
- **REQUIRED**: Write unit tests for all business logic
- **REQUIRED**: Implement integration tests for API endpoints
- **REQUIRED**: Test all user flows end-to-end
- **REQUIRED**: Test cross-browser compatibility
- **REQUIRED**: Test mobile responsiveness
- **REQUIRED**: Run RLS tests after any database changes

### Rule 19: Quality Assurance
- **REQUIRED**: Manual testing of all new features
- **REQUIRED**: Performance testing under load
- **REQUIRED**: Security testing for vulnerabilities
- **REQUIRED**: Accessibility testing with screen readers
- **REQUIRED**: User acceptance testing before major releases

## 🔍 COMPLIANCE CHECKING

### Daily Checklist
- [ ] All new database queries use secure RLS functions
- [ ] All UI components follow style guide specifications
- [ ] All user inputs are properly validated
- [ ] All new features have adequate test coverage
- [ ] All error handling is implemented properly

### Weekly Checklist
- [ ] Review code for security vulnerabilities
- [ ] Check performance metrics and optimize if needed
- [ ] Review and update documentation
- [ ] Run full test suite including RLS tests
- [ ] Check for any technical debt accumulation

### Pre-Release Checklist
- [ ] Full security audit completed
- [ ] Performance benchmarks meet requirements
- [ ] All accessibility requirements met
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness validated
- [ ] Payment processing thoroughly tested
- [ ] RLS isolation verified across all features

## 🚨 VIOLATION CONSEQUENCES

### Critical Rule Violations (Security, Data Isolation)
- **Immediate**: Stop development and fix issue
- **Required**: Full security review of affected code
- **Required**: Update tests to prevent regression

### Design Rule Violations
- **Required**: Refactor to meet style guide requirements
- **Required**: Update component library if needed

### Code Quality Violations
- **Required**: Code review and refactoring
- **Required**: Additional testing coverage

---

*These rules are mandatory for all YardCard Elite development. Any exceptions must be documented and approved by the project lead.*