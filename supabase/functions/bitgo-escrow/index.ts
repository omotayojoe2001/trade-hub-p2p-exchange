import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tradeId, coin } = await req.json();
    
    const response = await fetch(`http://13.53.167.64:8080/api/forward/api/v2/btc/wallet/68dd6fe94425f8b958244dcf157a6635/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer v2x9eba10d23cb16b271fd072394d76a4021ae88719dba92ab5a383f389715492d0'
      },
      body: JSON.stringify({
        label: `escrow-${tradeId}-${Date.now()}`
      })
    });
    
    if (!response.ok) {
      throw new Error(`AWS Proxy failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify({ 
      address: data.address,
      isReal: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});