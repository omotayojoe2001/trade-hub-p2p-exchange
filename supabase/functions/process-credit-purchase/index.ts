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
    const { purchaseId } = await req.json();
    
    // Get purchase details
    const { data: purchase, error: fetchError } = await supabase
      .from('credit_purchase_transactions')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (fetchError || !purchase) {
      throw new Error('Purchase not found');
    }

    // Get current user credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('user_id', purchase.user_id)
      .single();

    const currentBalance = profile?.credits_balance || 0;
    const newBalance = currentBalance + purchase.credits_amount;

    // Update user credits
    await supabase
      .from('profiles')
      .update({ credits_balance: newBalance })
      .eq('user_id', purchase.user_id);

    // Mark purchase as completed
    await supabase
      .from('credit_purchase_transactions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', purchaseId);

    return new Response(JSON.stringify({ 
      success: true, 
      creditsAdded: purchase.credits_amount,
      newBalance 
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