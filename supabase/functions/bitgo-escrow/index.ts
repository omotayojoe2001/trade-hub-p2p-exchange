import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// BitGo Configuration with new token
const BITGO_ACCESS_TOKEN = 'v2x9eba10d23cb16b271fd072394d76a4021ae88719dba92ab5a383f389715492d0';
const AWS_PROXY_URL = 'http://13.53.167.64:8080'; // Your AWS server
const LOCAL_PROXY_URL = 'http://localhost:3001'; // Local fallback proxy
const BTC_WALLET_ID = Deno.env.get('BITGO_BTC_WALLET_ID');
const ETH_WALLET_ID = Deno.env.get('BITGO_ETH_WALLET_ID');
const XRP_WALLET_ID = Deno.env.get('BITGO_XRP_WALLET_ID');
const POLYGON_WALLET_ID = Deno.env.get('BITGO_POLYGON_WALLET_ID');
const USDT_WALLET_ID = Deno.env.get('BITGO_USDT_WALLET_ID');
const BNB_WALLET_ID = Deno.env.get('BITGO_BNB_WALLET_ID');

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
    
    console.log('Request received:', { tradeId, coin, action, proxyUrl: !!AWS_PROXY_URL });
    
    if (!tradeId || !coin) {
      throw new Error('Missing required parameters: tradeId and coin');
    }
    
    const proxyUrl = AWS_PROXY_URL || LOCAL_PROXY_URL;
    console.log('Using AWS proxy:', proxyUrl);
    
    if (action === 'setup_webhook') {
      // Setup BitGo webhook for payment notifications
      const walletMap = { BTC: BTC_WALLET_ID, USDT: USDT_WALLET_ID, XRP: XRP_WALLET_ID, POLYGON: POLYGON_WALLET_ID, BNB: BNB_WALLET_ID };
      const coinTypeMap = { BTC: 'btc', USDT: 'sol', XRP: 'xrp', POLYGON: 'polygon', BNB: 'bsc' };
      const walletId = walletMap[coin];
      const coinType = coinTypeMap[coin];
      
      const webhookUrl = 'https://towffqxmmqyhbuyphkui.supabase.co/functions/v1/bitgo-webhook';
      
      const response = await fetch(`${proxyUrl}/api/forward/api/v2/${coinType}/wallet/${walletId}/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          type: 'transfer',
          url: webhookUrl,
          numConfirmations: 1
        })
      });
      
      const data = await response.json();
      return new Response(JSON.stringify({ webhookId: data.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'release') {
      // Release funds from escrow
      const walletMap = { BTC: BTC_WALLET_ID, USDT: USDT_WALLET_ID, XRP: XRP_WALLET_ID, POLYGON: POLYGON_WALLET_ID, BNB: BNB_WALLET_ID };
      const coinTypeMap = { BTC: 'btc', USDT: 'sol', XRP: 'xrp', POLYGON: 'polygon', BNB: 'bsc' };
      const walletId = walletMap[coin];
      const coinType = coinTypeMap[coin];
      
      const response = await fetch(`${proxyUrl}/api/forward/api/v2/${coinType}/wallet/${walletId}/sendcoins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          address: toAddress,
          amount: amount.toString()
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
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
    
    const walletMap = { BTC: BTC_WALLET_ID, USDT: USDT_WALLET_ID, XRP: XRP_WALLET_ID, POLYGON: POLYGON_WALLET_ID, BNB: BNB_WALLET_ID };
    const coinTypeMap = { BTC: 'btc', USDT: 'sol', XRP: 'xrp', POLYGON: 'polygon', BNB: 'bsc' };
    const walletId = walletMap[coin];
    const coinType = coinTypeMap[coin];
    
    console.log('Wallet config:', { coin, walletId: walletId?.slice(0, 8) + '...', coinType, fullRequest: { tradeId, coin, expectedAmount } });
    
    if (!walletId) {
      console.error(`Missing wallet ID for ${coin}`);
      throw new Error(`Wallet not configured for ${coin}`);
    }
    
    console.log('AWS Proxy URL:', `${proxyUrl}/api/forward/api/v2/${coinType}/wallet/${walletId}/address`);
    
    // Generate address via AWS proxy (single attempt - no IP restrictions)
    let addressResponse;
    let isRealAddress = false;
    
    try {
      console.log(`Attempting ${coin} address generation via AWS proxy...`);
      
      const addressRequestBody = {
        label: `escrow-${tradeId}-${Date.now()}`,
        ...(coinType === 'btc' ? { chain: 0 } : {}),
        ...(coinType === 'sol' && coin === 'USDT' ? { tokenName: 'usdt' } : {})
      };
      
      const response = await fetch(`${proxyUrl}/api/forward/api/v2/${coinType}/wallet/${walletId}/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`
        },
        body: JSON.stringify(addressRequestBody),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        addressResponse = data.address;
        isRealAddress = true;
        console.log(`✅ ${coin} address generated successfully via AWS proxy`);
      } else {
        const errorText = await response.text();
        console.log(`❌ AWS Proxy error ${response.status}:`, errorText);
        throw new Error(`AWS Proxy returned ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️ AWS Proxy failed:`, error.message);
      console.log(`❌ Using fallback address`);
      
      // Generate deterministic fallback address
      const prefix = coin === 'BTC' ? 'bc1q' : coin === 'USDT' ? 'sol:' : 'addr:';
      addressResponse = `${prefix}${Math.random().toString(36).substring(2, 15)}${Date.now().toString().slice(-6)}`;
      isRealAddress = false;
    }
    
    // Store address in database
    const { error: insertError } = await supabase.from('escrow_addresses').insert({
      trade_id: tradeId,
      coin,
      address: addressResponse,
      wallet_id: walletId,
      status: isRealAddress ? 'pending' : 'fallback_active',
      expected_amount: expectedAmount,
      created_at: new Date().toISOString()
    });
    
    if (insertError) {
      console.error('Database insert error:', insertError);
    }
    
    // Setup webhook only for real addresses
    if (isRealAddress) {
      try {
        const webhookUrl = 'https://towffqxmmqyhbuyphkui.supabase.co/functions/v1/bitgo-webhook';
        await fetch(`${proxyUrl}/api/forward/api/v2/${coinType}/wallet/${walletId}/webhooks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            type: 'transfer',
            url: webhookUrl,
            numConfirmations: 1
          })
        });
      } catch (webhookError) {
        console.log('Webhook setup (may already exist):', webhookError.message);
      }
    }
    
    return new Response(JSON.stringify({ 
      address: addressResponse,
      isReal: isRealAddress,
      note: isRealAddress ? 'Real BitGo address' : 'Fallback address - manual verification required'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Edge Function error:', error.message);
    
    // Handle specific error types
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      errorMessage = `AWS Proxy timeout - please try again`;
      statusCode = 504;
    } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
      errorMessage = 'AWS network connectivity issue - please try again';
      statusCode = 503;
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});