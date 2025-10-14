import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BITGO_BASE_URL = 'http://165.1.72.24:3000/api/bitgo';
const BITGO_ACCESS_TOKEN = Deno.env.get('BITGO_ACCESS_TOKEN');
const BTC_WALLET_ID = Deno.env.get('BITGO_BTC_WALLET_ID');
const ETH_WALLET_ID = Deno.env.get('BITGO_ETH_WALLET_ID');
const XRP_WALLET_ID = Deno.env.get('BITGO_XRP_WALLET_ID');
const POLYGON_WALLET_ID = Deno.env.get('BITGO_POLYGON_WALLET_ID');

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
    const requestBody = await req.json();
    const { tradeId, coin, action, toAddress, amount, expectedAmount } = requestBody;
    
    console.log('Request received:', { tradeId, coin, action, hasToken: !!BITGO_ACCESS_TOKEN });
    
    if (!BITGO_ACCESS_TOKEN) {
      console.error('Missing BITGO_ACCESS_TOKEN');
      throw new Error('BitGo access token not configured');
    }
    
    if (action === 'release') {
      // Release funds from escrow
      const walletMap = { BTC: BTC_WALLET_ID, ETH: ETH_WALLET_ID, XRP: XRP_WALLET_ID, POLYGON: POLYGON_WALLET_ID };
      const coinTypeMap = { BTC: 'btc', ETH: 'eth', XRP: 'xrp', POLYGON: 'polygon' };
      const walletId = walletMap[coin];
      const coinType = coinTypeMap[coin];
      
      const response = await fetch(`${BITGO_BASE_URL}/api/v2/${coinType}/wallet/${walletId}/sendcoins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: toAddress,
          amount: amount.toString()
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Release failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      // Update escrow status
      await supabase
        .from('escrow_addresses')
        .update({ 
          status: 'released',
          tx_hash: data.txid,
          released_at: new Date().toISOString()
        })
        .eq('trade_id', tradeId);
      
      return new Response(JSON.stringify({ txid: data.txid }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    

    

    
    const walletMap = { BTC: BTC_WALLET_ID, ETH: ETH_WALLET_ID, XRP: XRP_WALLET_ID, POLYGON: POLYGON_WALLET_ID };
    const coinTypeMap = { BTC: 'btc', ETH: 'eth', XRP: 'xrp', POLYGON: 'polygon' };
    const walletId = walletMap[coin];
    const coinType = coinTypeMap[coin];
    
    console.log('Wallet config:', { coin, walletId: walletId?.slice(0, 8) + '...', coinType });
    
    if (!walletId) {
      console.error(`Missing wallet ID for ${coin}`);
      throw new Error(`Wallet not configured for ${coin}`);
    }
    
    const response = await fetch(`${BITGO_BASE_URL}/api/v2/${coinType}/wallet/${walletId}/address`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        label: `escrow-${tradeId}-${Date.now()}`,
        ...(coinType === 'btc' ? { chain: 0 } : {})
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('BitGo API error:', { status: response.status, error: errorText });
      throw new Error(`Address generation failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Store the real BitGo address in database
    const { error: insertError } = await supabase.from('escrow_addresses').insert({
      trade_id: tradeId,
      coin,
      address: data.address,
      wallet_id: walletId,
      status: 'pending',
      expected_amount: expectedAmount,
      created_at: new Date().toISOString()
    });
    

    
    return new Response(JSON.stringify({ address: data.address }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Edge Function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});