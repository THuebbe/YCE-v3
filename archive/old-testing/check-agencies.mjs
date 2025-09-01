#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAgencies() {
  console.log('🏢 Checking agencies in database...\n');
  
  const { data: agencies, error } = await supabase
    .from('agencies')
    .select('*');
  
  if (error) {
    console.error('❌ Error fetching agencies:', error.message);
    return;
  }
  
  if (agencies.length === 0) {
    console.log('⚠️  No agencies found in database');
    console.log('\nMust create the agency first. Let me create it...');
    
    const { data: newAgency, error: createError } = await supabase
      .from('agencies')
      .insert({
        id: 'yardcard-elite-west-branch',
        name: 'YardCard Elite West Branch',
        slug: 'yardcard-elite-west-branch',
        isActive: true
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating agency:', createError.message);
      return;
    }
    
    console.log('✅ Created agency:', newAgency);
  } else {
    console.log(`✅ Found ${agencies.length} agencies:`);
    agencies.forEach(agency => {
      console.log(`   • ${agency.name} (${agency.id}) - slug: ${agency.slug}`);
    });
  }
}

checkAgencies();