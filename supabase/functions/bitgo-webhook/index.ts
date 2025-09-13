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

    const { type, data } = webhook;
    
    if (type === 'transfer') {
      const { coin, txid, outputs, confirmations } = data;
      
      for (const output of outputs) {
        const { address, value } = output;
        
        const { data: escrowRecord } = await supabase
          .from('escrow_addresses')
          .select('*')
          .eq('address', address)
          .eq('status', 'pending')
          .single();

        if (escrowRecord) {
          console.log('Payment detected:', { address, value, confirmations });
          
          await supabase
            .from('escrow_addresses')
            .update({
              status: confirmations >= 1 ? 'confirmed' : 'unconfirmed',
              amount_received: value,
              tx_hash: txid,
              confirmations: confirmations,
              received_at: new Date().toISOString()
            })
            .eq('id', escrowRecord.id);

          if (escrowRecord.trade_id.startsWith('premium_') && confirmations >= 1) {
            const parts = escrowRecord.trade_id.split('_');
            if (parts.length >= 2) {
              const userId = parts[1];
              
              // Validate payment amount
              const expectedAmount = escrowRecord.expected_amount;
              const receivedAmount = value;
              const tolerance = expectedAmount * 0.01; // 1% tolerance for network fees
              
              if (receivedAmount >= (expectedAmount - tolerance)) {
                await supabase
                  .from('profiles')
                  .update({
                    is_premium: true,
                    premium_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                  })
                  .eq('user_id', userId);

                console.log('Premium granted to user:', userId, 'Amount validated:', receivedAmount, 'Expected:', expectedAmount);
              } else {
                console.log('Payment amount insufficient:', receivedAmount, 'Expected:', expectedAmount);
                
                await supabase
                  .from('escrow_addresses')
                  .update({ status: 'insufficient_amount' })
                  .eq('id', escrowRecord.id);
              }
            }
          }
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