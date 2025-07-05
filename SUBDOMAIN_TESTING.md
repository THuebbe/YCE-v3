# Subdomain Testing Setup

This guide explains how to test subdomain routing locally for YardCard Elite.

## Prerequisites

1. Make sure the development server is running: `npm run dev`
2. Database should be set up with test agencies

## Local Hosts File Setup

### Windows (WSL2/Windows)

Edit the hosts file at `C:\Windows\System32\drivers\etc\hosts` (requires Administrator privileges):

```
127.0.0.1 localhost
127.0.0.1 greenthumb.localhost
127.0.0.1 lawnmasters.localhost
127.0.0.1 inactive.localhost
127.0.0.1 nonexistent.localhost
```

### macOS/Linux

Edit the hosts file at `/etc/hosts` (requires sudo):

```bash
sudo nano /etc/hosts
```

Add these lines:
```
127.0.0.1 localhost
127.0.0.1 greenthumb.localhost
127.0.0.1 lawnmasters.localhost
127.0.0.1 inactive.localhost
127.0.0.1 nonexistent.localhost
```

## Database Setup

1. Set up your database (PostgreSQL recommended)
2. Run migrations: `npx prisma db push`
3. Seed test data: `npx prisma db seed`

## Testing Routes

After setting up the hosts file, you can test these URLs:

### Main Marketing Site
- http://localhost:3000 - Main YardCard Elite marketing site

### Active Agency Subdomains (Booking Sites)
- http://greenthumb.localhost:3000 - Green Thumb Lawn Care booking site
- http://lawnmasters.localhost:3000 - Lawn Masters Pro booking site

### Inactive Agency (Maintenance Page)
- http://inactive.localhost:3000 - Should show maintenance page

### Invalid Subdomain (404 Page)
- http://nonexistent.localhost:3000 - Should redirect to not-found page

### Dashboard Routes (Protected)
- http://greenthumb.localhost:3000/dashboard - Agency dashboard (requires auth)
- http://lawnmasters.localhost:3000/dashboard - Agency dashboard (requires auth)

## Expected Behavior

1. **Main domain** (`localhost:3000`) → Marketing site
2. **Valid active agency subdomain** → Booking site for that agency
3. **Valid inactive agency subdomain** → Maintenance page
4. **Invalid subdomain** → Redirect to not-found page
5. **Dashboard routes** → Requires authentication via Clerk

## Troubleshooting

1. **Subdomain not working**: 
   - Check hosts file syntax (no extra spaces)
   - Restart browser after editing hosts file
   - Use `ping greenthumb.localhost` to verify DNS resolution

2. **Database errors**: 
   - Ensure DATABASE_URL is set in .env
   - Run `npx prisma db push` to sync schema
   - Run `npx prisma db seed` to add test data

3. **Middleware errors**: 
   - Check browser developer tools for console errors
   - Verify agency queries are working in database

## Cleaning Up

To remove test entries from hosts file, simply delete the added lines and save the file.