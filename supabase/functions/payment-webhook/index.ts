import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, data } = await req.json();

    // BitGo webhook for payment confirmation
    if (type === 'transfer' && data.state === 'confirmed') {
      const { address, value, coin } = data;
      
      // Find pending credit purchase by address
      const { data: purchase, error } = await supabaseClient
        .from('credit_purchase_transactions')
        .select('*')
        .eq('payment_address', address)
        .eq('status', 'pending')
        .single();

      if (error || !purchase) {
        console.log('No matching purchase found for address:', address);
        return new Response('No matching purchase', { status: 404 });
      }

      // Convert satoshis to BTC for comparison
      const receivedAmount = coin === 'btc' ? value / 100000000 : value;
      const expectedAmount = purchase.crypto_amount;

      // Check if received amount matches expected (with 1% tolerance)
      const tolerance = expectedAmount * 0.01;
      if (Math.abs(receivedAmount - expectedAmount) <= tolerance) {
        // Payment confirmed - add credits to user
        const { error: updateError } = await supabaseClient
          .from('credit_purchase_transactions')
          .update({
            status: 'completed',
            confirmed_at: new Date().toISOString(),
            received_amount: receivedAmount
          })
          .eq('id', purchase.id);

        if (updateError) {
          throw updateError;
        }

        // Add credits to user's balance
        const { error: creditError } = await supabaseClient.rpc('add_user_credits', {
          user_id: purchase.user_id,
          credits_to_add: purchase.credits_amount
        });

        if (creditError) {
          console.error('Error adding credits:', creditError);
        }

        console.log(`Credits added: ${purchase.credits_amount} for user ${purchase.user_id}`);
        
        return new Response('Payment processed', { headers: corsHeaders });
      } else {
        console.log(`Amount mismatch: received ${receivedAmount}, expected ${expectedAmount}`);
        return new Response('Amount mismatch', { status: 400 });
      }
    }

    return new Response('Webhook received', { headers: corsHeaders });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});