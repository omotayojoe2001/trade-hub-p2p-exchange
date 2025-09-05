import { supabase } from '@/integrations/supabase/client';

export interface TradeMatchResult {
  trade_id: string;
  matched_merchant_id?: string;
  vendor_job_id?: string;
  success: boolean;
  message: string;
}

export interface AvailableMerchant {
  user_id: string;
  display_name: string;
  phone_number?: string;
  is_merchant: boolean;
  merchant_mode: boolean;
}

class TradeMatchingService {
  // Get all available merchants for trading
  async getAvailableMerchants(excludeUserId?: string): Promise<AvailableMerchant[]> {
    try {
      let query = supabase
        .from('profiles')
        .select('user_id, display_name, phone_number, is_merchant, merchant_mode')
        .eq('is_merchant', true)
        .eq('merchant_mode', true);

      if (excludeUserId) {
        query = query.neq('user_id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching available merchants:', error);
      return [];
    }
  }

  // Create a premium trade request with automatic merchant matching
  async createPremiumTradeRequest(
    premiumUserId: string,
    amountUsd: number,
    deliveryType: 'pickup' | 'delivery'
  ): Promise<TradeMatchResult> {
    try {
      // Find available merchants
      const merchants = await this.getAvailableMerchants(premiumUserId);
      
      if (merchants.length === 0) {
        return {
          trade_id: '',
          success: false,
          message: 'No available merchants found. Your request has been queued.'
        };
      }

      // Select a random merchant
      const selectedMerchant = merchants[Math.floor(Math.random() * merchants.length)];

      // Create the trade
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .insert({
          seller_id: premiumUserId,
          buyer_id: selectedMerchant.user_id,
          crypto_type: 'USDT',
          amount_crypto: amountUsd,
          amount_fiat: amountUsd * 1650, // Approximate NGN rate
          rate: 1650,
          status: 'pending',
          trade_type: 'sell',
          payment_method: 'cash_delivery',
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Create vendor job if vendor system exists
      let vendorJobId: string | undefined;
      try {
        const { data: vendors } = await supabase
          .from('vendors')
          .select('id')
          .eq('active', true)
          .limit(1);

        if (vendors && vendors.length > 0) {
          const { data: vendorJob, error: jobError } = await supabase
            .from('vendor_jobs')
            .insert({
              vendor_id: vendors[0].id,
              premium_user_id: premiumUserId,
              buyer_id: selectedMerchant.user_id,
              trade_id: trade.id,
              amount_usd: amountUsd,
              delivery_type: deliveryType,
              status: 'pending_payment',
              credits_required: Math.ceil(amountUsd / 10),
              verification_code: this.generateVerificationCode(),
            })
            .select()
            .single();

          if (!jobError) {
            vendorJobId = vendorJob.id;
          }
        }
      } catch (vendorError) {
        console.warn('Vendor job creation failed:', vendorError);
        // Continue without vendor job
      }

      // Notify the matched merchant
      await this.notifyMerchant(selectedMerchant.user_id, trade.id, amountUsd);

      return {
        trade_id: trade.id,
        matched_merchant_id: selectedMerchant.user_id,
        vendor_job_id: vendorJobId,
        success: true,
        message: `Matched with merchant: ${selectedMerchant.display_name}`
      };

    } catch (error: any) {
      console.error('Error creating premium trade request:', error);
      return {
        trade_id: '',
        success: false,
        message: error.message || 'Failed to create trade request'
      };
    }
  }

  // Generate a 6-digit verification code
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Notify merchant of new trade request
  private async notifyMerchant(merchantId: string, tradeId: string, amountUsd: number): Promise<void> {
    try {
      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: merchantId,
          title: 'New Trade Request',
          message: `You have a new cash delivery trade request for $${amountUsd}`,
          type: 'trade_request',
          data: {
            trade_id: tradeId,
            amount_usd: amountUsd,
            action: 'view_trade'
          }
        });

      console.log(`Notified merchant ${merchantId} of trade ${tradeId}`);
    } catch (error) {
      console.error('Error notifying merchant:', error);
    }
  }

  // Get trade details for a specific trade
  async getTradeDetails(tradeId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          seller:profiles!seller_id(display_name, phone_number),
          buyer:profiles!buyer_id(display_name, phone_number)
        `)
        .eq('id', tradeId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching trade details:', error);
      throw error;
    }
  }

  // Accept a trade request (merchant action)
  async acceptTradeRequest(tradeId: string, merchantId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .eq('buyer_id', merchantId);

      if (error) throw error;

      // Notify premium user that trade was accepted
      const trade = await this.getTradeDetails(tradeId);
      await supabase
        .from('notifications')
        .insert({
          user_id: trade.seller_id,
          title: 'Trade Accepted',
          message: `Your trade request for $${trade.amount_crypto} has been accepted`,
          type: 'trade_accepted',
          data: {
            trade_id: tradeId,
            action: 'view_trade'
          }
        });

      return true;
    } catch (error: any) {
      console.error('Error accepting trade request:', error);
      return false;
    }
  }

  // Get pending trade requests for a merchant
  async getPendingTradeRequests(merchantId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          seller:profiles!seller_id(display_name, phone_number)
        `)
        .eq('buyer_id', merchantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching pending trade requests:', error);
      return [];
    }
  }

  // Get vendor bank details for payment
  async getVendorBankDetails(tradeId: string): Promise<any> {
    try {
      // Get the vendor job associated with this trade
      const { data: vendorJob, error: jobError } = await supabase
        .from('vendor_jobs')
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq('trade_id', tradeId)
        .single();

      if (jobError) throw jobError;

      return {
        account_number: vendorJob.vendor.bank_account,
        bank_name: vendorJob.vendor.bank_name,
        bank_code: vendorJob.vendor.bank_code,
        account_name: vendorJob.vendor.display_name,
        amount_naira: vendorJob.amount_usd * 1650, // Convert to Naira
        amount_usd: vendorJob.amount_usd
      };
    } catch (error: any) {
      console.error('Error fetching vendor bank details:', error);
      // Return default vendor details if specific vendor not found
      return {
        account_number: '1234567890',
        bank_name: 'First Bank',
        account_name: 'TradeHub Vendor Services',
        amount_naira: 0,
        amount_usd: 0
      };
    }
  }
}

export const tradeMatchingService = new TradeMatchingService();
