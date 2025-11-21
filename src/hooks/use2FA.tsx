import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TwoFAState {
  isEnabled: boolean;
  loading: boolean;
  secret?: string;
  qrCode?: string;
}

export const use2FA = () => {
  const [state, setState] = useState<TwoFAState>({
    isEnabled: false,
    loading: true
  });
  const { toast } = useToast();

  const checkStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isEnabled = user.user_metadata?.twofa_enabled || false;
      setState(prev => ({ ...prev, isEnabled, loading: false }));
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const generateSecret = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }, []);

  const enable2FA = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already has secret
      let secret = user.user_metadata?.twofa_secret;
      if (!secret) {
        secret = generateSecret();
      }

      const appName = 'TradeHub P2P';
      const userEmail = user.email || 'user@tradehub.com';
      const qrCode = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;

      await supabase.auth.updateUser({
        data: {
          twofa_enabled: true,
          twofa_secret: secret
        }
      });

      setState(prev => ({ 
        ...prev, 
        isEnabled: true, 
        secret, 
        qrCode 
      }));

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication is now active",
      });

      return { secret, qrCode };
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to enable 2FA",
        variant: "destructive"
      });
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [generateSecret, toast]);

  const disable2FA = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await supabase.auth.updateUser({
        data: {
          twofa_enabled: false
          // Keep twofa_secret for re-enabling
        }
      });

      setState(prev => ({ 
        ...prev, 
        isEnabled: false,
        qrCode: undefined
      }));

      toast({
        title: "2FA Disabled",
        description: "Your authenticator setup is preserved for future use",
      });

      return true;
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable 2FA",
        variant: "destructive"
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [toast]);

  const reset2FA = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await supabase.auth.updateUser({
        data: {
          twofa_enabled: false,
          twofa_secret: null
        }
      });

      setState(prev => ({ 
        ...prev, 
        isEnabled: false,
        secret: undefined,
        qrCode: undefined
      }));

      toast({
        title: "2FA Reset",
        description: "All authenticator data has been removed",
      });

      return true;
    } catch (error: any) {
      console.error('Error resetting 2FA:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset 2FA",
        variant: "destructive"
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [toast]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    ...state,
    enable2FA,
    disable2FA,
    reset2FA,
    checkStatus
  };
};