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
    console.log('BitGo webhook received:', JSON.stringify(webhookData, null, 2));

    // Log webhook for debugging
    await supabase.from('bitgo_webhooks').insert({ webhook_data: webhookData });

    const { type, coin, wallet, transfer } = webhookData;

    // Only process confirmed transfers
    if (type === 'transfer' && transfer?.state === 'confirmed') {
      const { txid, outputs, value, entries } = transfer;
      const cryptoType = coin?.toUpperCase() || 'BTC';
      
      console.log(`Processing ${cryptoType} transfer:`, { txid, value });

      // Process each output/entry
      const addressesToCheck = [];
      
      // For BTC - use outputs
      if (outputs && outputs.length > 0) {
        addressesToCheck.push(...outputs.map(o => ({ address: o.address, value: o.value })));
      }
      
      // For USDT/tokens - use entries
      if (entries && entries.length > 0) {
        addressesToCheck.push(...entries.map(e => ({ address: e.address, value: e.value })));
      }

      for (const { address, value: outputValue } of addressesToCheck) {
        console.log(`Checking address: ${address} for amount: ${outputValue}`);

        // 1. Check for trade escrow addresses
        const { data: escrowRecord } = await supabase
          .from('escrow_addresses')
          .select('*')
          .eq('address', address)
          .eq('status', 'pending')
          .single();

        if (escrowRecord) {
          console.log('Found escrow record:', escrowRecord.id);
          
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

          // Update related trade status
          if (escrowRecord.trade_id) {
            await supabase
              .from('trades')
              .update({
                status: 'crypto_deposited',
                escrow_status: 'crypto_deposited'
              })
              .eq('id', escrowRecord.trade_id);

            // Get trade details for notifications
            const { data: trade } = await supabase
              .from('trades')
              .select('buyer_id, seller_id, coin_type, amount')
              .eq('id', escrowRecord.trade_id)
              .single();

            if (trade) {
              // Notify both parties
              const notifications = [
                {
                  user_id: trade.buyer_id,
                  type: 'payment_confirmed',
                  title: 'Crypto Deposited',
                  message: `${trade.amount} ${trade.coin_type} deposited to escrow`,
                  data: { txid, trade_id: escrowRecord.trade_id }
                },
                {
                  user_id: trade.seller_id,
                  type: 'payment_confirmed', 
                  title: 'Crypto Received',
                  message: `${trade.amount} ${trade.coin_type} received in escrow`,
                  data: { txid, trade_id: escrowRecord.trade_id }
                }
              ];

              await supabase.from('notifications').insert(notifications);
            }
          }

          console.log('Trade escrow confirmed:', { address, txid, amount: outputValue });
        }

        // 2. Check for credit purchase addresses
        const { data: creditPurchase } = await supabase
          .from('credit_purchases')
          .select('*')
          .eq('payment_address', address)
          .eq('status', 'pending')
          .single();

        if (creditPurchase) {
          console.log('Found credit purchase:', creditPurchase.id);
          
          // Verify amount matches (with small tolerance for fees)
          const expectedAmount = parseFloat(creditPurchase.crypto_amount);
          const receivedAmount = parseFloat(outputValue) / 100000000; // Convert satoshis to BTC
          const tolerance = expectedAmount * 0.02; // 2% tolerance

          if (Math.abs(expectedAmount - receivedAmount) <= tolerance) {
            // Update purchase status
            await supabase
              .from('credit_purchases')
              .update({
                status: 'confirmed',
                transaction_hash: txid,
                confirmed_at: new Date().toISOString()
              })
              .eq('id', creditPurchase.id);

            // Add credits to user account
            const { error: creditsError } = await supabase.rpc('add_user_credits', {
              user_id_param: creditPurchase.user_id,
              credits_amount: creditPurchase.credits_amount,
              description_text: `Credit purchase confirmed - ${txid}`
            });

            if (!creditsError) {
              // Mark purchase as completed
              await supabase
                .from('credit_purchases')
                .update({ status: 'completed' })
                .eq('id', creditPurchase.id);

              // Notify user
              await supabase
                .from('notifications')
                .insert({
                  user_id: creditPurchase.user_id,
                  type: 'credits_added',
                  title: 'Credits Added',
                  message: `${creditPurchase.credits_amount} credits added to your account`,
                  data: { txid, credits: creditPurchase.credits_amount }
                });

              console.log('Credits added:', { 
                user_id: creditPurchase.user_id, 
                credits: creditPurchase.credits_amount,
                txid 
              });
            } else {
              console.error('Error adding credits:', creditsError);
            }
          } else {
            console.log('Amount mismatch:', { expected: expectedAmount, received: receivedAmount });
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