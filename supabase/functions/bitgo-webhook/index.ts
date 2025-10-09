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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const webhook = await req.json();
    console.log('BitGo webhook received:', webhook);

    const { type, coin, wallet, transfer } = webhook;

    // Handle confirmed transactions
    if (type === 'transfer' && transfer?.state === 'confirmed') {
      const { txid, outputs, value, valueString } = transfer;
      
      console.log('Processing confirmed transfer:', {
        txid,
        coin,
        wallet,
        value,
        outputs: outputs?.length
      });

      // Check each output for escrow addresses
      for (const output of outputs || []) {
        const { address, value: outputValue } = output;
        
        // Find matching escrow record
        const { data: escrowRecord } = await supabase
          .from('escrow_addresses')
          .select('*')
          .eq('address', address)
          .eq('status', 'pending')
          .single();

        if (escrowRecord) {
          console.log('Found matching escrow:', escrowRecord);
          
          // Update escrow status
          await supabase
            .from('escrow_addresses')
            .update({
              status: 'confirmed',
              tx_hash: txid,
              received_amount: outputValue,
              confirmed_at: new Date().toISOString()
            })
            .eq('id', escrowRecord.id);

          // Update trade request status
          await supabase
            .from('trade_requests')
            .update({
              status: 'crypto_confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('escrow_address', address);

          // Notify user
          await supabase
            .from('notifications')
            .insert({
              user_id: escrowRecord.user_id,
              type: 'crypto_confirmed',
              title: 'Crypto Deposit Confirmed',
              message: `Your ${coin.toUpperCase()} deposit has been confirmed. Trade is now active.`,
              data: {
                trade_id: escrowRecord.trade_id,
                txid,
                amount: outputValue,
                coin
              }
            });

          console.log('Escrow confirmed and notifications sent');
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});