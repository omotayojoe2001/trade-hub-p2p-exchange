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

        // No sample notifications - users will get real notifications from real interactions

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

// Removed sample data creation hooks - using real data only
