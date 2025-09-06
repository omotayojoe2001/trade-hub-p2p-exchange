import { supabase } from '@/integrations/supabase/client';
import { FireblocksEscrowService } from './fireblocksEscrowService';

export interface EscrowTradeFlow {
  tradeId: string;
  buyerId: string;
  sellerId: string;
  cryptoType: string;
  amount: number;
  escrowAddress?: string;
  status: 'pending' | 'escrow_created' | 'crypto_deposited' | 'payment_sent' | 'completed' | 'disputed';
  merchantBankDetails?: {
    account_number: string;
    bank_name: string;
    account_name: string;
  };
}

export class EscrowTradeService {
  private fireblocksService = new FireblocksEscrowService();

  // Step 1: Merchant accepts trade request - Create escrow and wait for crypto deposit
  async acceptTradeRequestAndCreateEscrow(tradeRequestId: string, merchantId: string): Promise<EscrowTradeFlow> {
    try {
      // Get trade request details
      const { data: tradeRequest, error: tradeError } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('id', tradeRequestId)
        .single();

      if (tradeError || !tradeRequest) {
        throw new Error('Trade request not found');
      }

      // Create the trade record
      const { data: trade, error: createError } = await supabase
        .from('trades')
        .insert({
          trade_request_id: tradeRequestId,
          buyer_id: tradeRequest.user_id, // User who wants to buy crypto
          seller_id: merchantId, // Merchant who will sell crypto
          coin_type: tradeRequest.crypto_type,
          amount: tradeRequest.amount_crypto,
          amount_crypto: tradeRequest.amount_crypto,
          amount_fiat: tradeRequest.amount_fiat,
          naira_amount: tradeRequest.amount_fiat,
          rate: tradeRequest.rate,
          trade_type: tradeRequest.trade_type,
          payment_method: tradeRequest.payment_method,
          status: 'pending',
          escrow_status: 'pending'
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Create Fireblocks escrow vault
      const escrowResult = await this.fireblocksService.createEscrowVault(
        trade.id,
        tradeRequest.crypto_type
      );

      if (!escrowResult.success) {
        throw new Error(escrowResult.error || 'Failed to create escrow vault');
      }

      // Update trade with escrow details
      await supabase
        .from('trades')
        .update({
          escrow_address: escrowResult.deposit_address,
          escrow_status: 'escrow_created',
          status: 'accepted'
        })
        .eq('id', trade.id);

      // Mark trade request as matched
      await supabase
        .from('trade_requests')
        .update({ status: 'accepted' })
        .eq('id', tradeRequestId);

      // Mark merchant notification as read to remove from their list
      await supabase
        .from('merchant_notifications')
        .update({ is_read: true })
        .eq('trade_request_id', tradeRequestId)
        .eq('merchant_id', merchantId);

      // Notify buyer that trade was accepted
      await supabase
        .from('notifications')
        .insert({
          user_id: tradeRequest.user_id,
          type: 'trade_accepted',
          title: 'Trade Request Accepted!',
          message: `Your trade request for ${tradeRequest.amount_crypto} ${tradeRequest.crypto_type} has been accepted. Please wait for the merchant to deposit crypto into escrow.`,
          data: {
            trade_id: trade.id,
            escrow_address: escrowResult.deposit_address,
            action: 'view_trade'
          }
        });

      // Notify merchant with escrow details
      await supabase
        .from('notifications')
        .insert({
          user_id: merchantId,
          type: 'escrow_created',
          title: 'Escrow Created - Deposit Crypto',
          message: `Please deposit ${tradeRequest.amount_crypto} ${tradeRequest.crypto_type} to the escrow address to proceed with the trade.`,
          data: {
            trade_id: trade.id,
            escrow_address: escrowResult.deposit_address,
            amount: tradeRequest.amount_crypto,
            crypto_type: tradeRequest.crypto_type,
            action: 'deposit_crypto'
          }
        });

      return {
        tradeId: trade.id,
        buyerId: tradeRequest.user_id,
        sellerId: merchantId,
        cryptoType: tradeRequest.crypto_type,
        amount: tradeRequest.amount_crypto,
        escrowAddress: escrowResult.deposit_address,
        status: 'escrow_created'
      };

    } catch (error) {
      console.error('Error in acceptTradeRequestAndCreateEscrow:', error);
      throw error;
    }
  }

  // Step 2: Check if merchant has deposited crypto to escrow
  async checkCryptoDeposit(tradeId: string): Promise<{ deposited: boolean; merchantBankDetails?: any }> {
    try {
      // Check escrow balance via Fireblocks
      const balanceResult = await this.fireblocksService.checkEscrowBalance(tradeId);
      
      if (balanceResult.success && balanceResult.has_received_funds) {
        // Update trade status to crypto deposited
        await supabase
          .from('trades')
          .update({
            escrow_status: 'crypto_deposited',
            status: 'crypto_deposited'
          })
          .eq('id', tradeId);

        // Get trade details
        const { data: trade, error } = await supabase
          .from('trades')
          .select(`
            *,
            seller:profiles!seller_id(user_id, display_name)
          `)
          .eq('id', tradeId)
          .single();

        if (error || !trade) {
          throw new Error('Trade not found');
        }

        // Get merchant's bank account separately
        const { data: merchantPayments } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', trade.seller_id);

        const merchantBank = merchantPayments?.find((pm: any) => pm.is_default) || merchantPayments?.[0];

        const bankDetails = {
          account_number: merchantBank?.account_number || 'N/A',
          bank_name: merchantBank?.bank_name || 'N/A',
          account_name: merchantBank?.account_name || (trade.seller as any)?.display_name || 'Merchant',
          amount_naira: trade.amount_fiat,
          trade_reference: `TXN-${tradeId.slice(-8)}`
        };

        // Notify buyer to send payment
        await supabase
          .from('notifications')
          .insert({
            user_id: trade.buyer_id,
            type: 'payment_required',
            title: 'Crypto Deposited - Send Payment',
            message: `The merchant has deposited crypto into escrow. Please send ₦${trade.amount_fiat.toLocaleString()} to complete the trade.`,
            data: {
              trade_id: tradeId,
              bank_details: bankDetails,
              action: 'send_payment'
            }
          });

        return {
          deposited: true,
          merchantBankDetails: bankDetails
        };
      }

      return { deposited: false };
    } catch (error) {
      console.error('Error checking crypto deposit:', error);
      throw error;
    }
  }

  // Step 3: Buyer confirms payment sent
  async confirmPaymentSent(tradeId: string, buyerId: string, paymentProof?: string): Promise<void> {
    try {
      await supabase
        .from('trades')
        .update({
          status: 'payment_sent',
          payment_proof_url: paymentProof
        })
        .eq('id', tradeId)
        .eq('buyer_id', buyerId);

      // Get trade details
      const { data: trade } = await supabase
        .from('trades')
        .select('seller_id, amount_fiat')
        .eq('id', tradeId)
        .single();

      if (trade) {
        // Notify merchant that payment was sent
        await supabase
          .from('notifications')
          .insert({
            user_id: trade.seller_id,
            type: 'payment_received',
            title: 'Payment Confirmation',
            message: `The buyer has confirmed sending ₦${trade.amount_fiat.toLocaleString()}. Please confirm receipt to release crypto.`,
            data: {
              trade_id: tradeId,
              action: 'confirm_payment'
            }
          });
      }
    } catch (error) {
      console.error('Error confirming payment sent:', error);
      throw error;
    }
  }

  // Step 4: Merchant confirms payment received - Release crypto from escrow
  async confirmPaymentReceived(tradeId: string, merchantId: string, cryptoWalletAddress: string): Promise<void> {
    try {
      // Get trade details
      const { data: trade, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .eq('seller_id', merchantId)
        .single();

      if (error || !trade) {
        throw new Error('Trade not found');
      }

      // Release funds from escrow to buyer's wallet
      const releaseResult = await this.fireblocksService.releaseFunds(tradeId, cryptoWalletAddress);

      if (!releaseResult.success) {
        throw new Error(releaseResult.error || 'Failed to release funds from escrow');
      }

      // Update trade as completed
      await supabase
        .from('trades')
        .update({
          status: 'completed',
          escrow_status: 'released',
          completed_at: new Date().toISOString(),
          transaction_hash: releaseResult.transaction_id
        })
        .eq('id', tradeId);

      // Notify both parties
      await Promise.all([
        supabase.from('notifications').insert({
          user_id: trade.buyer_id,
          type: 'trade_completed',
          title: 'Trade Completed!',
          message: `Your crypto has been released from escrow. Transaction: ${releaseResult.transaction_id}`,
          data: {
            trade_id: tradeId,
            transaction_hash: releaseResult.transaction_id,
            action: 'view_receipt'
          }
        }),
        supabase.from('notifications').insert({
          user_id: merchantId,
          type: 'trade_completed',
          title: 'Trade Completed!',
          message: `Trade completed successfully. Crypto has been released to the buyer.`,
          data: {
            trade_id: tradeId,
            transaction_hash: releaseResult.transaction_id,
            action: 'view_receipt'
          }
        })
      ]);

    } catch (error) {
      console.error('Error confirming payment received:', error);
      throw error;
    }
  }

  // Monitor escrow status changes
  async monitorEscrowTrade(tradeId: string, onStatusChange: (status: any) => void): Promise<void> {
    // Start monitoring the escrow status
    this.fireblocksService.monitorEscrowStatus(tradeId, async (escrowStatus) => {
      if (escrowStatus.has_received_funds) {
        // Crypto has been deposited, check and update
        await this.checkCryptoDeposit(tradeId);
      }
      onStatusChange(escrowStatus);
    });
  }

  // Get current trade status and details
  async getTradeStatus(tradeId: string): Promise<any> {
    try {
      const { data: trade, error } = await supabase
        .from('trades')
        .select(`
          *,
          buyer:user_profiles!buyer_id(full_name, phone),
          seller:user_profiles!seller_id(full_name, phone)
        `)
        .eq('id', tradeId)
        .single();

      if (error) {
        throw error;
      }

      return trade;
    } catch (error) {
      console.error('Error getting trade status:', error);
      throw error;
    }
  }
}

export const escrowTradeService = new EscrowTradeService();