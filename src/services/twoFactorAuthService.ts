import { supabase } from '@/integrations/supabase/client';

interface TwoFactorData {
  user_id: string;
  secret: string;
  backup_codes: string[];
  is_enabled: boolean;
  created_at: string;
  last_used_at?: string;
}

class TwoFactorAuthService {
  // Enable 2FA for user
  async enable2FA(userId: string, secret: string, backupCodes: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if record exists first
      const { data: existing } = await supabase
        .from('user_2fa')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('user_2fa')
          .update({
            secret: secret,
            backup_codes: backupCodes,
            is_enabled: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_2fa')
          .insert({
            user_id: userId,
            secret: secret,
            backup_codes: backupCodes,
            is_enabled: true,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      return { success: false, error: error.message };
    }
  }

  // Disable 2FA for user
  async disable2FA(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_2fa')
        .update({ is_enabled: false })
        .eq('user_id', userId);

      if (error) throw error;

      // Remove from localStorage
      localStorage.removeItem(`2fa_enabled_${userId}`);
      localStorage.removeItem(`2fa_secret_${userId}`);

      return { success: true };
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if 2FA is enabled for user
  async is2FAEnabled(userId: string): Promise<boolean> {
    try {
      console.log('Checking 2FA status for user:', userId);
      // Always check database for accurate status
      const { data, error } = await supabase
        .from('user_2fa')
        .select('is_enabled, secret')
        .eq('user_id', userId)
        .single();

      console.log('2FA query result:', { data, error });

      if (error || !data) {
        console.log('No 2FA data found or error:', error);
        return false;
      }

      console.log('2FA enabled status:', data.is_enabled);
      return data.is_enabled;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }

  // Get 2FA data for user
  async get2FAData(userId: string): Promise<TwoFactorData | null> {
    try {
      const { data, error } = await supabase
        .from('user_2fa')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      console.error('Error getting 2FA data:', error);
      return null;
    }
  }

  // Verify 2FA token using TOTP
  async verify2FAToken(userId: string, token: string): Promise<boolean> {
    try {
      const data = await this.get2FAData(userId);
      if (!data || !data.is_enabled) return false;

      // Import TOTP verification
      const { verifyTOTPCode } = await import('@/services/twoFactorAuth');
      const isValid = verifyTOTPCode(token, data.secret);
      
      if (isValid) {
        // Update last used timestamp
        await supabase
          .from('user_2fa')
          .update({ last_used_at: new Date().toISOString() })
          .eq('user_id', userId);
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      return false;
    }
  }

  // 2FA is ALWAYS required on every login when enabled
  shouldRequire2FA(userId: string): boolean {
    // Always require 2FA if enabled - no session persistence
    return true;
  }

  // Mark 2FA as completed for this session (no-op since we always require it)
  mark2FACompleted(userId: string): void {
    // Update last used timestamp in database
    supabase
      .from('user_2fa')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .then(() => console.log('2FA usage logged'));
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();