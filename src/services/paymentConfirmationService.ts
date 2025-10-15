import { supabase } from '@/integrations/supabase/client';

export class PaymentConfirmationService {
  
  // Check if payment is confirmed on blockchain
  async checkPaymentStatus(tradeId: string): Promise<{
    isConfirmed: boolean;
    txHash?: string;
    amount?: number;
    confirmations?: number;
  }> {
    try {
      const { data: escrowRecord } = await supabase
        .from('escrow_addresses')
        .select('*')
        .eq('trade_id', tradeId)
        .single();

      if (!escrowRecord) {
        return { isConfirmed: false };
      }

      return {
        isConfirmed: escrowRecord.status === 'confirmed',
        txHash: escrowRecord.tx_hash,
        amount: escrowRecord.received_amount,
        confirmations: escrowRecord.confirmations || 0
      };

    } catch (error) {
      console.error('Error checking payment status:', error);
      return { isConfirmed: false };
    }
  }

  // Subscribe to payment confirmations for a trade
  subscribeToPaymentUpdates(tradeId: string, callback: (status: any) => void) {
    return supabase
      .channel(`payment-${tradeId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'escrow_addresses',
        filter: `trade_id=eq.${tradeId}`
      }, callback)
      .subscribe();
  }
}

export const paymentConfirmationService = new PaymentConfirmationService();