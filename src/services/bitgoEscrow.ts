import { supabase } from '@/integrations/supabase/client';

const BITGO_BASE_URL = 'https://app.bitgo-test.com/api/v2';
const BITGO_ACCESS_TOKEN = 'v2x534d125c94f2c8e142c81d56cf28064772b15b51f75772292ef610a860db53b6';

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

// Production mode - using real BitGo API
const MOCK_MODE = false;

// CORS headers for direct API calls
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  async testWalletAccess(coin: 'BTC' | 'ETH'): Promise<void> {
    try {
      // First test if token is valid at all
      console.log('Testing token validity...');
      const userResponse = await this.makeRequest('/user/me');
      console.log('User info:', userResponse);
      
      // Then test wallet access
      const walletId = ESCROW_WALLETS[coin];
      const coinType = coin === 'BTC' ? 'tbtc' : 'hteth';
      
      console.log('Testing wallet access:', { coin, walletId, coinType });
      const walletResponse = await this.makeRequest(`/${coinType}/wallet/${walletId}`);
      console.log('Wallet info:', walletResponse);
      
    } catch (error) {
      console.error('Access test failed:', error);
      throw error;
    }
  }

  async generateEscrowAddress(tradeId: string, coin: 'BTC' | 'ETH' | 'USDT', expectedAmount?: number): Promise<string> {
    try {
      console.log('Calling BitGo Edge Function with:', { tradeId, coin, expectedAmount });
      
      // Use real Supabase Edge Function for BitGo integration
      const { data, error } = await supabase.functions.invoke('bitgo-escrow', {
        body: { tradeId, coin, expectedAmount }
      });
      
      console.log('Edge Function response:', { data, error });
      
      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Edge Function failed: ${error.message}`);
      }
      
      if (data?.error) {
        console.error('BitGo API error from Edge Function:', data.error);
        throw new Error(`BitGo API error: ${data.error}`);
      }
      
      if (!data?.address) {
        console.error('No address returned from BitGo Edge Function');
        throw new Error('No address returned from BitGo');
      }
      
      console.log('Generated real BitGo address:', data.address);
      return data.address;
      
    } catch (error) {
      console.error('Error generating BitGo address:', error);
      throw new Error(`Failed to generate payment address: ${error.message}`);
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