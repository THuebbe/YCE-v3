# Stripe Webhook Setup for Local Development

## Overview
This guide helps you set up Stripe webhooks for local development to test the Stripe Connect status updates.

## Prerequisites
- Stripe CLI installed (`stripe` command available)
- Local development server running on `localhost:3000`
- Stripe account with Connect enabled

## Setup Steps

### 1. Install Stripe CLI
If not already installed:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Other platforms: https://docs.stripe.com/stripe-cli#install
```

### 2. Login to Stripe CLI
```bash
stripe login
```

### 3. Forward Webhooks to Local Development
Run this command in a separate terminal:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will:
- Create a webhook endpoint in your Stripe dashboard
- Forward all webhook events to your local server
- Provide a webhook secret (starts with `whsec_`)

### 4. Set Environment Variables
Copy the webhook secret from the CLI output and add to your `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 5. Test Webhook Events
To test specific events manually:
```bash
# Trigger account.updated event
stripe trigger account.updated

# Trigger capability.updated event  
stripe trigger capability.updated
```

## Webhook Events We Handle

The application handles these webhook events:
- `account.updated` - When Stripe account status changes
- `account.application.deauthorized` - When account is disconnected
- `capability.updated` - When account capabilities change
- `person.created` / `person.updated` - When person info changes

## Debugging Webhooks

### Check Webhook Logs
Your local server will log webhook events:
```
Processing Stripe webhook event: account.updated
Updated account acct_xxx status: {...}
```

### Check Stripe CLI Logs
The Stripe CLI shows all forwarded events:
```
2024-01-01 12:00:00 --> account.updated [evt_xxx]
2024-01-01 12:00:01 <-- [200] POST http://localhost:3000/api/webhooks/stripe
```

### Manual Event Testing
You can trigger events manually to test:
```bash
# Test account status update
stripe events resend evt_your_event_id

# Or create test events
stripe trigger account.updated --add account:charges_enabled=true
```

## Production Setup

For production, you'll need to:
1. Create a webhook endpoint in Stripe Dashboard
2. Set the endpoint URL to `https://yourdomain.com/api/webhooks/stripe`
3. Select the events listed above
4. Copy the webhook secret to your production environment variables

## Troubleshooting

### Common Issues
1. **Webhook secret not found**: Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
2. **Events not received**: Check if Stripe CLI is still running and forwarding
3. **Database not updating**: Check server logs for Supabase errors

### Debug Steps
1. Check webhook endpoint is accessible: `curl http://localhost:3000/api/webhooks/stripe`
2. Verify environment variables are loaded
3. Check server logs for webhook processing messages
4. Use Stripe CLI's `stripe logs tail` to see live events