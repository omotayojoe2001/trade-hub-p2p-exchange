import { supabase } from '@/integrations/supabase/client';

interface CashOrderData {
  nairaAmount: number;
  usdAmount: number;
  serviceFee: number;
  orderType: 'naira_to_usd_pickup' | 'naira_to_usd_delivery';
  deliveryDetails: any;
  contactDetails: {
    phoneNumber: string;
    whatsappNumber: string;
    preferredDate: string;
    preferredTime: string;
    additionalNotes?: string;
  };
}

interface VendorJob {
  id: string;
  vendor_id: string;
  premium_user_id: string;
  amount_usd: number;
  delivery_type: string;
  status: string;
  tracking_code: string;
  vendor: {
    user_id: string;
    display_name: string;
    phone: string;
    bank_account: string;
    bank_name: string;
  };
  premium_user: {
    display_name: string;
    phone_number: string;
  };
}

export class CashOrderService {
  // Create cash order with vendor assignment
  async createCashOrder(userId: string, orderData: CashOrderData): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_cash_order_with_vendor', {
        p_user_id: userId,
        p_naira_amount: orderData.nairaAmount,
        p_usd_amount: orderData.usdAmount,
        p_service_fee: orderData.serviceFee,
        p_order_type: orderData.orderType,
        p_delivery_details: orderData.deliveryDetails,
        p_contact_details: orderData.contactDetails
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating cash order:', error);
      throw new Error(error.message || 'Failed to create cash order');
    }
  }

  // Update payment proof for cash order
  async updatePaymentProof(orderId: string, paymentProofUrl: string): Promise<void> {
    try {
      // Update payment proof
      const { error } = await supabase
        .from('cash_order_tracking')
        .update({ 
          payment_proof_url: paymentProofUrl,
          status: 'payment_submitted'
        })
        .eq('id', orderId);

      if (error) throw error;

      // Get order details for notification
      const { data: orderData } = await supabase
        .from('cash_order_tracking')
        .select(`
          tracking_code,
          usd_amount,
          vendor_job:vendor_job_id (
            vendor:vendor_id (
              user_id
            )
          )
        `)
        .eq('id', orderId)
        .single();

      // Check if vendor relation exists and has user_id
      const vendorData = orderData?.vendor_job?.vendor;
      const vendorUserId = vendorData && typeof vendorData === 'object' && !Array.isArray(vendorData) && 'user_id' in vendorData ? (vendorData as any).user_id : null;
      if (vendorUserId && typeof vendorUserId === 'string') {
        await supabase
          .from('notifications')
          .insert({
            user_id: vendorUserId,
            type: 'payment_proof_uploaded',
            title: 'Payment Proof Uploaded',
            message: `Payment proof has been uploaded for order ${orderData.tracking_code} ($${orderData.usd_amount})`,
            data: {
              cash_order_id: orderId,
              tracking_code: orderData.tracking_code,
              usd_amount: orderData.usd_amount
            }
          });
      }
    } catch (error: any) {
      console.error('Error updating payment proof:', error);
      throw new Error(error.message || 'Failed to update payment proof');
    }
  }

  // Get cash order details
  async getCashOrder(orderId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('cash_order_tracking')
        .select(`
          *,
          vendor_job:vendor_job_id (
            *,
            vendor:vendor_id (
              display_name,
              phone,
              bank_account,
              bank_name,
              user_id
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching cash order:', error);
      throw new Error(error.message || 'Failed to fetch cash order');
    }
  }

  // Get user's cash orders
  async getUserCashOrders(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('cash_order_tracking')
        .select(`
          *,
          vendor_job:vendor_job_id (
            *,
            vendor:vendor_id (
              display_name,
              phone
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching user cash orders:', error);
      throw new Error(error.message || 'Failed to fetch cash orders');
    }
  }

  // For vendors: Get cash orders assigned to them
  async getVendorCashOrders(vendorUserId: string): Promise<any[]> {
    try {
      // Get vendor ID first
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', vendorUserId)
        .single();

      if (vendorError) {
        console.error('Vendor not found:', vendorError);
        return [];
      }

      const { data, error } = await supabase
        .from('vendor_jobs')
        .select(`
          id,
          vendor_id,
          premium_user_id,
          amount_usd,
          delivery_type,
          status,
          created_at,
          updated_at,
          tracking_code as vendor_tracking_code,
          verification_code,
          payment_confirmed_at,
          completed_at,
          cash_order:cash_order_id (
            id,
            tracking_code,
            contact_details,
            delivery_details,
            payment_proof_url,
            status
          ),
          vendor:vendor_id (
            user_id,
            display_name,
            phone,
            bank_account,
            bank_name
          )
        `)
        .eq('vendor_id', vendor.id)
        .eq('order_type', 'naira_to_usd')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vendor jobs:', error);
        return [];
      }
      
      return data || [];
    } catch (error: any) {
      console.error('Error fetching vendor cash orders:', error);
      return [];
    }
  }

  // Vendor confirms payment received
  async confirmPaymentReceived(vendorJobId: string, vendorUserId: string): Promise<void> {
    try {
      // Update vendor job status
      const { error: jobError } = await supabase
        .from('vendor_jobs')
        .update({ 
          status: 'payment_confirmed',
          payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', vendorJobId)
        .eq('vendor.user_id', vendorUserId);

      if (jobError) throw jobError;

      // Update cash order tracking
      const { error: trackingError } = await supabase
        .from('cash_order_tracking')
        .update({ 
          status: 'payment_confirmed',
          vendor_confirmed_at: new Date().toISOString()
        })
        .eq('vendor_job_id', vendorJobId);

      if (trackingError) throw trackingError;

      // Notify premium user
      const { data: jobData } = await supabase
        .from('vendor_jobs')
        .select('premium_user_id, tracking_code')
        .eq('id', vendorJobId)
        .single();

      if (jobData) {
        await supabase
          .from('notifications')
          .insert({
            user_id: jobData.premium_user_id,
            type: 'payment_confirmed',
            title: 'Payment Confirmed',
            message: `Your payment for order ${jobData.tracking_code} has been confirmed. Cash delivery will begin soon.`,
            data: {
              vendor_job_id: vendorJobId,
              tracking_code: jobData.tracking_code
            }
          });
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      throw new Error(error.message || 'Failed to confirm payment');
    }
  }

  // Vendor completes order with verification code
  async completeOrder(vendorJobId: string, verificationCode: string, vendorUserId: string): Promise<void> {
    try {
      // Verify the code matches
      const { data: jobData, error: fetchError } = await supabase
        .from('vendor_jobs')
        .select('verification_code, premium_user_id, tracking_code')
        .eq('id', vendorJobId)
        .eq('vendor.user_id', vendorUserId)
        .single();

      if (fetchError) throw fetchError;

      if (jobData.verification_code !== verificationCode) {
        throw new Error('Invalid verification code');
      }

      // Update vendor job to completed
      const { error: jobError } = await supabase
        .from('vendor_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', vendorJobId);

      if (jobError) throw jobError;

      // Update cash order tracking
      const { error: trackingError } = await supabase
        .from('cash_order_tracking')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('vendor_job_id', vendorJobId);

      if (trackingError) throw trackingError;

      // Notify premium user
      await supabase
        .from('notifications')
        .insert({
          user_id: jobData.premium_user_id,
          type: 'order_completed',
          title: 'Order Completed',
          message: `Your cash order ${jobData.tracking_code} has been completed successfully.`,
          data: {
            vendor_job_id: vendorJobId,
            tracking_code: jobData.tracking_code
          }
        });

    } catch (error: any) {
      console.error('Error completing order:', error);
      throw new Error(error.message || 'Failed to complete order');
    }
  }
}

export const cashOrderService = new CashOrderService();