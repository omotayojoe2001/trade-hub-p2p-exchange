// Run this Node.js script to create vendor users via Supabase Auth API
// npm install @supabase/supabase-js
// node create_vendor_users.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://towffqxmmqyhbuyphkui.supabase.co';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY'; // Get from Supabase Settings > API

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const vendors = [
  { email: 'ikeja@tradehub.com', password: 'TradeHub2024!', name: 'Ikeja Agent', location: 'Ikeja' },
  { email: 'island@tradehub.com', password: 'TradeHub2024!', name: 'Island Agent', location: 'Lagos Island' }
];

async function createVendorUsers() {
  for (const vendor of vendors) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: vendor.email,
        password: vendor.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`Error creating ${vendor.email}:`, authError);
        continue;
      }

      console.log(`✅ Created user: ${vendor.email} (ID: ${authData.user.id})`);

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          display_name: vendor.name,
          phone_number: '+234 801 234 5678',
          location: vendor.location,
          bio: `Cash delivery agent for ${vendor.location} area`,
          user_type: 'vendor',
          is_vendor: true
        });

      if (profileError) {
        console.error(`Error creating profile for ${vendor.email}:`, profileError);
      }

      // Create vendor entry
      const { error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: authData.user.id,
          name: vendor.name,
          location: vendor.location,
          phone_number: '+234 801 234 5678',
          bank_name: 'Central Exchange Bank',
          account_number: '1234567890',
          account_name: 'TradeHub Vendor Services',
          is_active: true
        });

      if (vendorError) {
        console.error(`Error creating vendor for ${vendor.email}:`, vendorError);
      }

      console.log(`✅ Setup complete for: ${vendor.email}`);

    } catch (error) {
      console.error(`Error with ${vendor.email}:`, error);
    }
  }
}

createVendorUsers();