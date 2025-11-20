import { supabase } from '@/integrations/supabase/client';

interface EscrowAddress {
  address: string;
  walletId: string;
  coin: string;
  tradeId: string;
}

class BitGoEscrowService {
  async generateEscrowAddress(tradeId: string, coin: 'BTC' | 'ETH' | 'USDT' | 'XRP' | 'BNB' | 'POLYGON', expectedAmount?: number): Promise<string> {
    console.log(`🔄 Generating real ${coin} address via BitGo direct...`);
    
    const walletId = '68dd6fe94425f8b958244dcf157a6635';
    
    const response = await fetch(`http://13.53.167.64:3000/api/forward/api/v2/btc/wallet/${walletId}/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer v2x9eba10d23cb16b271fd072394d76a4021ae88719dba92ab5a383f389715492d0'
      },
      body: JSON.stringify({
        label: `escrow-${tradeId}-${Date.now()}`
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BitGo failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Store in database
    await supabase.from('escrow_addresses').insert({
      trade_id: tradeId,
      coin_type: coin,
      address: data.address,
      status: 'pending',
      expected_amount: expectedAmount
    });
    
    console.log(`✅ Real ${coin} address generated via BitGo`);
    return data.address;
  }


  async releaseFunds(tradeId: string, merchantAddress: string, amount: number, coin: 'BTC' | 'ETH' | 'USDT' | 'XRP' | 'BNB' | 'POLYGON'): Promise<string> {
    const walletId = '68dd6fe94425f8b958244dcf157a6635';
    
    const response = await fetch(`http://13.53.167.64:3000/api/forward/api/v2/btc/wallet/${walletId}/sendcoins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer v2x9eba10d23cb16b271fd072394d76a4021ae88719dba92ab5a383f389715492d0'
      },
      body: JSON.stringify({
        address: merchantAddress,
        amount: amount.toString()
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Release failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Update escrow status
    await supabase.from('escrow_addresses')
      .update({ 
        status: 'released',
        release_txid: data.txid,
        released_at: new Date().toISOString()
      })
      .eq('trade_id', tradeId);
    
    return data.txid;
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