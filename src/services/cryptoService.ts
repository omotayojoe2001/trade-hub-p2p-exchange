import { PREMIUM_CONFIG } from '@/constants/premium';

export interface CoinPrice {
  id: string;
  name: string;
  symbol: string;
  price: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
}

class CryptoService {
  async getCryptoPrices(): Promise<Record<string, number>> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd'
      );
      
      if (!response.ok) throw new Error('Failed to fetch prices');
      
      const data = await response.json();
      
      return {
        bitcoin: data.bitcoin?.usd || PREMIUM_CONFIG.CRYPTO_PRICES.bitcoin,
        ethereum: data.ethereum?.usd || PREMIUM_CONFIG.CRYPTO_PRICES.ethereum,
      };
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return PREMIUM_CONFIG.CRYPTO_PRICES;
    }
  }

  async getTrendingCoins(): Promise<CoinPrice[]> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=4&page=1&sparkline=false&price_change_percentage=24h'
      );
      
      if (!response.ok) throw new Error('Failed to fetch trending coins');
      
      const data = await response.json();
      
      return data.map((coin: any) => ({
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: `$${coin.current_price.toLocaleString()}`,
        change: `${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h.toFixed(2)}%`,
        changeType: coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative',
        icon: this.getCoinIcon(coin.symbol.toUpperCase())
      }));
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      return this.getFallbackCoins();
    }
  }

  private getCoinIcon(symbol: string): string {
    const icons: Record<string, string> = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'USDT': '₮',
      'BNB': 'B',
      'ADA': 'A',
      'SOL': 'S'
    };
    return icons[symbol] || symbol.charAt(0);
  }

  private getFallbackCoins(): CoinPrice[] {
    return [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        price: '$97,234.50',
        change: '+2.45%',
        changeType: 'positive',
        icon: '₿'
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        price: '$3,456.78',
        change: '+1.23%',
        changeType: 'positive',
        icon: 'Ξ'
      },
      {
        id: 'tether',
        name: 'USDT',
        symbol: 'USDT',
        price: '$1.00',
        change: '+0.01%',
        changeType: 'positive',
        icon: '₮'
      },
      {
        id: 'bnb',
        name: 'BNB',
        symbol: 'BNB',
        price: '$692.45',
        change: '-0.87%',
        changeType: 'negative' as const,
        icon: 'B'
      }
    ];
  }
}

export const cryptoService = new CryptoService();