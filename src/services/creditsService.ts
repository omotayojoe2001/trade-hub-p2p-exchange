import { supabase } from '@/integrations/supabase/client';

// Credit Value System: 1 credit = $0.01 USD
export const CREDIT_VALUE_USD = 0.01;
export const MIN_CREDIT_PURCHASE = 10; // $0.10 minimum

// Calculate crypto amounts for credit purchase
export const calculateCreditValue = (credits: number) => ({
  credits,
  usd: credits * CREDIT_VALUE_USD,
  btc: (credits * CREDIT_VALUE_USD) / 100000, // Assuming BTC = $100,000
  eth: (credits * CREDIT_VALUE_USD) / 3500    // Assuming ETH = $3,500
});

export interface CreditPurchase {
  id: string;
  user_id: string;
  crypto_type: 'BTC' | 'ETH';
  crypto_amount: number;
  credits_amount: number;
  payment_address: string;
  transaction_hash?: string;
  status: 'pending' | 'paid' | 'confirmed' | 'completed' | 'failed';
  payment_proof_url?: string;
  created_at: string;
  confirmed_at?: string;
  expires_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'spend' | 'refund';
  amount: number;
  description: string;
  reference_id?: string;
  created_at: string;
}

export const creditsService = {
  // Get user's current credit balance with fallback
  async getUserCredits(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user credits:', error);
        return 0;
      }
      return (data as any)?.credits_balance || 0;
    } catch (error) {
      console.error('Error in getUserCredits:', error);
      return 0;
    }
  },

  // Calculate crypto amount for credit purchase
  calculateCryptoAmount(credits: number, cryptoType: 'BTC' | 'ETH'): number {
    const usdValue = credits * CREDIT_VALUE_USD;
    
    switch (cryptoType) {
      case 'BTC':
        return usdValue / 100000; // Assuming BTC = $100,000
      case 'ETH':
        return usdValue / 3500;   // Assuming ETH = $3,500
      default:
        return 0;
    }
  },

  // Validate credit purchase amount
  validatePurchaseAmount(credits: number): { valid: boolean; message?: string } {
    if (credits < MIN_CREDIT_PURCHASE) {
      return {
        valid: false,
        message: `Minimum purchase is ${MIN_CREDIT_PURCHASE} credits ($${(MIN_CREDIT_PURCHASE * CREDIT_VALUE_USD).toFixed(2)})`
      };
    }
    
    if (credits > 100000) {
      return {
        valid: false,
        message: 'Maximum purchase is 100,000 credits ($1,000.00)'
      };
    }
    
    return { valid: true };
  },

  // Get user's credit purchase history
  async getCreditPurchases(userId: string): Promise<CreditPurchase[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('credit_purchase_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[] || [];
    } catch (error) {
      console.error('Error fetching credit purchases:', error);
      return [];
    }
  },

  // Get user's credit transaction history
  async getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('credit_purchase_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[] || [];
    } catch (error) {
      console.error('Error fetching credit transactions:', error);
      return [];
    }
  },

  // Spend credits (for cash services)
  async spendCredits(userId: string, amount: number, description: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('spend_user_credits', {
        user_id_param: userId,
        credits_amount: amount,
        description_text: description
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error spending credits:', error);
      return false;
    }
  },

  // Check if user has enough credits
  async hasEnoughCredits(userId: string, requiredAmount: number): Promise<boolean> {
    const currentCredits = await this.getUserCredits(userId);
    return currentCredits >= requiredAmount;
  },

  // Confirm credit purchase (admin function)
  async confirmPurchase(purchaseId: string): Promise<boolean> {
    try {
      // Get purchase details
      const { data: purchase, error: fetchError } = await (supabase as any)
        .from('credit_purchase_transactions')
        .select('*')
        .eq('id', purchaseId)
        .single();

      if (fetchError) throw fetchError;
      
      if (purchase.status === 'completed') {
        console.log('Purchase already completed');
        return true;
      }

      // Add credits to user account using database function
      const { error: addError } = await (supabase as any).rpc('update_credit_balance', {
        p_user_id: purchase.user_id,
        p_amount: purchase.credits_amount
      });

      if (addError) throw addError;

      // Update purchase status
      const { error: updateError } = await supabase
        .from('credit_purchase_transactions')
        .update({
          status: 'paid'
        })
        .eq('id', purchaseId);

      if (updateError) throw updateError;

      console.log(`Successfully confirmed purchase: ${purchase.credits_amount} credits for user ${purchase.user_id}`);
      return true;
    } catch (error) {
      console.error('Error confirming purchase:', error);
      return false;
    }
  },

  // Subscribe to credit balance changes with error handling
  subscribeToCredits(userId: string, callback: (credits: number) => void) {
    try {
      // Use a simpler channel name to avoid conflicts
      const channelName = `user_credits_${userId.replace(/-/g, '_')}`;
      
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`
        }, async (payload) => {
          if (payload.new) {
            callback((payload.new as any).credits_balance || 0);
          }
        })
        .subscribe();

      return channel;
    } catch (error) {
      console.error('Error subscribing to credits:', error);
      return null;
    }
  },

  // Get purchase and transaction history combined
  async getCreditHistory(userId: string) {
    try {
      const [purchases, transactions] = await Promise.all([
        this.getCreditPurchases(userId),
        this.getCreditTransactions(userId)
      ]);

      return { purchases, transactions };
    } catch (error) {
      console.error('Error fetching credit history:', error);
      return { purchases: [], transactions: [] };
    }
  }
};

// Credit costs for different services (in credits) - TEMPORARILY DISABLED
export const CREDIT_COSTS = {
  CASH_PICKUP: 0,       // Temporarily disabled - will be calculated based on distance
  CASH_DELIVERY: 0,     // Temporarily disabled - will be calculated based on distance  
  PRIORITY_SUPPORT: 25, // $0.25 - Priority customer support
  ADVANCED_FEATURES: 75,// $0.75 - Advanced trading features
  PREMIUM_MATCHING: 10, // $0.10 - Priority trade matching
  EXTENDED_ESCROW: 15   // $0.15 - Extended escrow protection
};

// Calculate platform fee based on USD amount (10 credits per $100)
export const calculatePlatformFeeCredits = (usdAmount: number): number => {
  return Math.ceil(usdAmount / 10); // 10 credits per $100 USD
};

// Calculate total credits needed for cash services - SIMPLIFIED FOR NOW
export const calculateTotalCreditsForCash = (usdAmount: number, serviceType: 'pickup' | 'delivery'): number => {
  // Only platform fee for now, service fees will be calculated after address/location selection
  return calculatePlatformFeeCredits(usdAmount);
};