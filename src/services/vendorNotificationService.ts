import { supabase } from '@/integrations/supabase/client';

export interface VendorNotificationData {
  vendorId: string;
  cashTradeId: string;
  usdAmount: number;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  pickupLocation?: string;
  deliveryCode: string;
  sellerPhone?: string;
  customerName?: string;
  tradeRequestId: string;
}

export class VendorNotificationService {
  
  /**
   * Send payment notification to vendor when merchant pays them
   * NOTE: This now only updates the cash trade status - popup is handled by VendorBigPaymentPopup
   */
  static async notifyVendorPaymentReceived(data: VendorNotificationData): Promise<boolean> {
    try {
      console.log('🔔 VENDOR SERVICE: Payment received for vendor:', data.vendorId);
      console.log('✅ VENDOR SERVICE: Big popup will handle the notification display');
      return true;
      
    } catch (error) {
      console.error('❌ VENDOR SERVICE: Error in notifyVendorPaymentReceived:', error);
      return false;
    }
  }
  
  /**
   * Update cash trade status and trigger real-time notification
   */
  static async updateCashTradeStatus(
    cashTradeId: string, 
    status: string, 
    additionalData?: Record<string, any>
  ): Promise<boolean> {
    try {
      console.log('📝 VENDOR SERVICE: Updating cash trade status:', { cashTradeId, status });
      
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };
      
      const { error } = await supabase
        .from('cash_trades')
        .update(updateData)
        .eq('id', cashTradeId);
      
      if (error) {
        console.error('❌ VENDOR SERVICE: Failed to update cash trade:', error);
        return false;
      }
      
      console.log('✅ VENDOR SERVICE: Cash trade status updated successfully');
      return true;
      
    } catch (error) {
      console.error('❌ VENDOR SERVICE: Error updating cash trade status:', error);
      return false;
    }
  }
  
  /**
   * Get vendor's active delivery jobs
   */
  static async getVendorActiveJobs(vendorId: string) {
    try {
      const { data: jobs, error } = await supabase
        .from('cash_trades')
        .select(`
          *,
          trade_requests!trade_request_id (
            user_id,
            crypto_type,
            amount_crypto
          )
        `)
        .eq('vendor_id', vendorId)
        .in('status', ['vendor_paid', 'delivery_in_progress'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ VENDOR SERVICE: Error fetching active jobs:', error);
        return [];
      }
      
      return jobs || [];
      
    } catch (error) {
      console.error('❌ VENDOR SERVICE: Error in getVendorActiveJobs:', error);
      return [];
    }
  }
  
  /**
   * Mark delivery as completed
   */
  static async completeDelivery(
    cashTradeId: string, 
    vendorId: string, 
    deliveryCode: string
  ): Promise<boolean> {
    try {
      console.log('🚚 VENDOR SERVICE: Completing delivery:', { cashTradeId, vendorId, deliveryCode });
      
      // Update cash trade status
      const { data: updatedTrade, error: updateError } = await supabase
        .from('cash_trades')
        .update({
          status: 'cash_delivered',
          delivery_completed_at: new Date().toISOString(),
          vendor_delivery_confirmed: true
        })
        .eq('id', cashTradeId)
        .eq('vendor_id', vendorId)
        .eq('delivery_code', deliveryCode)
        .select()
        .single();
      
      if (updateError || !updatedTrade) {
        console.error('❌ VENDOR SERVICE: Failed to update delivery status:', updateError);
        return false;
      }
      
      // Notify seller that cash has been delivered
      const { error: sellerNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: updatedTrade.seller_id,
          type: 'cash_delivered',
          title: '💵 Cash Delivered!',
          message: `Your $${updatedTrade.usd_amount} USD cash has been delivered. Use code ${deliveryCode} to confirm receipt.`,
          data: {
            cash_trade_id: cashTradeId,
            delivery_code: deliveryCode,
            usd_amount: updatedTrade.usd_amount,
            vendor_id: vendorId
          }
        });
      
      if (sellerNotificationError) {
        console.error('❌ VENDOR SERVICE: Failed to notify seller:', sellerNotificationError);
      }
      
      console.log('✅ VENDOR SERVICE: Delivery completed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ VENDOR SERVICE: Error completing delivery:', error);
      return false;
    }
  }
  
  /**
   * Subscribe to vendor notifications in real-time
   */
  static subscribeToVendorNotifications(
    vendorId: string, 
    callback: (notification: any) => void
  ) {
    console.log('🔔 VENDOR SERVICE: Setting up real-time subscription for vendor:', vendorId);
    
    const channel = supabase
      .channel(`vendor-notifications-${vendorId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'cash_trades',
        filter: `vendor_id=eq.${vendorId}`
      }, (payload) => {
        console.log('🔔 VENDOR SERVICE: Cash trade update received:', payload);
        
        if (payload.new?.status === 'vendor_paid') {
          console.log('💰 VENDOR SERVICE: Payment received notification triggered!');
          callback({
            type: 'payment_received',
            data: payload.new
          });
        }
      })
      .subscribe((status) => {
        console.log('🔔 VENDOR SERVICE: Subscription status:', status);
      });
    
    return channel;
  }
}

export default VendorNotificationService;