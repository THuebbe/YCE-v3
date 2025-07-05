# Row-Level Security (RLS) Implementation

This document explains the Row-Level Security implementation for YardCard Elite's multi-tenant architecture.

## Overview

Row-Level Security (RLS) ensures that each agency (tenant) can only access their own data, preventing data leaks between different agencies using the same database.

## Implementation Details

### 1. Database Migration

**File**: `prisma/migrations/20241229000000_init_rls/migration.sql`

- Enables RLS on `agencies` and `users` tables
- Creates policies that restrict access based on `app.current_agency_id` session variable
- Provides helper functions for setting/getting/clearing agency context

### 2. Enhanced Prisma Client

**File**: `src/lib/db/prisma.ts`

- `TenantAwarePrismaClient` class extends standard Prisma client
- Methods for setting agency context: `setAgencyContext()`, `forAgency()`, `withAgencyContext()`
- Automatic context management with cleanup

### 3. Tenant Context Utilities

**File**: `src/lib/tenant-context.ts`

- `getCurrentTenant()` - Resolves current agency from request
- `getTenantClient()` - Returns tenant-scoped Prisma client
- `withCurrentTenantContext()` - Executes operations in current tenant context
- `validateTenantAccess()` - Validates user access to specific tenant

### 4. Auth Utilities

**File**: `src/features/auth/utils.ts`

- `getCurrentAuthenticatedUser()` - Gets user with tenant validation
- `validateUserTenantAccess()` - Ensures user belongs to current tenant
- `hasRole()`, `isAdmin()` - Role-based access control within tenant
- User management functions scoped to current tenant

### 5. Middleware Integration

**File**: `src/middleware.ts`

- Automatically sets tenant context early in request lifecycle
- Works with subdomain routing to determine correct tenant

## Security Guarantees

### ✅ What RLS Prevents

1. **Cross-Tenant Data Access**: Users cannot see data from other agencies
2. **Accidental Data Leaks**: Queries automatically filter by tenant
3. **Privilege Escalation**: Users cannot modify data outside their tenant
4. **Database-Level Protection**: Security enforced at PostgreSQL level

### ⚠️ What RLS Doesn't Prevent

1. **Application Logic Bugs**: Still need proper input validation
2. **Authentication Bypass**: RLS doesn't handle login/logout
3. **API Endpoint Security**: Still need proper route protection
4. **Data in Transit**: Still need HTTPS and encryption

## Usage Patterns

### Basic Tenant-Scoped Query

```typescript
import { withCurrentTenantContext } from "@/lib/tenant-context";

// Automatically scoped to current tenant
const users = await withCurrentTenantContext(async (client) => {
	return await client.user.findMany();
});
```

### Specific Tenant Context

```typescript
import { getTenantPrismaClient } from "@/lib/db/prisma";

const client = getTenantPrismaClient(agencyId);
const users = await client.user.findMany(); // Only sees users from agencyId
```

### Auth-Protected Operations

```typescript
import { getCurrentAuthenticatedUser, isAdmin } from "@/features/auth/utils";

const user = await getCurrentAuthenticatedUser();
if (!user) throw new Error("Unauthorized");

const canManageUsers = await isAdmin();
if (!canManageUsers) throw new Error("Insufficient permissions");
```

## Testing

### Run RLS Tests

```bash
# Apply the migration first
pnpm prisma migrate dev

# Run the test suite
node scripts/test-rls.mjs
```

### Test Coverage

1. **User Isolation**: Verifies users can only see their agency's users
2. **Agency Isolation**: Verifies agencies can only see themselves
3. **Cross-Tenant Prevention**: Ensures operations across tenants fail
4. **Context Switching**: Validates context can be changed correctly

## Deployment Checklist

- [ X ] Apply RLS migration: `pnpm prisma migrate dev`
- [ X ] Run RLS tests: `node scripts/test-rls.mjs`
- [ X ] Verify all existing queries use tenant-aware client
- [ X ] Test subdomain routing with different agencies
- [ X ] Monitor logs for RLS violations

## Troubleshooting

### Common Issues

1. **"RLS policy violation"** - Check that agency context is set correctly
2. **"User not in tenant"** - Verify user belongs to the expected agency
3. **"Empty results"** - Agency context might not be set or incorrect

### Debug Commands

```sql
-- Check current agency context
SELECT current_setting('app.current_agency_id', true);

-- Manually set context for testing
SELECT set_current_agency_id('agency-id-here');

-- View RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('agencies', 'users');
```

### Monitoring

Monitor these metrics in production:

- Query execution time (RLS adds overhead)
- Failed authentication attempts
- Cross-tenant access attempts (should be blocked)
- User access patterns by agency

## Best Practices

1. **Always use tenant-aware client** for data operations
2. **Set context early** in request lifecycle
3. **Validate tenant access** before operations
4. **Use proper error handling** for RLS violations
5. **Test with multiple tenants** during development
6. **Monitor RLS performance** in production

## Security Review

This implementation provides:

- ✅ **Database-level tenant isolation**
- ✅ **Automatic query scoping**
- ✅ **Context-aware operations**
- ✅ **Cross-tenant access prevention**
- ✅ **Comprehensive testing**

The RLS implementation ensures that YardCard Elite maintains strict data isolation between agencies while providing a seamless multi-tenant experience.
