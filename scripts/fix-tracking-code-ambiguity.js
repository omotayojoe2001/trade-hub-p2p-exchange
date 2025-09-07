const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTrackingCodeAmbiguity() {
  console.log('🔧 Fixing tracking_code ambiguity in generate_cash_order_tracking_code function...');
  
  const fixSQL = `
    -- Fix the ambiguous tracking_code column reference in generate_cash_order_tracking_code function
    CREATE OR REPLACE FUNCTION generate_cash_order_tracking_code(order_type TEXT)
    RETURNS TEXT AS $$
    DECLARE
        prefix TEXT;
        year_part TEXT;
        random_part TEXT;
        generated_code TEXT;  -- Changed variable name to avoid ambiguity
    BEGIN
        -- Set prefix based on order type
        IF order_type = 'naira_to_usd_pickup' THEN
            prefix := 'NUP';
        ELSIF order_type = 'naira_to_usd_delivery' THEN
            prefix := 'NUD';
        ELSE
            prefix := 'NCO';
        END IF;
        
        -- Get current year (last 2 digits)
        year_part := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
        
        -- Generate random 4-digit number
        random_part := LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
        
        -- Combine parts
        generated_code := prefix || '-' || year_part || '-' || random_part;
        
        -- Ensure uniqueness - now properly qualified column reference
        WHILE EXISTS (SELECT 1 FROM cash_order_tracking WHERE cash_order_tracking.tracking_code = generated_code) LOOP
            random_part := LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
            generated_code := prefix || '-' || year_part || '-' || random_part;
        END LOOP;
        
        RETURN generated_code;
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: fixSQL });
    
    if (error) {
      console.error('❌ Error applying fix:', error);
      return false;
    }
    
    console.log('✅ Successfully fixed tracking_code ambiguity!');
    
    // Test the function to make sure it works
    console.log('🧪 Testing the fixed function...');
    const { data: testData, error: testError } = await supabase.rpc('generate_cash_order_tracking_code', { 
      order_type: 'naira_to_usd_pickup' 
    });
    
    if (testError) {
      console.error('❌ Function test failed:', testError);
      return false;
    }
    
    console.log('✅ Function test successful! Generated code:', testData);
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the fix
fixTrackingCodeAmbiguity().then(success => {
  if (success) {
    console.log('\n🎉 Fix applied successfully! Your Send Naira payment flow should now work.');
    console.log('Try creating a cash order again.');
  } else {
    console.log('\n❌ Fix failed. Please check the error messages above.');
  }
  process.exit(success ? 0 : 1);
});
