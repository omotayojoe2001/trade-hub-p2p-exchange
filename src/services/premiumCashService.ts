import { supabase } from '@/integrations/supabase/client';

export interface PremiumCashOrder {
  id?: string;
  user_id: string;
  crypto_type: string;
  crypto_amount: number;
  naira_amount: number;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  phone_number: string;
  whatsapp_number: string;
  preferred_date: string;
  preferred_time: string;
  selected_areas: string[];
  status: string;
  points_deducted: number;
  escrow_address?: string;
  vault_id?: string;
}

export const premiumCashService = {
  // Create premium cash order
  async createOrder(orderData: Omit<PremiumCashOrder, 'id' | 'status' | 'points_deducted'>) {
    try {
      // Calculate points to deduct (10 points per $100 USD)
      const pointsToDeduct = Math.ceil(orderData.naira_amount / 100 * 10); // naira_amount now stores USD
      
      const { data, error } = await supabase
        .from('premium_cash_orders')
        .insert({
          ...orderData,
          status: 'pending',
          points_deducted: pointsToDeduct
        })
        .select()
        .single();

      if (error) throw error;

      // Deduct points from user
      await this.deductPoints(orderData.user_id, pointsToDeduct, data.id);

      return data;
    } catch (error) {
      console.error('Error creating premium cash order:', error);
      throw error;
    }
  },

  // Deduct points from user
  async deductPoints(userId: string, points: number, orderId: string) {
    try {
      // Get current points balance and validate
      const { data: profile, error: getError } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('user_id', userId)
        .single();

      if (getError) throw getError;
      
      const currentBalance = profile.points_balance || 0;
      if (currentBalance < points) {
        throw new Error(`Insufficient points balance. Required: ${points}, Available: ${currentBalance}`);
      }

      // Update user's points balance
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          points_balance: currentBalance - points
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Skip points transaction logging for now
      console.log(`Deducted ${points} points from user ${userId} for order ${orderId}`);
    } catch (error) {
      console.error('Error deducting points:', error);
      throw error;
    }
  },

  // Get vendors by selected areas
  async getVendorsByAreas(areas: string[]) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .in('location', areas)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting vendors by areas:', error);
      throw error;
    }
  },

  // Assign vendor to order
  async assignVendor(orderId: string, vendorId: string) {
    try {
      const { error } = await supabase
        .from('premium_cash_orders')
        .update({ 
          assigned_vendor_id: vendorId,
          status: 'vendor_assigned'
        })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning vendor:', error);
      throw error;
    }
  },

  // Get user's premium cash orders
  async getUserOrders(userId: string) {
    try {
      const { data, error } = await supabase
        .from('premium_cash_orders')
        .select(`
          *,
          vendors (
            name,
            location,
            phone_number
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  },

  // Get vendor's assigned orders
  async getVendorOrders(vendorId: string) {
    try {
      const { data, error } = await supabase
        .from('premium_cash_orders')
        .select(`
          *,
          profiles!premium_cash_orders_user_id_fkey (
            display_name,
            phone_number
          )
        `)
        .eq('assigned_vendor_id', vendorId)
        .in('status', ['vendor_assigned', 'payment_sent', 'vendor_confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting vendor orders:', error);
      throw error;
    }
  }
};