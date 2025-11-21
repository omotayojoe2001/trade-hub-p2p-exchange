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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    console.log('BitGo Webhook received:', webhookData);

    // BitGo sends different webhook types
    if (webhookData.type === 'transfer') {
      const { coin, wallet, transfer } = webhookData;
      
      // Check if this is a deposit to our escrow wallet
      if (wallet === '68dd6fe94425f8b958244dcf157a6635') {
        
        // Find the trade associated with this address
        const { data: escrowRecord } = await supabase
          .from('escrow_addresses')
          .select('*')
          .eq('address', transfer.outputs[0].address)
          .eq('status', 'pending')
          .single();

        if (escrowRecord) {
          // AUTOMATIC DEPOSIT CONFIRMATION
          await supabase
            .from('escrow_addresses')
            .update({ 
              status: 'funded',
              actual_amount: transfer.value / 100000000, // Convert from satoshis
              tx_hash: transfer.txid,
              confirmed_at: new Date().toISOString()
            })
            .eq('id', escrowRecord.id);

          // Update trade status
          await supabase
            .from('trades')
            .update({ 
              escrow_status: 'crypto_deposited',
              status: 'payment_confirmed'
            })
            .eq('id', escrowRecord.trade_id);

          console.log(`✅ Auto-confirmed deposit for trade ${escrowRecord.trade_id}`);
        }
      }
    }

    // SMART CONTRACT LOGIC: Auto-release when conditions met
    if (webhookData.type === 'payment_confirmed') {
      const tradeId = webhookData.tradeId;
      
      // Check if both conditions are met:
      // 1. Crypto is in escrow
      // 2. Fiat payment is confirmed
      const { data: trade } = await supabase
        .from('trades')
        .select('*, escrow_addresses(*)')
        .eq('id', tradeId)
        .single();

      if (trade && 
          trade.escrow_addresses?.status === 'funded' && 
          trade.payment_proof_url && 
          trade.status === 'payment_sent') {
        
        // AUTOMATIC RELEASE CONDITIONS MET
        console.log(`🚀 Auto-releasing funds for trade ${tradeId}`);
        
        // Call BitGo to release funds
        const releaseResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/bitgo-escrow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            action: 'release',
            tradeId: tradeId,
            coin: trade.coin_type,
            toAddress: trade.buyer_wallet_address,
            amount: trade.amount_crypto
          })
        });

        if (releaseResponse.ok) {
          const releaseData = await releaseResponse.json();
          
          // Update trade as completed
          await supabase
            .from('trades')
            .update({
              status: 'completed',
              escrow_status: 'released',
              transaction_hash: releaseData.txid,
              completed_at: new Date().toISOString()
            })
            .eq('id', tradeId);

          console.log(`✅ Trade ${tradeId} completed automatically`);
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