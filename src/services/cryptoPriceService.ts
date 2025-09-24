// Real-time cryptocurrency price service
import { CREDIT_VALUE_USD } from './creditsService';

interface CryptoPrices {
  BTC: number;
  ETH: number;
  lastUpdated: number;
}

class CryptoPriceService {
  private prices: CryptoPrices = {
    BTC: 100000, // Fallback price
    ETH: 3500,   // Fallback price
    lastUpdated: 0
  };

  private readonly CACHE_DURATION = 60000; // 1 minute cache
  private readonly API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd';

  async getCurrentPrices(): Promise<CryptoPrices> {
    const now = Date.now();
    
    // Return cached prices if still valid
    if (now - this.prices.lastUpdated < this.CACHE_DURATION) {
      return this.prices;
    }

    try {
      console.log('Fetching real-time crypto prices...');
      
      const response = await fetch(this.API_URL);
      if (!response.ok) {
        throw new Error(`Price API error: ${response.status}`);
      }

      const data = await response.json();
      
      this.prices = {
        BTC: data.bitcoin?.usd || this.prices.BTC,
        ETH: data.ethereum?.usd || this.prices.ETH,
        lastUpdated: now
      };

      console.log('Updated crypto prices:', this.prices);
      return this.prices;
      
    } catch (error) {
      console.error('Failed to fetch crypto prices, using cached/fallback:', error);
      return this.prices;
    }
  }

  async calculateCryptoAmount(credits: number, cryptoType: 'BTC' | 'ETH'): Promise<number> {
    const prices = await this.getCurrentPrices();
    const usdValue = credits * CREDIT_VALUE_USD;
    
    switch (cryptoType) {
      case 'BTC':
        return usdValue / prices.BTC;
      case 'ETH':
        return usdValue / prices.ETH;
      default:
        return 0;
    }
  }

  async calculateCreditValue(credits: number) {
    const prices = await this.getCurrentPrices();
    const usd = credits * CREDIT_VALUE_USD;
    
    return {
      credits,
      usd,
      btc: usd / prices.BTC,
      eth: usd / prices.ETH,
      prices: {
        btc: prices.BTC,
        eth: prices.ETH
      }
    };
  }

  // Get current price for display
  async getPrice(crypto: 'BTC' | 'ETH'): Promise<number> {
    const prices = await this.getCurrentPrices();
    return prices[crypto];
  }
}

export const cryptoPriceService = new CryptoPriceService();