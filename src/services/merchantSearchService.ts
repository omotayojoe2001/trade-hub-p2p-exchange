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
  private cache = new Map<string, { data: MerchantResult[], timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private getCacheKey(filters: MerchantSearchFilters): string {
    return JSON.stringify(filters);
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }
  async searchMerchants(filters: MerchantSearchFilters = {}): Promise<MerchantResult[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(filters);
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.data;
    }

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
        .neq('role', 'vendor')
        .limit(50); // Limit results for better performance

      // Filter by online status first (most selective)
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

      // Use database-level filtering for crypto type if possible
      if (filters.cryptoType) {
        query = query.contains('supported_cryptos', [filters.cryptoType]);
      }

      // Order by: online status, rating, response time (use single order for better performance)
      query = query.order('is_online', { ascending: false })
                  .order('rating', { ascending: false });

      const { data: merchants, error } = await query;

      if (error) throw error;

      // Only do in-memory filtering for payment methods if needed
      let filteredMerchants = merchants || [];

      if (filters.paymentMethods?.length) {
        filteredMerchants = filteredMerchants.filter(merchant =>
          filters.paymentMethods!.some(method => 
            merchant.payment_methods?.includes(method)
          )
        );
      }

      const result = filteredMerchants.map(merchant => ({
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

      // Cache the result
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;

    } catch (error) {
      console.error('Error searching merchants:', error);
      return [];
    }
  }

  async getOnlineMerchants(cryptoType?: string): Promise<MerchantResult[]> {
    // Optimized query for online merchants only
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
        .eq('is_online', true)
        .neq('role', 'vendor')
        .gte('rating', 3.0)
        .limit(20); // Smaller limit for faster loading

      if (cryptoType) {
        query = query.contains('supported_cryptos', [cryptoType]);
      }

      query = query.order('rating', { ascending: false });

      const { data: merchants, error } = await query;

      if (error) throw error;

      return (merchants || []).map(merchant => ({
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
      console.error('Error getting online merchants:', error);
      return [];
    }
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
      
      // Clear cache when merchant status changes
      this.clearCache();
    } catch (error) {
      console.error('Error updating merchant status:', error);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number, keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const merchantSearchService = new MerchantSearchService();