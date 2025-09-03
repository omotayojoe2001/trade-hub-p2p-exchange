import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUserSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    if (!user) return;

    const setupUserProfile = async () => {
      try {
        setIsSettingUp(true);

        // Check if user profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingProfile) {
          setIsSetupComplete(true);
          setIsSettingUp(false);
          return;
        }

        // Create user profile automatically (FREE by default)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: user.email?.split('@')[0] || 'User',
            user_type: 'customer',
            is_merchant: false,
            profile_completed: true
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }

        // Create welcome notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'success',
            title: 'Welcome to Central Exchange!',
            message: 'Your account is ready. Start trading crypto with confidence. Upgrade to Premium for advanced features!',
            read: false,
            data: {
              welcome: true,
              is_premium: false,
              setup_complete: true
            }
          });

        if (notificationError) {
          console.error('Notification creation error:', notificationError);
        }

        // Create a sample trade request notification
        const { error: tradeNotificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'trade_request',
            title: 'Trade Opportunities Available',
            message: 'Check out active trade requests from verified users in your area.',
            read: false,
            data: { 
              trade_type: 'info',
              priority: 'medium',
              is_premium: true
            }
          });

        if (tradeNotificationError) {
          console.error('Trade notification creation error:', tradeNotificationError);
        }

        setIsSetupComplete(true);
        
        // Show success toast
        toast({
          title: "Account Ready!",
          description: "Your free account has been set up successfully.",
        });

      } catch (error) {
        console.error('User setup failed:', error);
        toast({
          title: "Setup Error",
          description: "There was an issue setting up your account. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setIsSettingUp(false);
      }
    };

    setupUserProfile();
  }, [user, toast]);

  return {
    isSetupComplete,
    isSettingUp
  };
};

// Hook to create sample trade requests for testing
export const useCreateSampleData = () => {
  const { user } = useAuth();

  const createSampleTradeRequest = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('trade_requests')
        .insert({
          user_id: user.id,
          trade_type: 'sell',
          coin_type: 'BTC',
          amount: 0.01,
          naira_amount: 1500000,
          rate: 150000000,
          payment_method: 'bank_transfer',
          status: 'open',
          expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sample trade request:', error);
      return null;
    }
  };

  const createSampleTrackingCode = async () => {
    if (!user) return null;

    try {
      const trackingCode = `TD-${new Date().getFullYear()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
      
      const { data, error } = await supabase
        .from('tracking_codes')
        .insert({
          user_id: user.id,
          tracking_code: trackingCode,
          status: 'active',
          metadata: {
            delivery_type: 'cash_delivery',
            amount: 750000,
            currency: 'NGN',
            crypto_type: 'BTC',
            crypto_amount: 0.005,
            agent_name: 'Michael Johnson',
            agent_phone: '+234 801 234 5678',
            current_location: 'Processing',
            timeline: [
              { step: 'Order Received', time: new Date().toISOString(), completed: true },
              { step: 'Agent Assigned', time: new Date().toISOString(), completed: true },
              { step: 'Cash Prepared', time: null, completed: false },
              { step: 'Out for Delivery', time: null, completed: false },
              { step: 'Delivered', time: null, completed: false }
            ]
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sample tracking code:', error);
      return null;
    }
  };

  return {
    createSampleTradeRequest,
    createSampleTrackingCode
  };
};
