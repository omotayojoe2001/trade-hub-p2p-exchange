import { supabase } from '@/integrations/supabase/client';

export class EscrowAutomationService {
  
  // Setup BitGo webhooks for automatic monitoring
  static async setupWebhooks() {
    try {
      const webhookUrl = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/bitgo-webhook`;
      
      // Register webhook with BitGo for deposit notifications
      const response = await fetch('http://13.53.167.64:3000/api/forward/api/v2/btc/wallet/68dd6fe94425f8b958244dcf157a6635/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer v2x9eba10d23cb16b271fd072394d76a4021ae88719dba92ab5a383f389715492d0'
        },
        body: JSON.stringify({
          type: 'transfer',
          url: webhookUrl,
          numConfirmations: 1 // Trigger after 1 blockchain confirmation
        })
      });

      if (response.ok) {
        console.log('✅ BitGo webhooks configured');
        return true;
      }
    } catch (error) {
      console.error('❌ Webhook setup failed:', error);
      return false;
    }
  }

  // Smart contract-like logic for automatic release
  static async checkReleaseConditions(tradeId: string) {
    try {
      const { data: trade } = await supabase
        .from('trades')
        .select(`
          *,
          escrow_addresses (*)
        `)
        .eq('id', tradeId)
        .single();

      if (!trade) return false;

      // CONDITIONS FOR AUTOMATIC RELEASE:
      const conditions = {
        cryptoDeposited: trade.escrow_addresses?.status === 'funded',
        paymentProofUploaded: !!trade.payment_proof_url,
        buyerConfirmedPayment: trade.status === 'payment_sent',
        timeoutNotReached: this.isWithinTimeLimit(trade.created_at),
        noDisputes: !trade.disputed
      };

      console.log('Release conditions:', conditions);

      // ALL CONDITIONS MUST BE TRUE
      const canAutoRelease = Object.values(conditions).every(Boolean);

      if (canAutoRelease) {
        console.log(`🚀 Auto-releasing funds for trade ${tradeId}`);
        return await this.executeAutoRelease(tradeId);
      }

      return false;
    } catch (error) {
      console.error('Error checking release conditions:', error);
      return false;
    }
  }

  private static async executeAutoRelease(tradeId: string) {
    try {
      // Get trade details
      const { data: trade } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (!trade) throw new Error('Trade not found');

      // Call BitGo release function
      const { data, error } = await supabase.functions.invoke('bitgo-escrow', {
        body: {
          action: 'release',
          tradeId: tradeId,
          coin: trade.coin_type,
          toAddress: trade.buyer_wallet_address,
          amount: trade.amount_crypto
        }
      });

      if (error) throw error;

      // Update trade status
      await supabase
        .from('trades')
        .update({
          status: 'completed',
          escrow_status: 'auto_released',
          transaction_hash: data.txid,
          completed_at: new Date().toISOString(),
          auto_released: true
        })
        .eq('id', tradeId);

      console.log(`✅ Trade ${tradeId} auto-completed`);
      return true;

    } catch (error) {
      console.error('Auto-release failed:', error);
      return false;
    }
  }

  private static isWithinTimeLimit(createdAt: string): boolean {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24; // 24-hour timeout
  }

  // Monitor trades and trigger auto-release
  static async monitorTrades() {
    try {
      const { data: pendingTrades } = await supabase
        .from('trades')
        .select('id')
        .in('status', ['payment_sent', 'payment_confirmed'])
        .eq('escrow_status', 'crypto_deposited');

      for (const trade of pendingTrades || []) {
        await this.checkReleaseConditions(trade.id);
      }
    } catch (error) {
      console.error('Trade monitoring error:', error);
    }
  }
}

// Initialize webhooks when service loads
EscrowAutomationService.setupWebhooks();