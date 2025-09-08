import { supabase } from '@/integrations/supabase/client';

export interface VendorPaymentConfirmation {
  orderId: string;
  amountReceived: number;
  transactionReference?: string;
}

export interface DeliveryCompletion {
  orderId: string;
  quoteCode: string;
}

export interface CashOrderWithUserDetails {
  id: string;
  user_id: string;
  tracking_code: string;
  order_type: string;
  naira_amount: number;
  usd_amount: number;
  service_fee: number;
  status: string;
  payment_proof_url?: string;
  delivery_details: any;
  contact_details: any;
  created_at: string;
  vendor_job_id: string;
  vendor_job: {
    verification_code: string;
    customer_phone?: string;
    vendor: {
      display_name: string;
      phone: string;
    };
  };
  user_profile?: {
    id: string;
    display_name: string;
    phone_number: string;
    whatsapp_number?: string;
    email?: string;
    bank_account?: string;
    bank_name?: string;
    created_at: string;
  };
}

class VendorPaymentService {
  // Get cash order details with full user profile information
  async getCashOrderWithUserDetails(orderId: string): Promise<CashOrderWithUserDetails | null> {
    try {
      // Get cash order details with vendor job info
      const { data: orderData, error: orderError } = await supabase
        .from('cash_order_tracking')
        .select(`
          *,
          vendor_job:vendor_job_id (
            verification_code,
            customer_phone,
            vendor:vendor_id (
              display_name,
              phone
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Get user profile details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', orderData.user_id)
        .single();

      if (profileError) {
        console.warn('Profile not found:', profileError);
        // Return order data without profile
        return {
          ...orderData,
          user_profile: undefined
        };
      }

      return {
        ...orderData,
        user_profile: {
          id: profileData.user_id,
          display_name: profileData.display_name || 'User',
          phone_number: profileData.phone_number || '',
          created_at: profileData.created_at || new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('Error fetching cash order with user details:', error);
      throw new Error(error.message || 'Failed to fetch order details');
    }
  }

  // Confirm payment received by vendor
  async confirmPaymentReceived(confirmation: VendorPaymentConfirmation): Promise<void> {
    try {
      // Get the order details first
      const { data: orderData, error: orderError } = await supabase
        .from('cash_order_tracking')
        .select('vendor_job_id, user_id, tracking_code, usd_amount')
        .eq('id', confirmation.orderId)
        .single();

      if (orderError) throw orderError;

      // Update vendor job status
      const { error: jobError } = await supabase
        .from('vendor_jobs')
        .update({ 
          status: 'payment_received',
          amount_naira_received: confirmation.amountReceived,
          bank_tx_reference: confirmation.transactionReference?.trim() || null,
          payment_received_at: new Date().toISOString()
        })
        .eq('id', orderData.vendor_job_id);

      if (jobError) throw jobError;

      // Update cash order status
      const { error: orderUpdateError } = await supabase
        .from('cash_order_tracking')
        .update({ 
          status: 'payment_confirmed',
          vendor_confirmed_at: new Date().toISOString()
        })
        .eq('id', confirmation.orderId);

      if (orderUpdateError) throw orderUpdateError;

      // Notify the premium user
      await supabase
        .from('notifications')
        .insert({
          user_id: orderData.user_id,
          type: 'payment_confirmed',
          title: 'Payment Confirmed',
          message: `Your payment for order ${orderData.tracking_code} has been confirmed. Cash delivery will begin soon.`,
          data: {
            cash_order_id: confirmation.orderId,
            tracking_code: orderData.tracking_code,
            usd_amount: orderData.usd_amount
          }
        });

    } catch (error: any) {
      console.error('Error confirming payment:', error);
      throw new Error(error.message || 'Failed to confirm payment');
    }
  }

  // Complete delivery with quote code validation
  async completeDelivery(completion: DeliveryCompletion): Promise<{ success: boolean; message: string }> {
    try {
      // Get the order details and verification code
      const { data: orderData, error: orderError } = await supabase
        .from('cash_order_tracking')
        .select(`
          vendor_job_id,
          user_id,
          tracking_code,
          vendor_job:vendor_job_id (
            verification_code
          )
        `)
        .eq('id', completion.orderId)
        .single();

      if (orderError) throw orderError;

      // Verify the quote code matches the verification code
      if (completion.quoteCode.trim() !== orderData.vendor_job.verification_code) {
        return {
          success: false,
          message: 'Invalid quote code. Please ask the customer for the correct code.'
        };
      }

      // Update vendor job to completed
      const { error: jobError } = await supabase
        .from('vendor_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderData.vendor_job_id);

      if (jobError) throw jobError;

      // Update cash order tracking
      const { error: orderUpdateError } = await supabase
        .from('cash_order_tracking')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', completion.orderId);

      if (orderUpdateError) throw orderUpdateError;

      // Notify the premium user
      await supabase
        .from('notifications')
        .insert({
          user_id: orderData.user_id,
          type: 'order_completed',
          title: 'Order Completed',
          message: `Your cash order ${orderData.tracking_code} has been completed successfully.`,
          data: {
            cash_order_id: completion.orderId,
            tracking_code: orderData.tracking_code
          }
        });

      return {
        success: true,
        message: 'Delivery completed successfully!'
      };

    } catch (error: any) {
      console.error('Error completing delivery:', error);
      throw new Error(error.message || 'Failed to complete delivery');
    }
  }

  // Get vendor's cash orders
  async getVendorCashOrders(vendorUserId: string): Promise<CashOrderWithUserDetails[]> {
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

      // Get vendor jobs with cash orders
      const { data: vendorJobs, error: jobsError } = await supabase
        .from('vendor_jobs')
        .select(`
          id,
          cash_order_id,
          order_type
        `)
        .eq('vendor_id', vendor.id)
        .eq('order_type', 'naira_to_usd')
        .not('cash_order_id', 'is', null);

      if (jobsError) {
        console.error('Error fetching vendor jobs:', jobsError);
        return [];
      }

      if (!vendorJobs || vendorJobs.length === 0) {
        return [];
      }

      // Get cash orders for these jobs
      const cashOrderIds = vendorJobs.map(job => job.cash_order_id).filter(Boolean);
      
      const { data: cashOrders, error: ordersError } = await supabase
        .from('cash_order_tracking')
        .select(`
          *,
          vendor_job:vendor_job_id (
            verification_code,
            customer_phone,
            vendor:vendor_id (
              display_name,
              phone
            )
          )
        `)
        .in('id', cashOrderIds)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching cash orders:', ordersError);
        return [];
      }

      // Get user profiles for all orders
      const userIds = [...new Set(cashOrders.map(order => order.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError);
      }

      // Combine orders with profiles and fix type structure
      return cashOrders.map(order => {
        const profile = profiles?.find(profile => profile.user_id === order.user_id);
        return {
          ...order,
          user_profile: {
            id: profile?.user_id || order.user_id,
            display_name: profile?.display_name || 'User',
            phone_number: profile?.phone_number || '',
            created_at: profile?.created_at || new Date().toISOString()
          }
        };
      });

    } catch (error: any) {
      console.error('Error fetching vendor cash orders:', error);
      return [];
    }
  }
}

export const vendorPaymentService = new VendorPaymentService();
