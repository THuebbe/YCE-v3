#!/usr/bin/env tsx

/**
 * Apply booking columns migration to orders table
 * This fixes the step 5 booking flow errors by adding missing columns
 */

import { supabase } from '../src/lib/db/supabase-client';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyBookingMigration() {
  console.log('🚀 Applying booking columns migration to orders table...\n');
  
  try {
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'migrations', '20250806_add_booking_columns_to_orders.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📖 Migration SQL loaded successfully');
    console.log('🔧 Executing migration...\n');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      console.error('\nDetails:', error.details);
      console.error('Hint:', error.hint);
      process.exit(1);
    }
    
    console.log('✅ Migration executed successfully!');
    
    // Verify the new columns were added
    console.log('\n🔍 Verifying new columns were added...');
    
    const { data: columns, error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name IN (
          'confirmationCode', 'deliveryStreet', 'deliveryCity', 'deliveryState', 'deliveryZipCode',
          'timeWindow', 'deliveryNotes', 'eventMessage', 'customMessage', 'recipientName',
          'eventNumber', 'messageStyle', 'nameStyle', 'characterTheme', 'hobbies',
          'extraDaysBefore', 'extraDaysAfter', 'paymentMethod', 'paymentMethodId', 'billingZipCode',
          'holdId', 'paymentIntentId'
        )
        ORDER BY column_name;
      `
    });
    
    if (columnError) {
      console.warn('⚠️  Could not verify columns (but migration may have succeeded):', columnError.message);
    } else {
      console.log(`✅ Found ${columns?.length || 0} new booking-related columns in orders table`);
      
      if (data?.length > 0) {
        console.log('\n📋 New columns added:');
        data.forEach((col: any) => {
          console.log(`   • ${col.column_name} (${col.data_type}${col.is_nullable === 'YES' ? ', nullable' : ', not null'})`);
        });
      }
    }
    
    console.log('\n🎉 Booking flow database migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update the order creation API to use the new columns');
    console.log('   2. Test the booking flow from step 1 to completion');
    console.log('   3. Verify order data is properly stored');
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check that your Supabase environment variables are set correctly');
    console.error('2. Ensure you have the necessary database permissions');
    console.error('3. Verify the migration SQL file exists and is readable');
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  applyBookingMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}

export { applyBookingMigration };