'use server';

import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/db/supabase-client';
import braintree from 'braintree';

// Braintree Gateway configuration
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

// Generate client token for frontend SDK initialization
export async function getBraintreeClientToken() {
  try {
    console.log('🏦 Generating Braintree client token...');
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's agency
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        agency:agencies(*)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user?.agency) {
      return { success: false, error: 'Agency not found' };
    }

    const gateway = getBraintreeGateway(user.agency.braintree_environment || 'sandbox');

    // Generate client token with customer ID if available
    const clientTokenRequest: any = {};
    if (user.agency.braintree_merchant_id) {
      clientTokenRequest.customerId = `agency_${user.agency.id}`;
    }

    const response = await gateway.clientToken.generate(clientTokenRequest);

    if (!response.success) {
      console.error('❌ Error generating Braintree client token:', response.message);
      return { success: false, error: response.message || 'Failed to generate client token' };
    }

    console.log('✅ Braintree client token generated successfully');
    return { 
      success: true, 
      clientToken: response.clientToken,
      environment: user.agency.braintree_environment || 'sandbox'
    };
  } catch (error) {
    console.error('❌ Error generating Braintree client token:', error);
    return { 
      success: false, 
      error: 'Failed to generate client token' 
    };
  }
}

// Initialize Braintree merchant account for agency
export async function initializeBraintreeMerchant() {
  try {
    console.log('🏦 Initializing Braintree merchant account...');
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's agency
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        agency:agencies(*)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user?.agency) {
      return { success: false, error: 'Agency not found' };
    }

    // Check if already initialized
    if (user.agency.braintree_merchant_id) {
      return { 
        success: true, 
        message: 'Braintree merchant account already initialized',
        merchantId: user.agency.braintree_merchant_id,
        environment: user.agency.braintree_environment
      };
    }

    const gateway = getBraintreeGateway('sandbox'); // Always start with sandbox

    // Create customer in Braintree for the agency
    const customerId = `agency_${user.agency.id}`;
    const customerRequest = {
      id: customerId,
      firstName: user.agency.name?.split(' ')[0] || 'Agency',
      lastName: user.agency.name?.split(' ').slice(1).join(' ') || 'User',
      email: user.emailAddress || 'noreply@example.com',
      company: user.agency.name || 'YardCard Elite Agency',
    };

    try {
      const customerResponse = await gateway.customer.create(customerRequest);
      
      if (!customerResponse.success) {
        // Customer might already exist, try to find it
        const findResponse = await gateway.customer.find(customerId);
        if (!findResponse) {
          console.error('❌ Error creating/finding Braintree customer:', customerResponse.message);
          return { success: false, error: customerResponse.message || 'Failed to create customer' };
        }
      }

      console.log('✅ Braintree customer created/found successfully');
    } catch (customerError) {
      console.warn('⚠️ Customer creation issue (may already exist):', customerError);
    }

    // Update agency with Braintree configuration
    const { error: updateError } = await supabase
      .from('agencies')
      .update({
        braintree_environment: 'sandbox',
        braintree_merchant_id: process.env.BRAINTREE_MERCHANT_ID!,
        braintree_public_key: process.env.BRAINTREE_PUBLIC_KEY!,
        braintree_account_status: 'active',
        venmo_enabled: true, // Enable Venmo by default
        venmo_allow_desktop: true,
        venmo_allow_web_login: true,
        venmo_payment_method_usage: 'multi_use',
        braintree_created_at: new Date().toISOString(),
        braintree_last_sync_at: new Date().toISOString(),
        braintree_integration_data: JSON.stringify({
          customerId: customerId,
          initializedAt: new Date().toISOString(),
          sdk_version: '3.129.0'
        })
      })
      .eq('id', user.agency.id);

    if (updateError) {
      console.error('❌ Error updating agency with Braintree config:', updateError);
      return { success: false, error: 'Failed to save Braintree configuration' };
    }

    return { 
      success: true, 
      merchantId: process.env.BRAINTREE_MERCHANT_ID!,
      environment: 'sandbox',
      customerId: customerId,
      venmoEnabled: true
    };
  } catch (error) {
    console.error('❌ Error initializing Braintree merchant account:', error);
    return { 
      success: false, 
      error: 'Failed to initialize Braintree merchant account' 
    };
  }
}

