import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { tradeId, coin, expectedAmount } = await req.json()
    
    if (!tradeId || !coin) {
      throw new Error('Missing tradeId or coin')
    }

    // Try AWS proxy first
    let addressResponse
    let isRealAddress = false
    
    try {
      const response = await fetch('http://13.53.167.64:8080/api/forward/api/v2/btc/wallet/68dd6fe94425f8b958244dcf157a6635/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer v2x9eba10d23cb16b271fd072394d76a4021ae88719dba92ab5a383f389715492d0'
        },
        body: JSON.stringify({
          label: `escrow-${tradeId}-${Date.now()}`
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        addressResponse = data.address
        isRealAddress = true
      } else {
        throw new Error('AWS proxy failed')
      }
    } catch (error) {
      // Fallback address
      addressResponse = `bc1q${Math.random().toString(36).substring(2, 15)}${Date.now().toString().slice(-6)}`
      isRealAddress = false
    }
    
    // Store in database
    await supabase.from('escrow_addresses').insert({
      trade_id: tradeId,
      coin,
      address: addressResponse,
      wallet_id: '68dd6fe94425f8b958244dcf157a6635',
      status: isRealAddress ? 'pending' : 'fallback_active',
      expected_amount: expectedAmount,
      created_at: new Date().toISOString()
    })
    
    return new Response(JSON.stringify({ 
      address: addressResponse,
      isReal: isRealAddress
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})