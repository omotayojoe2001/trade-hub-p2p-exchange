// Real-time cryptocurrency price service
import { CREDIT_VALUE_USD } from './creditsService';

interface CryptoPrices {
  BTC: number;
  USDT: number;
  lastUpdated: number;
}

interface ExchangeRates {
  usdToNgn: number;
  lastUpdated: number;
}

class CryptoPriceService {
  private prices: CryptoPrices = {
    BTC: 0, // No fallback - force API fetch
    USDT: 0, // No fallback - force API fetch
    lastUpdated: 0
  };

  private readonly CACHE_DURATION = 60000; // 1 minute cache
  private readonly API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd';
  private readonly EXCHANGE_API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
  private readonly EXCHANGE_API_URL = `https://v6.exchangerate-api.com/v6/${this.EXCHANGE_API_KEY}/latest/USD`;
  
  private exchangeRates: ExchangeRates = {
    usdToNgn: 0, // No fallback - force API fetch
    lastUpdated: 0
  };

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
        USDT: data.tether?.usd || this.prices.USDT,
        lastUpdated: now
      };

      console.log('Updated crypto prices:', this.prices);
      return this.prices;
      
    } catch (error) {
      console.error('Failed to fetch crypto prices, using cached/fallback:', error);
      return this.prices;
    }
  }

  async getUsdToNgnRate(): Promise<number> {
    const now = Date.now();
    
    // Return cached rate if still valid
    if (now - this.exchangeRates.lastUpdated < this.CACHE_DURATION && this.exchangeRates.usdToNgn > 0) {
      console.log('Using cached USD to NGN rate:', this.exchangeRates.usdToNgn);
      return this.exchangeRates.usdToNgn;
    }

    try {
      console.log('Fetching USD to NGN exchange rate from:', this.EXCHANGE_API_URL);
      
      const response = await fetch(this.EXCHANGE_API_URL);
      console.log('Exchange API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Exchange API response data:', data);
      
      console.log('Available currencies:', Object.keys(data.rates || {}));
      
      if (!data.rates?.NGN) {
        console.error('NGN rate not found. Trying alternative API...');
        
        // Try alternative free API
        const altResponse = await fetch('https://api.fxratesapi.com/latest?base=USD&symbols=NGN');
        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log('Alternative API response:', altData);
          
          if (altData.rates?.NGN) {
            this.exchangeRates = {
              usdToNgn: altData.rates.NGN,
              lastUpdated: now
            };
            console.log('Successfully got NGN rate from alternative API:', altData.rates.NGN);
            return altData.rates.NGN;
          }
        }
        
        throw new Error('NGN rate not found in any API response');
      }
      
      this.exchangeRates = {
        usdToNgn: data.rates.NGN,
        lastUpdated: now
      };

      console.log('Successfully updated USD to NGN rate:', this.exchangeRates.usdToNgn);
      return this.exchangeRates.usdToNgn;
      
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      
      // Try one more free API as final fallback
      try {
        console.log('Trying final fallback API...');
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          if (data.rates?.NGN) {
            console.log('Got rate from final fallback:', data.rates.NGN);
            return data.rates.NGN;
          }
        }
      } catch (fallbackError) {
        console.error('Final fallback also failed:', fallbackError);
      }
      
      // Use current market rate as last resort
      const fallbackRate = 1650;
      console.log('Using hardcoded fallback rate:', fallbackRate);
      return fallbackRate;
    }
  }

  async calculateCryptoAmount(credits: number, cryptoType: 'BTC' | 'USDT'): Promise<number> {
    const prices = await this.getCurrentPrices();
    const usdValue = credits * CREDIT_VALUE_USD;
    
    switch (cryptoType) {
      case 'BTC':
        return usdValue / prices.BTC;
      case 'USDT':
        return usdValue / prices.USDT;
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
      usdt: usd / prices.USDT,
      prices: {
        btc: prices.BTC,
        usdt: prices.USDT
      }
    };
  }

  // Get current price for display
  async getPrice(crypto: 'BTC' | 'USDT'): Promise<number> {
    const prices = await this.getCurrentPrices();
    return prices[crypto];
  }

  async getPriceInNgn(crypto: 'BTC' | 'USDT'): Promise<number> {
    const [usdPrice, ngnRate] = await Promise.all([
      this.getPrice(crypto),
      this.getUsdToNgnRate()
    ]);
    return usdPrice * ngnRate;
  }
}

export const cryptoPriceService = new CryptoPriceService();