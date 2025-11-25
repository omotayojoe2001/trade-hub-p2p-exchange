import { supabase } from '@/integrations/supabase/client';

interface EscrowAddress {
  address: string;
  walletId: string;
  coin: string;
  tradeId: string;
}

class BitGoEscrowService {
  async generateEscrowAddress(tradeId: string, coin: 'BTC' | 'ETH' | 'USDT' | 'XRP' | 'BNB' | 'POLYGON', expectedAmount?: number): Promise<string> {
    console.log(`🔄 [BitGoEscrow] Generating ${coin} address for trade ${tradeId}`);
    
    // BTC & USDT: Use Supabase edge function
    if (coin === 'BTC' || coin === 'USDT') {
      console.log(`🔄 [BitGoEscrow] Calling edge function for ${coin}`);
      
      const { data, error } = await supabase.functions.invoke('bitgo-escrow', {
        body: { tradeId, coin }
      });
      
      if (error) {
        console.error(`❌ [BitGoEscrow] Edge function error for ${coin}:`, error);
        throw error;
      }
      
      if (data?.error) {
        console.error(`❌ [BitGoEscrow] Edge function returned error for ${coin}:`, data.error);
        throw new Error(data.error);
      }
      
      console.log(`✅ [BitGoEscrow] Real ${coin} address generated:`, data.address);
      return data.address;
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
    console.log(`🔄 [BitGoEscrow] Releasing ${amount} ${coin} to ${merchantAddress}`);
    
    if (coin !== 'BTC' && coin !== 'USDT') {
      console.warn(`⚠️ [BitGoEscrow] Only supports BTC and USDT. Simulating release for ${coin}`);
      const mockTxId = `mock-${coin.toLowerCase()}-tx-${Date.now()}`;
      console.log(`✅ [BitGoEscrow] Mock ${coin} release simulated: ${mockTxId}`);
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
    
    if (error) {
      console.error(`❌ [BitGoEscrow] Release error for ${coin}:`, error);
      throw error;
    }
    
    if (data?.error) {
      console.error(`❌ [BitGoEscrow] Release returned error for ${coin}:`, data.error);
      throw new Error(data.error);
    }
    
    console.log(`✅ [BitGoEscrow] ${coin} release successful:`, data?.txid);
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