import { supabase } from '@/integrations/supabase/client';

export interface FireblocksEscrowResult {
  success: boolean;
  vault_id?: string;
  deposit_address?: string;
  asset_id?: string;
  balance?: string;
  expected_amount?: string;
  has_received_funds?: boolean;
  transaction_id?: string;
  recipient_address?: string;
  error?: string;
}

export class FireblocksEscrowService {
  private async callFireblocksFunction(action: string, data: any): Promise<FireblocksEscrowResult> {
    try {
      const { data: result, error } = await supabase.functions.invoke('fireblocks-escrow', {
        body: { action, ...data }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Fireblocks service error:', error);
      return { success: false, error: error.message };
    }
  }

  async createEscrowVault(tradeId: string, cryptoType: string): Promise<FireblocksEscrowResult> {
    const assetMapping = {
      'BTC': 'BTC_TEST',
      'ETH': 'ETH_TEST5',
      'USDT': 'ETH_TEST5' // USDT runs on Ethereum testnet
    };

    const assetId = assetMapping[cryptoType] || 'BTC_TEST';
    const res = await this.callFireblocksFunction('create_vault', { tradeId, assetId });
    if (res.success && (res.vault_id || res.deposit_address)) {
      // persist to trade so monitoring won't 500
      await supabase.from('trades')
        .update({ escrow_vault_id: res.vault_id, escrow_address: res.deposit_address })
        .eq('id', tradeId);
    }
    return res;
  }

  async checkEscrowBalance(tradeId: string): Promise<FireblocksEscrowResult> {
    return await this.callFireblocksFunction('check_balance', { tradeId });
  }

  async releaseFunds(tradeId: string, recipientAddress: string): Promise<FireblocksEscrowResult> {
    return await this.callFireblocksFunction('release_funds', { tradeId, recipientAddress });
  }

  async monitorEscrowStatus(tradeId: string, onStatusChange: (status: any) => void): Promise<void> {
    const checkStatus = async () => {
      // ensure vault exists
      const { data: trade } = await supabase
        .from('trades')
        .select('escrow_address, crypto_type')
        .eq('id', tradeId)
        .single();
      if (!trade?.escrow_address) {
        await this.createEscrowVault(tradeId, trade?.crypto_type || 'BTC');
      }

      const result = await this.checkEscrowBalance(tradeId);
      if (result.success) {
        onStatusChange(result);
        
        // If funds received, stop monitoring
        if (result.has_received_funds) {
          return;
        }
      }
      
      // Continue monitoring every 30 seconds
      setTimeout(checkStatus, 30000);
    };

    checkStatus();
  }

  // Asset validation for supported crypto types
  getSupportedAssets(): string[] {
    return ['BTC', 'ETH', 'USDT'];
  }

  isAssetSupported(cryptoType: string): boolean {
    return this.getSupportedAssets().includes(cryptoType);
  }
}