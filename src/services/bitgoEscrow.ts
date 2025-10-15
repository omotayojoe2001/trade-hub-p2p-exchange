import { supabase } from '@/integrations/supabase/client';

interface EscrowAddress {
  address: string;
  walletId: string;
  coin: string;
  tradeId: string;
}

class BitGoEscrowService {
  async generateEscrowAddress(tradeId: string, coin: 'BTC' | 'USDT' | 'XRP', expectedAmount?: number): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('bitgo-escrow', {
        body: { tradeId, coin, expectedAmount }
      });
      
      if (error) throw new Error(`Payment system error: ${error.message}`);
      if (data?.error) throw new Error(`Payment error: ${data.error}`);
      if (!data?.address) throw new Error('Payment address generation failed');
      
      return data.address;
      
    } catch (error) {
      throw new Error(`Payment address generation failed: ${error.message}`);
    }
  }

  async releaseFunds(tradeId: string, merchantAddress: string, amount: number, coin: 'BTC' | 'USDT' | 'XRP'): Promise<string> {
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