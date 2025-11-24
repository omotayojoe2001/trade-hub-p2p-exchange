import { supabase } from '@/integrations/supabase/client';

interface EscrowAddress {
  address: string;
  walletId: string;
  coin: string;
  tradeId: string;
}

class BitGoEscrowService {
  async generateEscrowAddress(tradeId: string, coin: 'BTC' | 'ETH' | 'USDT' | 'XRP' | 'BNB' | 'POLYGON', expectedAmount?: number): Promise<string> {
    console.log(`🔄 Generating ${coin} address...`);
    
    // BTC: Use Supabase edge function (unchanged)
    if (coin === 'BTC') {
      const { data, error } = await supabase.functions.invoke('bitgo-escrow', {
        body: { tradeId, coin }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      console.log(`✅ Real ${coin} address generated`);
      return data.address;
    }
    
    // USDT: Direct server call (temporary until edge function deployed)
    if (coin === 'USDT') {
      try {
        const response = await fetch('http://13.53.167.64:3000/api/forward/api/v2/sol/wallet/68f23046ff389c3fefed72157e47503a/address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer v2x9eba10d23cb16b271fd072394d76a4021ae88719dba92ab5a383f389715492d0'
          },
          body: JSON.stringify({
            label: `escrow-usdt-${tradeId}-${Date.now()}`
          })
        });
        
        if (!response.ok) throw new Error(`USDT server call failed: ${response.status}`);
        const data = await response.json();
        console.log('✅ Real USDT address generated via direct server call');
        return data.address;
      } catch (error) {
        console.error('USDT direct server call failed:', error);
        throw error;
      }
    }
    
    // Other coins: Mock addresses
    console.warn(`⚠️ BitGo escrow only supports BTC and USDT. Generating mock address for ${coin}`);
    const mockAddress = this.generateMockAddress(coin);
    console.log(`✅ Mock ${coin} address generated: ${mockAddress}`);
    return mockAddress;
  }

  private generateMockAddress(coin: string): string {
    const mockAddresses = {
      'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'ETH': '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      'XRP': 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      'BNB': 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
      'POLYGON': '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    };
    
    return mockAddresses[coin as keyof typeof mockAddresses] || `mock-${coin.toLowerCase()}-address-${Date.now()}`;
  }

  async releaseFunds(tradeId: string, merchantAddress: string, amount: number, coin: 'BTC' | 'ETH' | 'USDT' | 'XRP' | 'BNB' | 'POLYGON'): Promise<string> {
    if (coin !== 'BTC' && coin !== 'USDT') {
      console.warn(`⚠️ BitGo escrow only supports BTC and USDT. Simulating release for ${coin}`);
      const mockTxId = `mock-${coin.toLowerCase()}-tx-${Date.now()}`;
      console.log(`✅ Mock ${coin} release simulated: ${mockTxId}`);
      return mockTxId;
    }
    
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