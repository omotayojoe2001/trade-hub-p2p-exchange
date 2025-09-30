import { supabase } from '@/integrations/supabase/client';

interface MerchantSearchFilters {
  cryptoType?: string;
  tradeType?: 'buy' | 'sell';
  minAmount?: number;
  maxAmount?: number;
  paymentMethods?: string[];
  location?: string;
  isOnline?: boolean;
  minRating?: number;
}

interface MerchantResult {
  id: string;
  display_name: string;
  avatar_url?: string;
  rating: number;
  total_trades: number;
  is_online: boolean;
  last_seen: string;
  supported_cryptos: string[];
  payment_methods: string[];
  location?: string;
  response_time_minutes: number;
}

class MerchantSearchService {
  async searchMerchants(filters: MerchantSearchFilters = {}): Promise<MerchantResult[]> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          avatar_url,
          rating,
          total_trades,
          is_online,
          last_seen,
          supported_cryptos,
          payment_methods,
          location,
          response_time_minutes
        `)
        .eq('is_merchant', true)
        .eq('is_active', true)
        .neq('role', 'vendor');

      // Filter by online status
      if (filters.isOnline !== undefined) {
        query = query.eq('is_online', filters.isOnline);
      }

      // Filter by minimum rating
      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      // Filter by location
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      // Order by: online status, rating, response time
      query = query.order('is_online', { ascending: false })
                  .order('rating', { ascending: false })
                  .order('response_time_minutes', { ascending: true });

      const { data: merchants, error } = await query;

      if (error) throw error;

      // Filter by crypto type and payment methods in memory for better performance
      let filteredMerchants = merchants || [];

      if (filters.cryptoType) {
        filteredMerchants = filteredMerchants.filter(merchant => 
          merchant.supported_cryptos?.includes(filters.cryptoType!)
        );
      }

      if (filters.paymentMethods?.length) {
        filteredMerchants = filteredMerchants.filter(merchant =>
          filters.paymentMethods!.some(method => 
            merchant.payment_methods?.includes(method)
          )
        );
      }

      return filteredMerchants.map(merchant => ({
        id: merchant.user_id,
        display_name: merchant.display_name || 'Anonymous Merchant',
        avatar_url: merchant.avatar_url,
        rating: merchant.rating || 0,
        total_trades: merchant.total_trades || 0,
        is_online: merchant.is_online || false,
        last_seen: merchant.last_seen || new Date().toISOString(),
        supported_cryptos: merchant.supported_cryptos || [],
        payment_methods: merchant.payment_methods || [],
        location: merchant.location,
        response_time_minutes: merchant.response_time_minutes || 60
      }));

    } catch (error) {
      console.error('Error searching merchants:', error);
      return [];
    }
  }

  async getOnlineMerchants(cryptoType?: string): Promise<MerchantResult[]> {
    return this.searchMerchants({
      isOnline: true,
      cryptoType,
      minRating: 3.0
    });
  }

  async updateMerchantOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating merchant status:', error);
    }
  }
}

export const merchantSearchService = new MerchantSearchService();