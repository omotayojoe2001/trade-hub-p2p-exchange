import { supabase } from '@/integrations/supabase/client';

interface EscrowAddress {
  address: string;
  walletId: string;
  coin: string;
  tradeId: string;
}

class BitGoEscrowService {
  async generateEscrowAddress(tradeId: string, coin: 'BTC' | 'ETH' | 'USDT' | 'XRP' | 'BNB' | 'POLYGON', expectedAmount?: number): Promise<string> {
    console.log(`🔄 Generating real ${coin} address via Supabase edge function...`);
    
    const { data, error } = await supabase.functions.invoke('bitgo-escrow', {
      body: { tradeId, coin }
    });
    
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    
    // Store in database
    await supabase.from('escrow_addresses').insert({
      trade_id: tradeId,
      coin_type: coin,
      address: data.address,
      status: 'pending',
      expected_amount: expectedAmount
    });
    
    console.log(`✅ Real ${coin} address generated`);
    return data.address;
  }


  async releaseFunds(tradeId: string, merchantAddress: string, amount: number, coin: 'BTC' | 'ETH' | 'USDT' | 'XRP' | 'BNB' | 'POLYGON'): Promise<string> {
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