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
    const webhookData = await req.json();
    console.log('BitGo webhook received:', webhookData);

    const { type, coin, wallet, transfer } = webhookData;

    // Only process confirmed transfers
    if (type === 'transfer' && transfer?.state === 'confirmed') {
      const { txid, outputs, value } = transfer;

      // Find matching escrow address
      for (const output of outputs || []) {
        const { address, value: outputValue } = output;

        const { data: escrowRecord } = await supabase
          .from('escrow_addresses')
          .select('*')
          .eq('address', address)
          .eq('status', 'pending')
          .single();

        if (escrowRecord) {
          // Update escrow status to confirmed
          await supabase
            .from('escrow_addresses')
            .update({
              status: 'confirmed',
              tx_hash: txid,
              received_amount: outputValue,
              confirmed_at: new Date().toISOString()
            })
            .eq('id', escrowRecord.id);

          // Notify trade participants
          await supabase
            .from('notifications')
            .insert({
              user_id: escrowRecord.trade_id, // Will need to get actual user IDs
              type: 'payment_confirmed',
              title: 'Payment Confirmed',
              message: `${escrowRecord.coin} payment confirmed on blockchain`,
              data: { txid, amount: outputValue, address }
            });

          console.log('Payment confirmed:', { address, txid, amount: outputValue });
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