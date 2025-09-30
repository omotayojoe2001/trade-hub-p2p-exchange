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
      const { error } = await supabase
        .from('user_2fa')
        .upsert({
          user_id: userId,
          secret: secret,
          backup_codes: backupCodes,
          is_enabled: true,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Also store in localStorage for quick access
      localStorage.setItem(`2fa_enabled_${userId}`, 'true');
      localStorage.setItem(`2fa_secret_${userId}`, secret);

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
      // First check localStorage for quick access
      const localEnabled = localStorage.getItem(`2fa_enabled_${userId}`) === 'true';
      if (localEnabled) return true;

      // Check database
      const { data, error } = await supabase
        .from('user_2fa')
        .select('is_enabled')
        .eq('user_id', userId)
        .single();

      if (error || !data) return false;

      // Update localStorage
      if (data.is_enabled) {
        localStorage.setItem(`2fa_enabled_${userId}`, 'true');
      }

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

  // Verify 2FA token
  async verify2FAToken(userId: string, token: string): Promise<boolean> {
    try {
      const data = await this.get2FAData(userId);
      if (!data || !data.is_enabled) return false;

      // Here you would verify the TOTP token against the secret
      // For now, we'll simulate verification
      const isValid = token.length === 6 && /^\d+$/.test(token);
      
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

  // Check if 2FA is required for login (after 24 hours or new device)
  shouldRequire2FA(userId: string): boolean {
    const lastLogin = localStorage.getItem(`last_2fa_login_${userId}`);
    if (!lastLogin) return true;

    const lastLoginTime = new Date(lastLogin);
    const now = new Date();
    const hoursSinceLogin = (now.getTime() - lastLoginTime.getTime()) / (1000 * 60 * 60);

    // Require 2FA after 24 hours
    return hoursSinceLogin >= 24;
  }

  // Mark 2FA as completed for this session
  mark2FACompleted(userId: string): void {
    localStorage.setItem(`last_2fa_login_${userId}`, new Date().toISOString());
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();