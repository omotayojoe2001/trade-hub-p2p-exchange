import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency = 'usd', description = 'Payment' } = await req.json();
    
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const stripe = new Stripe('sk_test_51Rmg7V2NGEmW14IkHlLp4i5UUcDxo9YwlXTrExwDXx6J2Zfez9xf2vmv0iOha5B7LdEi3ARB5qwrai01nFmBmEyI00ELB5dEji', {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin') || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || 'http://localhost:3000'}/payment-cancelled`,
    });

    console.log('Stripe session created:', session.id);
    
    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        message: 'Checkout session created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Stripe error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: 'Failed to create checkout session'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});