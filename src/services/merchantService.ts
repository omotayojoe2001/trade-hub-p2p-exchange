import { supabase } from '@/integrations/supabase/client';

export interface MerchantProfile {
  id: string;
  user_id: string;
  display_name: string;
  rating: number;
  is_online: boolean;
  trade_count: number;
  total_volume: number;
  avg_response_time_minutes: number;
  payment_methods: string[];
  created_at: string;
  is_premium: boolean;
  verification_level: string;
}

export interface MerchantToggleResult {
  success: boolean;
  error?: string;
  is_merchant: boolean;
}

export const merchantService = {
  // Get all active merchants (excluding current user)
  async getMerchants(excludeUserId?: string): Promise<MerchantProfile[]> {
    try {
      // Query profiles table for ALL users (not just merchants)
      // Users can trade with each other regardless of merchant status
      let query = supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          phone_number,
          is_merchant,
          user_type,
          created_at
        `);

      // CRITICAL: Always exclude current user from merchant list
      if (excludeUserId) {
        query = query.neq('user_id', excludeUserId);
      }

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) {
        console.error('Error fetching merchant profiles:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        return [];
      }

      // Get additional merchant data from user_profiles table
      const userIds = profilesData.map(p => p.user_id);

      const { data: userProfilesData, error: userProfilesError } = await supabase
        .from('user_profiles')
        .select(`
          user_id,
          full_name,
          rating,
          trade_count,
          total_volume,
          preferred_payment_methods,
          verification_level,
          is_premium
        `)
        .in('user_id', userIds);

      if (userProfilesError) {
        console.error('Error fetching user profiles:', userProfilesError);
        // Continue with just profile data if user_profiles fails
      }

      // Get merchant settings for online status and rates
      const { data: merchantSettingsData, error: settingsError } = await supabase
        .from('merchant_settings')
        .select(`
          user_id,
          is_online,
          accepts_new_trades,
          avg_response_time_minutes,
          payment_methods,
          btc_buy_rate,
          btc_sell_rate,
          usdt_buy_rate,
          usdt_sell_rate
        `)
        .in('user_id', userIds);

      if (settingsError) {
        console.error('Error fetching merchant settings:', settingsError);
        // Continue without settings data
      }

      // Combine the data
      const merchants: MerchantProfile[] = profilesData.map(profile => {
        const userProfile = userProfilesData?.find(up => up.user_id === profile.user_id);
        const merchantSettings = merchantSettingsData?.find(ms => ms.user_id === profile.user_id);

        return {
          id: profile.user_id,
          user_id: profile.user_id,
          display_name: profile.display_name || userProfile?.full_name || 'User',
          rating: userProfile?.rating || 5.0,
          is_online: true, // Show all users as online for trading
          trade_count: userProfile?.trade_count || 0,
          total_volume: userProfile?.total_volume || 0,
          avg_response_time_minutes: merchantSettings?.avg_response_time_minutes || 10,
          payment_methods: merchantSettings?.payment_methods || userProfile?.preferred_payment_methods || ['bank_transfer'],
          created_at: profile.created_at,
          is_premium: userProfile?.is_premium || profile.user_type === 'premium',
          verification_level: userProfile?.verification_level || 'basic'
        };
      });

      // Show all merchants who have merchant mode enabled
      // Don't filter too strictly - let customers see all available merchants
      return merchants;

    } catch (error) {
      console.error('Error in getMerchants:', error);
      throw error;
    }
  },

  // Toggle merchant mode for current user
  async toggleMerchantMode(userId: string, enableMerchant: boolean): Promise<MerchantToggleResult> {
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: enableMerchant ? 'merchant' : 'customer',
          is_merchant: enableMerchant,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return {
          success: false,
          error: profileError.message,
          is_merchant: false
        };
      }

      // If enabling merchant mode, create default merchant settings
      if (enableMerchant) {
        const { error: settingsError } = await supabase
          .from('merchant_settings')
          .upsert({
            user_id: userId,
            merchant_type: 'manual',
            is_online: true,
            accepts_new_trades: true,
            avg_response_time_minutes: 10,
            payment_methods: ['bank_transfer'],
            min_trade_amount: 1000,
            max_trade_amount: 10000000,
            auto_accept_trades: false,
            auto_release_escrow: false
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (settingsError) {
          console.warn('Warning creating merchant settings:', settingsError.message);
          // Don't fail the operation if settings creation fails
        }
      }

      // Also update user_profiles table if it exists
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          // Don't overwrite existing data, just ensure the record exists
        }, { onConflict: 'user_id' });

      if (userProfileError) {
        console.warn('Warning updating user_profiles:', userProfileError.message);
        // Don't fail the operation if user_profiles update fails
      }

      return {
        success: true,
        is_merchant: enableMerchant
      };

    } catch (error) {
      console.error('Error in toggleMerchantMode:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        is_merchant: false
      };
    }
  },

  // Get merchant profile by user ID
  async getMerchantProfile(userId: string): Promise<MerchantProfile | null> {
    try {
      const merchants = await this.getMerchants();
      return merchants.find(m => m.user_id === userId) || null;
    } catch (error) {
      console.error('Error getting merchant profile:', error);
      return null;
    }
  },

  // Subscribe to real-time merchant updates
  subscribeToMerchantUpdates(callback: (merchants: MerchantProfile[]) => void) {
    const channel = supabase
      .channel('merchants-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'is_merchant=eq.true'
      }, async () => {
        // Refresh merchant list when any merchant profile changes
        try {
          const merchants = await this.getMerchants();
          callback(merchants);
        } catch (error) {
          console.error('Error refreshing merchants in subscription:', error);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_profiles'
      }, async () => {
        // Also refresh when user_profiles change
        try {
          const merchants = await this.getMerchants();
          callback(merchants);
        } catch (error) {
          console.error('Error refreshing merchants in user_profiles subscription:', error);
        }
      })
      .subscribe();

    return channel;
  },

  // Check if current user is a merchant
  async isUserMerchant(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_merchant, user_type')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error checking merchant status:', error);
        return false;
      }

      return data?.is_merchant === true && (data?.user_type === 'merchant' || data?.user_type === 'premium');
    } catch (error) {
      console.error('Error in isUserMerchant:', error);
      return false;
    }
  }
};
