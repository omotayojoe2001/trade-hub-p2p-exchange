import { supabase } from '@/integrations/supabase/client';

export interface MerchantProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
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
      console.log('Fetching merchants excluding user:', excludeUserId?.slice(0, 8) + '...');
      
      // Simplified query - just get profiles table data
      // Users can trade with each other regardless of merchant status
      let query = supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          avatar_url,
          phone_number,
          is_merchant,
          user_type,
          role,
          created_at
        `)
        .neq('role', 'vendor'); // Exclude vendors from merchant list

      // CRITICAL: Always exclude current user from merchant list
      if (excludeUserId) {
        query = query.neq('user_id', excludeUserId);
      }

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) {
        console.error('Error fetching merchant profiles:', profilesError);
        throw profilesError;
      }

      console.log('Raw profiles data:', profilesData?.length || 0, 'records');

      if (!profilesData || profilesData.length === 0) {
        console.log('No profiles found in database');
        return [];
      }

      // Transform profiles data to merchant format with default values
      const merchants: MerchantProfile[] = profilesData.map(profile => {
        console.log('Profile avatar_url:', profile.avatar_url); // Debug log
        return {
          id: profile.user_id,
          user_id: profile.user_id,
          display_name: profile.display_name || 'Unknown User',
          avatar_url: profile.avatar_url,
          rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
          is_online: Math.random() > 0.3, // 70% chance of being online
          trade_count: Math.floor(Math.random() * 100) + 10, // Random trade count
          total_volume: Math.floor(Math.random() * 1000000) + 100000, // Random volume
          avg_response_time_minutes: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
          payment_methods: ['bank_transfer', 'cash'], // Default payment methods
          created_at: profile.created_at,
          is_premium: profile.user_type === 'premium',
          verification_level: 'basic' // Default verification level
        };
      });

      console.log('Found merchants:', merchants.length);
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
