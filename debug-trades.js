// Simple script to debug trades in the database
import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTrades() {
  try {
    console.log('🔍 Debugging trades in database...\n');
    
    // Get all trades
    const { data: allTrades, error: allTradesError } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allTradesError) {
      console.error('Error fetching all trades:', allTradesError);
      return;
    }
    
    console.log(`📊 Total trades in database: ${allTrades?.length || 0}`);
    
    if (allTrades && allTrades.length > 0) {
      // Group by status
      const statusCounts = allTrades.reduce((acc, trade) => {
        acc[trade.status] = (acc[trade.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Trades by status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      // Show recent trades
      console.log('\n🕒 Recent trades:');
      allTrades.slice(0, 5).forEach((trade, index) => {
        console.log(`  ${index + 1}. ID: ${trade.id.slice(0, 8)}... | Status: ${trade.status} | Escrow: ${trade.escrow_status || 'N/A'} | Type: ${trade.trade_type} | Created: ${new Date(trade.created_at).toLocaleString()}`);
      });
      
      // Check for completed trades
      const completedTrades = allTrades.filter(trade => trade.status === 'completed');
      console.log(`\n✅ Completed trades: ${completedTrades.length}`);
      
      if (completedTrades.length > 0) {
        console.log('Recent completed trades:');
        completedTrades.slice(0, 3).forEach((trade, index) => {
          console.log(`  ${index + 1}. ID: ${trade.id.slice(0, 8)}... | Completed: ${trade.completed_at ? new Date(trade.completed_at).toLocaleString() : 'No timestamp'}`);
        });
      }
    }
    
    // Check trade requests
    const { data: tradeRequests, error: requestsError } = await supabase
      .from('trade_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!requestsError && tradeRequests) {
      console.log(`\n📝 Recent trade requests: ${tradeRequests.length}`);
      tradeRequests.slice(0, 3).forEach((request, index) => {
        console.log(`  ${index + 1}. ID: ${request.id.slice(0, 8)}... | Status: ${request.status} | Type: ${request.trade_type} | Created: ${new Date(request.created_at).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('Error debugging trades:', error);
  }
}

// Instructions for running this script
console.log(`
🚀 To run this debug script:

1. Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with your actual values
2. Run: node debug-trades.js

This will help identify:
- How many trades exist in the database
- What statuses they have
- Whether completed trades exist
- Recent trade activity

If no completed trades exist, that's why they're not showing up in /mytrades!
`);

// Uncomment the line below and add your Supabase credentials to run
// debugTrades();