// Real-time cryptocurrency price service
import { CREDIT_VALUE_USD } from './creditsService';

interface CryptoPrices {
  BTC: number;
  ETH: number;
  BNB: number;
  USDT: number;
  XRP: number;
  lastUpdated: number;
}

interface ExchangeRates {
  usdToNgn: number;
  lastUpdated: number;
}

class CryptoPriceService {
  private prices: CryptoPrices = {
    BTC: 0, // No fallback - force API fetch
    ETH: 0, // No fallback - force API fetch
    BNB: 0, // No fallback - force API fetch
    USDT: 0, // No fallback - force API fetch
    XRP: 0, // No fallback - force API fetch
    lastUpdated: 0
  };

  private readonly CACHE_DURATION = 60000; // 1 minute cache
  private readonly API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,tether,ripple&vs_currencies=usd';
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
        ETH: data.ethereum?.usd || this.prices.ETH,
        BNB: data.binancecoin?.usd || this.prices.BNB,
        USDT: data.tether?.usd || this.prices.USDT,
        XRP: data.ripple?.usd || this.prices.XRP,
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
      // Return a reasonable fallback temporarily while debugging
      const fallbackRate = 1650;
      console.log('Using fallback rate:', fallbackRate);
      return fallbackRate;
    }
  }

  async calculateCryptoAmount(credits: number, cryptoType: 'BTC' | 'ETH' | 'BNB' | 'USDT' | 'XRP'): Promise<number> {
    const prices = await this.getCurrentPrices();
    const usdValue = credits * CREDIT_VALUE_USD;
    
    switch (cryptoType) {
      case 'BTC':
        return usdValue / prices.BTC;
      case 'ETH':
        return usdValue / prices.ETH;
      case 'BNB':
        return usdValue / prices.BNB;
      case 'USDT':
        return usdValue / prices.USDT;
      case 'XRP':
        return usdValue / prices.XRP;
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
      bnb: usd / prices.BNB,
      usdt: usd / prices.USDT,
      xrp: usd / prices.XRP,
      prices: {
        btc: prices.BTC,
        eth: prices.ETH,
        bnb: prices.BNB,
        usdt: prices.USDT,
        xrp: prices.XRP
      }
    };
  }

  // Get current price for display
  async getPrice(crypto: 'BTC' | 'ETH' | 'BNB' | 'USDT' | 'XRP'): Promise<number> {
    const prices = await this.getCurrentPrices();
    return prices[crypto];
  }

  async getPriceInNgn(crypto: 'BTC' | 'ETH' | 'BNB' | 'USDT' | 'XRP'): Promise<number> {
    const [usdPrice, ngnRate] = await Promise.all([
      this.getPrice(crypto),
      this.getUsdToNgnRate()
    ]);
    return usdPrice * ngnRate;
  }
}

export const cryptoPriceService = new CryptoPriceService();