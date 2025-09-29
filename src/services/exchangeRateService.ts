interface ExchangeRateResponse {
  usd: {
    ngn: number;
  };
}

class ExchangeRateService {
  private static instance: ExchangeRateService;
  private cachedRate: number | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  async getCurrentUSDToNGNRate(): Promise<number> {
    const now = Date.now();
    
    // Return cached rate if still valid
    if (this.cachedRate && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedRate;
    }

    try {
      // Primary API - CoinGecko (free tier)
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=ngn');
      
      if (response.ok) {
        const data: ExchangeRateResponse = await response.json();
        const rate = data.usd?.ngn;
        
        if (rate && rate > 0) {
          this.cachedRate = rate;
          this.lastFetch = now;
          return rate;
        }
      }
    } catch (error) {
      console.warn('Primary exchange rate API failed:', error);
    }

    try {
      // Fallback API - ExchangeRate-API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (response.ok) {
        const data = await response.json();
        const rate = data.rates?.NGN;
        
        if (rate && rate > 0) {
          this.cachedRate = rate;
          this.lastFetch = now;
          return rate;
        }
      }
    } catch (error) {
      console.warn('Fallback exchange rate API failed:', error);
    }

    // Return cached rate if available, otherwise fallback to static rate
    return this.cachedRate || 1650;
  }

  // Get rate with automatic refresh
  async getUSDToNGNRate(): Promise<number> {
    return this.getCurrentUSDToNGNRate();
  }

  // Clear cache to force refresh
  clearCache(): void {
    this.cachedRate = null;
    this.lastFetch = 0;
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();