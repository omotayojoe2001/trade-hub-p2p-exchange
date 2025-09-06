import { supabase } from '@/integrations/supabase/client';
import { vendorAuthService } from './vendorAuthService';

export interface CreditPurchaseTransaction {
  id: string;
  user_id: string;
  credits_amount: number;
  price_paid_naira: number;
  status: string;
  payment_proof_url?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditBundle {
  credits: number;
  price_naira: number;
  usd_value: number;
  savings?: number;
  popular?: boolean;
}

export interface PurchaseCreditsRequest {
  credits_amount: number;
  payment_reference?: string;
  payment_proof_url?: string;
}

class CreditsService {
  // Get user's current credit balance
  async getCreditBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data.credits_balance || 0;
    } catch (error) {
      console.error('Error fetching credit balance:', error);
      return 0;
    }
  }

  // Get credit pricing and bundles
  async getCreditPricing(): Promise<{
    pricePerCredit: number;
    creditUsdValue: number;
    bundles: CreditBundle[];
  }> {
    try {
      const config = await vendorAuthService.getSystemConfig();
      const pricePerCredit = parseFloat(config.CREDIT_PRICE_NGN || '1500');
      const creditUsdValue = parseFloat(config.CREDIT_USD_VALUE || '10');

      // Define credit bundles with discounts
      const bundles: CreditBundle[] = [
        {
          credits: 1,
          price_naira: pricePerCredit,
          usd_value: creditUsdValue,
        },
        {
          credits: 5,
          price_naira: pricePerCredit * 5 * 0.95, // 5% discount
          usd_value: creditUsdValue * 5,
          savings: pricePerCredit * 5 * 0.05,
        },
        {
          credits: 10,
          price_naira: pricePerCredit * 10 * 0.9, // 10% discount
          usd_value: creditUsdValue * 10,
          savings: pricePerCredit * 10 * 0.1,
          popular: true,
        },
        {
          credits: 25,
          price_naira: pricePerCredit * 25 * 0.85, // 15% discount
          usd_value: creditUsdValue * 25,
          savings: pricePerCredit * 25 * 0.15,
        },
        {
          credits: 50,
          price_naira: pricePerCredit * 50 * 0.8, // 20% discount
          usd_value: creditUsdValue * 50,
          savings: pricePerCredit * 50 * 0.2,
        },
      ];

      return {
        pricePerCredit,
        creditUsdValue,
        bundles,
      };
    } catch (error) {
      console.error('Error fetching credit pricing:', error);
      return {
        pricePerCredit: 1500,
        creditUsdValue: 10,
        bundles: [],
      };
    }
  }

  // Calculate credits required for a USD amount
  async calculateCreditsRequired(amountUsd: number): Promise<{
    creditsRequired: number;
    totalCost: number;
    creditValue: number;
  }> {
    try {
      const config = await vendorAuthService.getSystemConfig();
      const creditUsdValue = parseFloat(config.CREDIT_USD_VALUE || '10');
      const pricePerCredit = parseFloat(config.CREDIT_PRICE_NGN || '1500');
      const roundingPolicy = config.POINTS_ROUNDING || 'ceil';
      
      const creditsNeeded = amountUsd / creditUsdValue;
      const creditsRequired = roundingPolicy === 'ceil' 
        ? Math.ceil(creditsNeeded) 
        : Math.floor(creditsNeeded);

      return {
        creditsRequired,
        totalCost: creditsRequired * pricePerCredit,
        creditValue: creditUsdValue,
      };
    } catch (error) {
      console.error('Error calculating credits required:', error);
      return {
        creditsRequired: Math.ceil(amountUsd / 10),
        totalCost: Math.ceil(amountUsd / 10) * 1500,
        creditValue: 10,
      };
    }
  }

  // Purchase credits
  async purchaseCredits(userId: string, purchaseData: PurchaseCreditsRequest): Promise<CreditPurchaseTransaction> {
    try {
      const pricing = await this.getCreditPricing();
      const totalPrice = purchaseData.credits_amount * pricing.pricePerCredit;

      // Create purchase transaction
      const { data, error } = await supabase
        .from('credit_purchase_transactions')
        .insert({
          user_id: userId,
          credits_amount: purchaseData.credits_amount,
          price_paid_naira: totalPrice,
          payment_reference: purchaseData.payment_reference,
          payment_proof_url: purchaseData.payment_proof_url,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error purchasing credits:', error);
      throw new Error(error.message || 'Failed to purchase credits');
    }
  }

  // Confirm credit purchase (admin/webhook action)
  async confirmCreditPurchase(transactionId: string): Promise<void> {
    try {
      // Get transaction details
      const { data: transaction, error: txError } = await supabase
        .from('credit_purchase_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (txError) throw txError;
      if (transaction.status !== 'pending') {
        throw new Error('Transaction is not in pending status');
      }

      // Get current user balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('user_id', transaction.user_id)
        .single();

      if (profileError) throw profileError;

      // Update user balance
      const newBalance = (profile.credits_balance || 0) + transaction.credits_amount;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits_balance: newBalance })
        .eq('user_id', transaction.user_id);

      if (updateError) throw updateError;

      // Mark transaction as paid
      const { error: txUpdateError } = await supabase
        .from('credit_purchase_transactions')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (txUpdateError) throw txUpdateError;

    } catch (error: any) {
      console.error('Error confirming credit purchase:', error);
      throw new Error(error.message || 'Failed to confirm credit purchase');
    }
  }

  // Get user's credit purchase history
  async getCreditPurchaseHistory(userId: string): Promise<CreditPurchaseTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('credit_purchase_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching credit purchase history:', error);
      return [];
    }
  }

  // Check if user has sufficient credits
  async hasSufficientCredits(userId: string, requiredCredits: number): Promise<{
    sufficient: boolean;
    currentBalance: number;
    shortfall: number;
  }> {
    try {
      const currentBalance = await this.getCreditBalance(userId);
      const sufficient = currentBalance >= requiredCredits;
      const shortfall = sufficient ? 0 : requiredCredits - currentBalance;

      return {
        sufficient,
        currentBalance,
        shortfall,
      };
    } catch (error) {
      console.error('Error checking credit sufficiency:', error);
      return {
        sufficient: false,
        currentBalance: 0,
        shortfall: requiredCredits,
      };
    }
  }

  // Get vendor bank account details for payments
  async getVendorBankDetails(): Promise<{
    account_number: string;
    bank_name: string;
    bank_code?: string;
    account_name: string;
  }> {
    try {
      const config = await vendorAuthService.getSystemConfig();
      
      return {
        account_number: config.VENDOR_BANK_ACCOUNT || '1234567890',
        bank_name: config.VENDOR_BANK_NAME || 'First Bank',
        bank_code: config.VENDOR_BANK_CODE || '011',
        account_name: 'TradeHub Vendor Services',
      };
    } catch (error) {
      console.error('Error fetching vendor bank details:', error);
      return {
        account_number: '1234567890',
        bank_name: 'First Bank',
        account_name: 'TradeHub Vendor Services',
      };
    }
  }

  // Add credits to user (admin function)
  async addCreditsToUser(userId: string, creditsAmount: number, reason: string = 'Admin credit'): Promise<void> {
    try {
      // Get current balance
      const currentBalance = await this.getCreditBalance(userId);
      const newBalance = currentBalance + creditsAmount;

      // Update balance
      const { error } = await supabase
        .from('profiles')
        .update({ credits_balance: newBalance })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the credit addition
      await supabase
        .from('credit_purchase_transactions')
        .insert({
          user_id: userId,
          credits_amount: creditsAmount,
          price_paid_naira: 0,
          status: 'paid',
          payment_reference: `ADMIN_CREDIT_${Date.now()}`,
        });

    } catch (error: any) {
      console.error('Error adding credits to user:', error);
      throw new Error(error.message || 'Failed to add credits');
    }
  }

  // Deduct credits from user (system function)
  async deductCreditsFromUser(userId: string, creditsAmount: number, reason: string = 'Service usage'): Promise<void> {
    try {
      const currentBalance = await this.getCreditBalance(userId);
      
      if (currentBalance < creditsAmount) {
        throw new Error('Insufficient credits');
      }

      const newBalance = currentBalance - creditsAmount;

      const { error } = await supabase
        .from('profiles')
        .update({ credits_balance: newBalance })
        .eq('user_id', userId);

      if (error) throw error;

    } catch (error: any) {
      console.error('Error deducting credits from user:', error);
      throw new Error(error.message || 'Failed to deduct credits');
    }
  }
}

export const creditsService = new CreditsService();