// Process Venmo payment (called from frontend after tokenization)
export async function processVenmoPayment(paymentMethodNonce: string, amount: number, deviceData?: string) {
  try {
    console.log('🏦 Processing Venmo payment...', { amount });
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's agency
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        agency:agencies(*)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user?.agency) {
      return { success: false, error: 'Agency not found' };
    }

    if (!user.agency.braintree_merchant_id || !user.agency.venmo_enabled) {
      return { success: false, error: 'Venmo not enabled for this agency' };
    }

    const gateway = getBraintreeGateway(user.agency.braintree_environment || 'sandbox');

    const transactionRequest = {
      amount: amount.toString(),
      paymentMethodNonce: paymentMethodNonce,
      deviceData: deviceData,
      options: {
        submitForSettlement: true,
        paypal: {
          customField: `agency_${user.agency.id}`,
          description: `YardCard Elite payment for ${user.agency.name}`,
        }
      }
    };

    const response = await gateway.transaction.sale(transactionRequest);

    if (!response.success) {
      console.error('❌ Venmo transaction failed:', response.message);
      return { 
        success: false, 
        error: response.message || 'Transaction failed',
        processorResponse: response.transaction?.processorResponseText
      };
    }

    console.log('✅ Venmo transaction successful:', response.transaction.id);
    
    // Store transaction data for reference
    const transactionData = {
      transactionId: response.transaction.id,
      amount: response.transaction.amount,
      status: response.transaction.status,
      paymentMethodType: 'venmo',
      customerId: response.transaction.customer?.id,
      createdAt: response.transaction.createdAt,
      paymentInstrument: response.transaction.venmoAccount
    };

    return { 
      success: true, 
      transaction: transactionData,
      transactionId: response.transaction.id
    };
  } catch (error) {
    console.error('❌ Error processing Venmo payment:', error);
    return { 
      success: false, 
      error: 'Failed to process Venmo payment' 
    };
  }
}

// Get Braintree merchant account status
export async function getBraintreeStatus() {
  try {
    console.log('🏦 Getting Braintree status...');
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Get user's agency
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        agency:agencies(*)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user?.agency) {
      throw new Error('Agency not found');
    }

    const agency = user.agency;
    console.log('🏦 Agency found for Braintree status check:', { 
      id: agency.id, 
      slug: agency.slug,
      hasBraintreeAccount: !!agency.braintree_merchant_id 
    });

    // If no Braintree account exists
    if (!agency.braintree_merchant_id) {
      console.log('🏦 No Braintree merchant ID found for agency');
      return {
        merchantId: null,
        isConnected: false,
        environment: 'sandbox',
        venmoEnabled: false,
        accountStatus: 'not_connected',
        allowDesktop: true,
        allowWebLogin: true,
        paymentMethodUsage: 'multi_use',
        lastSyncAt: null,
      };
    }

    // Return cached status from database
    return {
      merchantId: agency.braintree_merchant_id,
      isConnected: !!agency.braintree_merchant_id,
      environment: agency.braintree_environment || 'sandbox',
      venmoEnabled: agency.venmo_enabled || false,
      accountStatus: agency.braintree_account_status || 'active',
      allowDesktop: agency.venmo_allow_desktop || true,
      allowWebLogin: agency.venmo_allow_web_login || true,
      paymentMethodUsage: agency.venmo_payment_method_usage || 'multi_use',
      lastSyncAt: agency.braintree_last_sync_at,
      integrationData: agency.braintree_integration_data,
      publicKey: agency.braintree_public_key
    };
  } catch (error) {
    console.error('❌ Error getting Braintree status:', error);
    throw error;
  }
}

// Update Venmo settings for agency
export async function updateVenmoSettings(settings: {
  venmoEnabled?: boolean;
  allowDesktop?: boolean;
  allowWebLogin?: boolean;
  paymentMethodUsage?: 'single_use' | 'multi_use';
}) {
  try {
    console.log('🔄 Updating Venmo settings...', settings);
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's agency
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        agency:agencies(*)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user?.agency) {
      return { success: false, error: 'Agency not found' };
    }

    if (!user.agency.braintree_merchant_id) {
      return { success: false, error: 'Braintree not initialized' };
    }

    // Update settings
    const updateData: any = {
      braintree_last_sync_at: new Date().toISOString()
    };

    if (settings.venmoEnabled !== undefined) {
      updateData.venmo_enabled = settings.venmoEnabled;
    }
    if (settings.allowDesktop !== undefined) {
      updateData.venmo_allow_desktop = settings.allowDesktop;
    }
    if (settings.allowWebLogin !== undefined) {
      updateData.venmo_allow_web_login = settings.allowWebLogin;
    }
    if (settings.paymentMethodUsage !== undefined) {
      updateData.venmo_payment_method_usage = settings.paymentMethodUsage;
    }

    const { error: updateError } = await supabase
      .from('agencies')
      .update(updateData)
      .eq('id', user.agency.id);

    if (updateError) {
      console.error('❌ Error updating Venmo settings:', updateError);
      return { success: false, error: 'Failed to update settings' };
    }

    console.log('✅ Venmo settings updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating Venmo settings:', error);
    return { 
      success: false, 
      error: 'Failed to update Venmo settings' 
    };
  }
}

// Refresh Braintree account status
export async function refreshBraintreeAccount() {
  try {
    console.log('🔄 Refreshing Braintree account status...');
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Braintree refresh failed: No user ID');
      return { success: false, error: 'Unauthorized' };
    }

    const status = await getBraintreeStatus();
    console.log('✅ Braintree account status refreshed successfully:', {
      isConnected: status.isConnected,
      venmoEnabled: status.venmoEnabled,
      accountStatus: status.accountStatus
    });
    
    return { success: true, status };
  } catch (error) {
    console.error('❌ Error refreshing Braintree account:', error);
    return { 
      success: false, 
      error: 'Failed to refresh Braintree account status' 
    };
  }
}