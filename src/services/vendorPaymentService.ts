import { supabase } from '@/integrations/supabase/client';

export interface CashOrderWithUserDetails {
  id: string;
  user_id: string;
  tracking_code: string;
  order_type: string;
  naira_amount: number;
  usd_amount: number;
  service_fee: number;
  delivery_details: any;
  contact_details: any;
  status: string;
  payment_proof_url?: string;
  vendor_confirmed_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  vendor_job_id?: string;
  user_profile?: {
    id: string;
    display_name: string;
    phone_number: string;
    created_at: string;
  };
  vendor_job?: {
    vendor: {
      display_name: string;
      phone: string;
    };
  };
}

class VendorPaymentService {
  async getCashOrderById(orderId: string): Promise<CashOrderWithUserDetails | null> {
    try {
      const { data: orderData, error } = await supabase
        .from('cash_order_tracking')
        .select(`
          *,
          vendor_job:vendor_job_id (
            vendor:vendor_id (
              display_name,
              phone
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      // Get user profile separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, phone_number, created_at')
        .eq('user_id', orderData.user_id)
        .single();

      if (profileError) {
        console.warn('Profile not found:', profileError);
        // Return order data without profile
        return {
          ...orderData,
          user_profile: undefined,
          vendor_job: {
            vendor: {
              display_name: 'Vendor',
              phone: ''
            }
          }
        } as CashOrderWithUserDetails;
      }

      return {
        ...orderData,
        user_profile: {
          id: profileData.user_id,
          display_name: profileData.display_name || 'User',
          phone_number: profileData.phone_number || '',
          created_at: profileData.created_at || new Date().toISOString()
        },
        vendor_job: {
          vendor: {
            display_name: 'Vendor',
            phone: ''
          }
        }
      } as CashOrderWithUserDetails;
    } catch (error) {
      console.error('Error fetching cash order:', error);
      return null;
    }
  }

  async confirmOrderDelivery(orderId: string, vendorId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cash_order_tracking')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error confirming delivery:', error);
      return false;
    }
  }

  async getVendorCashOrders(vendorId: string): Promise<CashOrderWithUserDetails[]> {
    try {
      const { data: orders, error } = await supabase
        .from('cash_order_tracking')
        .select(`
          *,
          vendor_job:vendor_job_id (
            vendor:vendor_id (
              display_name,
              phone
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles for each order
      const ordersWithProfiles: CashOrderWithUserDetails[] = [];
      
      for (const order of orders || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, display_name, phone_number, created_at')
          .eq('user_id', order.user_id)
          .single();

        ordersWithProfiles.push({
          ...order,
          user_profile: profile ? {
            id: profile.user_id,
            display_name: profile.display_name || 'User',
            phone_number: profile.phone_number || '',
            created_at: profile.created_at || new Date().toISOString()
          } : undefined,
          vendor_job: {
            vendor: {
              display_name: 'Vendor',
              phone: ''
            }
          }
        } as CashOrderWithUserDetails);
      }

      return ordersWithProfiles;
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
      return [];
    }
  }

  async uploadPaymentProof(orderId: string, proofUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cash_order_tracking')
        .update({
          payment_proof_url: proofUrl,
          status: 'payment_submitted'
        })
        .eq('id', orderId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      return false;
    }
  }

  async confirmPaymentReceived(orderId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cash_order_tracking')
        .update({
          status: 'payment_confirmed',
          vendor_confirmed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error confirming payment:', error);
      return false;
    }
  }
}

export const vendorPaymentService = new VendorPaymentService();