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

        // Profile creation is now handled by the database trigger
        // The handle_new_user function creates both profiles and user_profiles entries automatically

        // Welcome notification is now handled by database trigger
        // No need to create it manually here

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
