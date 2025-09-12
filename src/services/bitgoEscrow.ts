import { supabase } from '@/integrations/supabase/client';

const BITGO_BASE_URL = 'https://app.bitgo-test.com/api/v2';
const BITGO_ACCESS_TOKEN = 'v2x9b4dd2eefa8f942b007abd3d45a89efc5bf01cbb2fd822545b90e00eae004e52';

interface EscrowAddress {
  address: string;
  walletId: string;
  coin: string;
  tradeId: string;
}

interface BitGoWallet {
  BTC: string;
  ETH: string;
  USDT: string;
}

// Testnet wallet IDs
const ESCROW_WALLETS: BitGoWallet = {
  BTC: '68c3107e4e3a88eabbaa707336d8245f', // TBTC testnet
  ETH: '68c3152aa55fc893636939a9eaf44484', // HTETH testnet  
  USDT: '68c3152aa55fc893636939a9eaf44484' // Use ETH wallet for USDT tokens
};

class BitGoEscrowService {
  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
    console.log('BitGo API call:', { endpoint, method, token: BITGO_ACCESS_TOKEN.slice(0, 10) + '...' });
    
    const response = await fetch(`${BITGO_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    console.log('BitGo response:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('BitGo API error details:', errorText);
      throw new Error(`BitGo API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async generateEscrowAddress(tradeId: string, coin: 'BTC' | 'ETH' | 'USDT'): Promise<string> {
    try {
      console.log('Calling Edge Function with:', { tradeId, coin });
      
      const { data, error } = await supabase.functions.invoke('bitgo-escrow', {
        body: { tradeId, coin }
      });
      
      console.log('Edge Function response:', { data, error });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data?.address || 'mock-address-fallback';
    } catch (error) {
      console.error('Error generating escrow address:', error);
      throw error;
    }
  }

  async checkDeposit(address: string): Promise<{ confirmed: boolean; amount: number }> {
    try {
      // Get address info to check for deposits
      const response = await this.makeRequest(`/address/${address}`);
      
      return {
        confirmed: response.confirmedBalance > 0,
        amount: response.confirmedBalance
      };
    } catch (error) {
      console.error('Error checking deposit:', error);
      return { confirmed: false, amount: 0 };
    }
  }

  async releaseFunds(tradeId: string, merchantAddress: string, amount: number, coin: 'BTC' | 'ETH' | 'USDT'): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('bitgo-escrow', {
        body: { 
          action: 'release',
          tradeId, 
          coin,
          toAddress: merchantAddress,
          amount
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data?.txid || 'release-pending';
    } catch (error) {
      console.error('Error releasing funds:', error);
      throw error;
    }
  }

  async getEscrowStatus(tradeId: string): Promise<any> {
    const { data } = await supabase
      .from('escrow_addresses')
      .select('*')
      .eq('trade_id', tradeId)
      .single();

    return data;
  }
}

export const bitgoEscrow = new BitGoEscrowService();