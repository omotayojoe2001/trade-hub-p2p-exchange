import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BITGO_BASE_URL = 'https://app.bitgo-test.com/api/v2';
const BITGO_ACCESS_TOKEN = Deno.env.get('BITGO_ACCESS_TOKEN');
const BTC_WALLET_ID = Deno.env.get('BITGO_BTC_WALLET_ID');
const ETH_WALLET_ID = Deno.env.get('BITGO_ETH_WALLET_ID');

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
    const { tradeId, coin, action, toAddress, amount } = requestBody;
    
    console.log('BitGo request:', { tradeId, coin, action });
    console.log('Environment check:', {
      hasToken: !!BITGO_ACCESS_TOKEN,
      hasBtcWallet: !!BTC_WALLET_ID,
      hasEthWallet: !!ETH_WALLET_ID,
      tokenValue: BITGO_ACCESS_TOKEN?.slice(0, 10) + '...',
      btcWalletValue: BTC_WALLET_ID,
      ethWalletValue: ETH_WALLET_ID
    });
    
    if (!BITGO_ACCESS_TOKEN) {
      throw new Error('BITGO_ACCESS_TOKEN environment variable not set');
    }
    
    if (!BTC_WALLET_ID || !ETH_WALLET_ID) {
      throw new Error('BitGo wallet IDs not configured');
    }
    
    if (action === 'release') {
      // Release funds
      const walletId = coin === 'BTC' ? BTC_WALLET_ID : ETH_WALLET_ID;
      const coinType = coin === 'BTC' ? 'tbtc' : 'hteth';
      
      const response = await fetch(`${BITGO_BASE_URL}/${coinType}/wallet/${walletId}/sendcoins`, {
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
        throw new Error(`BitGo API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
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
    
    // Generate address (default)
    const walletId = coin === 'BTC' ? BTC_WALLET_ID : ETH_WALLET_ID;
    const coinType = coin === 'BTC' ? 'tbtc' : 'hteth';
    
    const response = await fetch(`${BITGO_BASE_URL}/${coinType}/wallet/${walletId}/address`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ label: `escrow-${tradeId}` })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('BitGo API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url: response.url
      });
      throw new Error(`BitGo API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('BitGo response:', data);
    
    await supabase.from('escrow_addresses').insert({
      trade_id: tradeId,
      coin,
      address: data.address,
      wallet_id: walletId,
      status: 'pending'
    });
    
    return new Response(JSON.stringify({ address: data.address }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});