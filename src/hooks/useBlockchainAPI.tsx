import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
}

interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  amount: number;
}

export const useBlockchainAPI = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Free CoinGecko API for crypto prices
  const getCryptoPrices = async (coins: string[]): Promise<CryptoPrice[]> => {
    setLoading(true);
    try {
      const coinIds = coins.join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();
      
      return Object.entries(data).map(([coin, info]: [string, any]) => ({
        symbol: coin,
        price: info.usd,
        change24h: info.usd_24h_change || 0,
      }));
    } catch (error) {
      toast({
        title: "Price Fetch Error",
        description: "Could not fetch crypto prices",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Free BlockCypher API for transaction verification (limited)
  const verifyTransaction = async (txHash: string, network: 'btc' | 'eth'): Promise<TransactionStatus | null> => {
    setLoading(true);
    try {
      let url = '';
      if (network === 'btc') {
        url = `https://api.blockcypher.com/v1/btc/main/txs/${txHash}`;
      } else {
        url = `https://api.blockcypher.com/v1/eth/main/txs/${txHash}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        hash: txHash,
        status: data.confirmations > 0 ? 'confirmed' : 'pending',
        confirmations: data.confirmations || 0,
        amount: data.total || 0,
      };
    } catch (error) {
      toast({
        title: "Transaction Verification Failed",
        description: "Could not verify transaction",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getCryptoPrices,
    verifyTransaction,
  };
};