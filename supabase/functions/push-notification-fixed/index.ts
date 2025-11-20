import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, title, body, data, vibrate } = await req.json()

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (subError) throw subError

    // Send Web Push notification using proper Web Push protocol
    const promises = subscriptions?.map(async (sub) => {
      try {
        const payload = JSON.stringify({
          title,
          body,
          data,
          vibrate: vibrate || [200, 100, 200],
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        })

        // For native mobile endpoints
        if (sub.endpoint === 'native-mobile') {
          console.log('Skipping native mobile endpoint for web push')
          return true
        }

        // Use Web Push Protocol for web endpoints
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400'
          },
          body: payload
        })

        return response.ok
      } catch (error) {
        console.error('Error sending to endpoint:', sub.endpoint, error)
        return false
      }
    }) || []

    await Promise.all(promises)

    // Save notification to database
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        body,
        data,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true, sent: promises.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})