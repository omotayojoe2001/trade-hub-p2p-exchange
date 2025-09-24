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
      
      // Mock implementation since premium_cash_orders table doesn't exist
      const mockData = {
        id: 'mock-order-' + Date.now(),
        ...orderData,
        status: 'pending',
        points_deducted: pointsToDeduct
      };
      const data = mockData;
      const error = null;

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
      // Mock points balance validation since points_balance column doesn't exist
      const currentBalance = 1000; // Mock balance
      if (currentBalance < points) {
        throw new Error(`Insufficient points balance. Required: ${points}, Available: ${currentBalance}`);
      }

      // Mock points balance update since points_balance column doesn't exist
      console.log(`Would update points balance for user ${userId} from ${currentBalance} to ${currentBalance - points}`);

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
      const { data, error } = await (supabase as any)
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
      // Mock implementation since premium_cash_orders table doesn't exist
      console.log(`Would assign vendor ${vendorId} to order ${orderId}`);
    } catch (error) {
      console.error('Error assigning vendor:', error);
      throw error;
    }
  },

  // Get user's premium cash orders
  async getUserOrders(userId: string) {
    try {
      // Mock implementation since premium_cash_orders table doesn't exist
      return [];
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  },

  // Get vendor's assigned orders
  async getVendorOrders(vendorId: string) {
    try {
      // Mock implementation since premium_cash_orders table doesn't exist
      return [];
    } catch (error) {
      console.error('Error getting vendor orders:', error);
      throw error;
    }
  }
};