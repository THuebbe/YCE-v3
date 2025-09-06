import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase-client';
import braintree from 'braintree';

// Initialize Braintree Gateway
const getBraintreeGateway = (environment: 'sandbox' | 'production' = 'sandbox') => {
  const env = environment === 'production' 
    ? braintree.Environment.Production 
    : braintree.Environment.Sandbox;

  return new braintree.BraintreeGateway({
    environment: env,
    merchantId: process.env.BRAINTREE_MERCHANT_ID!,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY!,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY!,
  });
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Braintree webhook received');

    // Get webhook notification data
    const body = await request.text();
    const webhookData = new URLSearchParams(body);
    
    const btSignature = webhookData.get('bt_signature');
    const btPayload = webhookData.get('bt_payload');

    if (!btSignature || !btPayload) {
      console.error('❌ Missing webhook signature or payload');
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    // Verify webhook signature
    const gateway = getBraintreeGateway('sandbox'); // Use appropriate environment
    let webhookNotification;
    
    try {
      webhookNotification = await gateway.webhookNotification.parse(btSignature, btPayload);
    } catch (verifyError) {
      console.error('❌ Webhook signature verification failed:', verifyError);
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    console.log('✅ Webhook verified. Kind:', webhookNotification.kind);

    // Process different webhook types
    switch (webhookNotification.kind) {
      case 'transaction_settled':
      case 'transaction_settlement_declined':
        await handleTransactionWebhook(webhookNotification);
        break;

      case 'dispute_opened':
      case 'dispute_lost':
      case 'dispute_won':
        await handleDisputeWebhook(webhookNotification);
        break;

      case 'subscription_charged_successfully':
      case 'subscription_charged_unsuccessfully':
        await handleSubscriptionWebhook(webhookNotification);
        break;

      case 'sub_merchant_account_approved':
      case 'sub_merchant_account_declined':
        await handleMerchantAccountWebhook(webhookNotification);
        break;

      default:
        console.log(`ℹ️ Unhandled webhook kind: ${webhookNotification.kind}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error processing Braintree webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleTransactionWebhook(notification: any) {
  try {
    const transaction = notification.transaction;
    console.log('💳 Processing transaction webhook:', {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      paymentMethodType: transaction.paymentInstrument?.type || 'unknown'
    });

    // Extract agency ID from custom field or customer ID
    let agencyId: string | null = null;
    
    if (transaction.customFields) {
      const customField = Object.values(transaction.customFields)[0] as string;
      if (customField?.startsWith('agency_')) {
        agencyId = customField.replace('agency_', '');
      }
    }
    
    if (!agencyId && transaction.customerId?.startsWith('agency_')) {
      agencyId = transaction.customerId.replace('agency_', '');
    }

    if (!agencyId) {
      console.warn('⚠️ Could not determine agency ID from transaction');
      return;
    }

    // Find agency
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, slug, name')
      .eq('id', agencyId)
      .single();

    if (agencyError || !agency) {
      console.error('❌ Agency not found for transaction:', agencyId);
      return;
    }

    // Log transaction event (you might want to store this in a transactions table)
    console.log(`💳 Transaction ${transaction.id} for agency ${agency.slug}: ${transaction.status}`);

    // Update agency's last sync time
    await supabase
      .from('agencies')
      .update({
        braintree_last_sync_at: new Date().toISOString(),
        braintree_integration_data: JSON.stringify({
          lastTransactionWebhook: new Date().toISOString(),
          lastTransactionId: transaction.id
        })
      })
      .eq('id', agencyId);

    // Here you might want to:
    // - Update order status in your database
    // - Send confirmation emails
    // - Trigger fulfillment processes
    // - Update analytics/reporting

  } catch (error) {
    console.error('❌ Error handling transaction webhook:', error);
  }
}

async function handleDisputeWebhook(notification: any) {
  try {
    const dispute = notification.dispute;
    console.log('⚖️ Processing dispute webhook:', {
      id: dispute.id,
      kind: notification.kind,
      status: dispute.status,
      amount: dispute.amount
    });

    // Extract transaction info to find agency
    const transaction = dispute.transaction;
    let agencyId: string | null = null;
    
    if (transaction?.customFields) {
      const customField = Object.values(transaction.customFields)[0] as string;
      if (customField?.startsWith('agency_')) {
        agencyId = customField.replace('agency_', '');
      }
    }

    if (agencyId) {
      // Update agency with dispute information
      await supabase
        .from('agencies')
        .update({
          braintree_last_sync_at: new Date().toISOString(),
          braintree_integration_data: JSON.stringify({
            lastDisputeWebhook: new Date().toISOString(),
            lastDisputeId: dispute.id
          })
        })
        .eq('id', agencyId);

      // Here you might want to:
      // - Notify agency of dispute
      // - Suspend related services
      // - Update risk assessment
    }

  } catch (error) {
    console.error('❌ Error handling dispute webhook:', error);
  }
}

async function handleSubscriptionWebhook(notification: any) {
  try {
    const subscription = notification.subscription;
    console.log('🔄 Processing subscription webhook:', {
      id: subscription.id,
      kind: notification.kind,
      status: subscription.status
    });

    // Handle subscription events if you use Braintree subscriptions
    // This could be for YCE Processing subscriptions or other recurring billing

  } catch (error) {
    console.error('❌ Error handling subscription webhook:', error);
  }
}

async function handleMerchantAccountWebhook(notification: any) {
  try {
    const merchantAccount = notification.merchantAccount;
    console.log('🏪 Processing merchant account webhook:', {
      id: merchantAccount.id,
      kind: notification.kind,
      status: merchantAccount.status
    });

    // Update agency merchant account status based on webhook
    let newStatus = 'active';
    switch (notification.kind) {
      case 'merchant_account_declined':
        newStatus = 'needs_attention';
        break;
      case 'merchant_account_suspended':
        newStatus = 'suspended';
        break;
    }

    // Find agency by merchant ID and update status
    const { data: agencies, error: findError } = await supabase
      .from('agencies')
      .select('id, slug')
      .eq('braintree_merchant_id', merchantAccount.id);

    if (findError || !agencies?.length) {
      console.warn('⚠️ No agency found for merchant account:', merchantAccount.id);
      return;
    }

    // Update all matching agencies (should typically be just one)
    for (const agency of agencies) {
      await supabase
        .from('agencies')
        .update({
          braintree_account_status: newStatus,
          braintree_last_sync_at: new Date().toISOString(),
          braintree_integration_data: JSON.stringify({
            lastMerchantWebhook: new Date().toISOString(),
            webhookStatus: newStatus
          })
        })
        .eq('id', agency.id);

      console.log(`🏪 Updated merchant status for agency ${agency.slug}: ${newStatus}`);
    }

  } catch (error) {
    console.error('❌ Error handling merchant account webhook:', error);
  }
}