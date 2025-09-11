import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('FIREBLOCKS_API_KEY') ?? ''
    const privateKey = Deno.env.get('FIREBLOCKS_PRIVATE_KEY') ?? ''
    
    console.log('Testing Fireblocks credentials...')
    
    // Test basic API call to get vault accounts
    const timestamp = Date.now().toString()
    const nonce = crypto.randomUUID()
    const endpoint = '/vault/accounts'
    const method = 'GET'
    const message = `${timestamp}${nonce}${method}${endpoint}`
    
    // Process private key
    let privateKeyPem = privateKey
    if (!privateKeyPem.includes('-----BEGIN')) {
      privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyPem}\n-----END PRIVATE KEY-----`
    }
    
    const keyData = privateKeyPem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '')
      .replace(/\n/g, '')
    
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const messageBuffer = new TextEncoder().encode(message)
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, messageBuffer)
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    
    const response = await fetch(`https://sandbox-api.fireblocks.io/v1${endpoint}`, {
      method,
      headers: {
        'X-API-Key': apiKey,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Signature': signatureBase64,
        'Content-Type': 'application/json',
      }
    })

    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      hasApiKey: !!apiKey,
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey.length
    }

    if (response.ok) {
      const data = await response.json()
      result.vaultCount = data.length
    } else {
      const errorText = await response.text()
      result.error = errorText
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        hasApiKey: !!Deno.env.get('FIREBLOCKS_API_KEY'),
        hasPrivateKey: !!Deno.env.get('FIREBLOCKS_PRIVATE_KEY')
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})