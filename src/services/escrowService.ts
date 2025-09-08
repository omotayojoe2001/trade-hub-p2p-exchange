import { supabase } from '@/integrations/supabase/client';

// Platform crypto wallet addresses (replace with your actual addresses)
const PLATFORM_WALLETS = {
  BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Replace with your BTC wallet
  ETH: '0x742d35Cc6634C0532925a3b8D4C9db96590c4C5d', // Replace with your ETH wallet
  USDT: '0x742d35Cc6634C0532925a3b8D4C9db96590c4C5d', // Replace with your USDT wallet (ERC-20)
};

export interface EscrowTransaction {
  id: string;
  trade_id: string;
  crypto_sender_id: string;
  crypto_receiver_id: string;
  cash_sender_id: string;
  cash_receiver_id: string;
  crypto_type: 'BTC' | 'ETH' | 'USDT';
  crypto_amount: number;
  cash_amount: number;
  platform_wallet_address: string;
  crypto_tx_hash?: string;
  cash_payment_proof?: string;
  status: 'pending_crypto' | 'crypto_received' | 'pending_cash' | 'cash_received' | 'completed' | 'disputed';
  created_at: string;
  updated_at: string;
}

export interface EscrowInstructions {
  crypto_instructions: {
    send_to_address: string;
    amount: number;
    crypto_type: string;
    memo?: string;
  };
  cash_instructions: {
    recipient_name: string;
    account_number: string;
    bank_name: string;
    amount: number;
    reference: string;
  };
}

export const escrowService = {
  // Create escrow for a trade (simplified to work with existing tables)
  async createEscrow(tradeId: string, tradeData: {
    crypto_sender_id: string;
    crypto_receiver_id: string;
    cash_sender_id: string;
    cash_receiver_id: string;
    crypto_type: 'BTC' | 'ETH' | 'USDT';
    crypto_amount: number;
    cash_amount: number;
  }): Promise<any> {
    try {
      const platformWallet = PLATFORM_WALLETS[tradeData.crypto_type];
      
      // Update the trade with escrow information
      const { data: trade, error } = await supabase
        .from('trades')
        .update({
          escrow_address: platformWallet,
          escrow_status: 'escrow_created',
          status: 'pending'
        })
        .eq('id', tradeId)
        .select()
        .single();

      if (error) throw error;
      return trade;
    } catch (error) {
      console.error('Error creating escrow:', error);
      throw error;
    }
  },

  // Get escrow instructions for users
  async getEscrowInstructions(tradeId: string): Promise<EscrowInstructions> {
    try {
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (tradeError) throw tradeError;

      // Get cash receiver's bank details
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('bank_accounts')
        .eq('user_id', trade.seller_id)
        .single();

      if (profileError) throw profileError;

      const bankAccounts = profile.bank_accounts as any[];
      const primaryAccount = bankAccounts?.[0] || {
        account_name: 'User Account',
        account_number: '1234567890',
        bank_name: 'Default Bank'
      };

      return {
        crypto_instructions: {
          send_to_address: trade.escrow_address || PLATFORM_WALLETS[trade.coin_type],
          amount: trade.amount,
          crypto_type: trade.coin_type,
          memo: `Trade-${tradeId.slice(0, 8)}`
        },
        cash_instructions: {
          recipient_name: primaryAccount.account_name,
          account_number: primaryAccount.account_number,
          bank_name: primaryAccount.bank_name,
          amount: trade.naira_amount,
          reference: `TRADE-${tradeId.slice(0, 8).toUpperCase()}`
        }
      };
    } catch (error) {
      console.error('Error getting escrow instructions:', error);
      throw error;
    }
  },

  // Confirm crypto payment received
  async confirmCryptoReceived(tradeId: string, txHash: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          transaction_hash: txHash,
          escrow_status: 'crypto_received',
          status: 'crypto_deposited'
        })
        .eq('id', tradeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error confirming crypto received:', error);
      throw error;
    }
  },

  // Confirm cash payment received
  async confirmCashReceived(tradeId: string, paymentProof?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          payment_proof_url: paymentProof,
          escrow_status: 'cash_received',
          status: 'payment_sent'
        })
        .eq('id', tradeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error confirming cash received:', error);
      throw error;
    }
  },

  // Release crypto to final recipient (admin function)
  async releaseCrypto(tradeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          escrow_status: 'completed',
          status: 'completed'
        })
        .eq('id', tradeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error releasing crypto:', error);
      throw error;
    }
  },

  // Get escrow status
  async getEscrowStatus(tradeId: string): Promise<any | null> {
    try {
      const { data: trade, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (error) return null;
      return trade;
    } catch (error) {
      console.error('Error getting escrow status:', error);
      return null;
    }
  },

  // Subscribe to escrow updates
  subscribeToEscrowUpdates(tradeId: string, callback: (trade: any) => void) {
    const channel = supabase
      .channel(`trade-${tradeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trades',
        filter: `id=eq.${tradeId}`
      }, async (payload) => {
        if (payload.new) {
          callback(payload.new);
        }
      })
      .subscribe();

    return channel;
  }
};