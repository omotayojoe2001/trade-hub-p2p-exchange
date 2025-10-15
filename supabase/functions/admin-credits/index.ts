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
    const { action, userId, credits, reason, adminId } = await req.json();

    // Verify admin permissions
    const { data: admin } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .single();

    if (!admin || admin.role !== 'admin') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized - Admin access required' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    switch (action) {
      case 'add_credits': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits_balance, display_name, email')
          .eq('user_id', userId)
          .single();

        if (!profile) {
          throw new Error('User not found');
        }

        const newBalance = Math.max(0, (profile.credits_balance || 0) + credits); // Prevent negative balance

        await supabase
          .from('profiles')
          .update({ credits_balance: newBalance })
          .eq('user_id', userId);

        // Audit logging disabled for now

        return new Response(JSON.stringify({
          success: true,
          message: `Credits updated for ${profile.display_name || profile.email}. New balance: ${newBalance}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'bulk_add_credits': {
        const { data: users } = await supabase
          .from('profiles')
          .select('user_id, credits_balance, display_name, email')
          .neq('role', 'admin');

        if (!users || users.length === 0) {
          throw new Error('No users found');
        }

        for (const user of users) {
          const newBalance = Math.max(0, (user.credits_balance || 0) + credits); // Prevent negative balance
          
          await supabase
            .from('profiles')
            .update({ credits_balance: newBalance })
            .eq('user_id', user.user_id);

          // Audit logging disabled for now
        }

        return new Response(JSON.stringify({
          success: true,
          message: `Credits updated for ${users.length} users. ${credits} credits ${credits >= 0 ? 'added' : 'deducted'} per user.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_user_credits': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits_balance, display_name, email')
          .eq('user_id', userId)
          .single();

        if (!profile) {
          throw new Error('User not found');
        }

        return new Response(JSON.stringify({
          success: true,
          credits: profile.credits_balance || 0,
          user: profile.display_name || profile.email
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});