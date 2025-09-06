import { supabase } from '@/integrations/supabase/client';

export interface BankAccount {
  id: string;
  user_id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code?: string;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountData {
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code?: string;
  is_default?: boolean;
}

export const bankAccountService = {
  // Get all bank accounts for a user
  async getUserBankAccounts(userId: string): Promise<BankAccount[]> {
    try {
      const { data, error } = await supabase
        .from('user_bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bank accounts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserBankAccounts:', error);
      throw error;
    }
  },

  // Add a new bank account
  async addBankAccount(userId: string, accountData: CreateBankAccountData): Promise<BankAccount> {
    try {
      // Validate account number (Nigerian banks use 10 digits)
      if (accountData.account_number.length !== 10) {
        throw new Error('Account number must be 10 digits');
      }

      // If this is set as default, unset other defaults first
      if (accountData.is_default) {
        await supabase
          .from('user_bank_accounts')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data, error } = await supabase
        .from('user_bank_accounts')
        .insert({
          user_id: userId,
          account_name: accountData.account_name.trim(),
          account_number: accountData.account_number.trim(),
          bank_name: accountData.bank_name,
          bank_code: accountData.bank_code,
          is_default: accountData.is_default || false,
          is_verified: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding bank account:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in addBankAccount:', error);
      throw error;
    }
  },

  // Update a bank account
  async updateBankAccount(accountId: string, updates: Partial<CreateBankAccountData>): Promise<BankAccount> {
    try {
      const { data, error } = await supabase
        .from('user_bank_accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId)
        .select()
        .single();

      if (error) {
        console.error('Error updating bank account:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateBankAccount:', error);
      throw error;
    }
  },

  // Delete a bank account
  async deleteBankAccount(accountId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_bank_accounts')
        .delete()
        .eq('id', accountId);

      if (error) {
        console.error('Error deleting bank account:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteBankAccount:', error);
      throw error;
    }
  },

  // Set default bank account
  async setDefaultBankAccount(userId: string, accountId: string): Promise<void> {
    try {
      // First, unset all defaults for this user
      await supabase
        .from('user_bank_accounts')
        .update({ 
          is_default: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Then set the selected account as default
      const { error } = await supabase
        .from('user_bank_accounts')
        .update({ 
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error setting default bank account:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in setDefaultBankAccount:', error);
      throw error;
    }
  },

  // Get default bank account
  async getDefaultBankAccount(userId: string): Promise<BankAccount | null> {
    try {
      const { data, error } = await supabase
        .from('user_bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching default bank account:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getDefaultBankAccount:', error);
      throw error;
    }
  },

  // Validate Nigerian bank account number
  validateAccountNumber(accountNumber: string): boolean {
    // Remove any spaces or special characters
    const cleanNumber = accountNumber.replace(/\D/g, '');
    
    // Nigerian bank account numbers are 10 digits
    return cleanNumber.length === 10;
  },

  // Get list of Nigerian banks
  getNigerianBanks(): Array<{ name: string; code: string }> {
    return [
      { name: 'Access Bank', code: '044' },
      { name: 'Citibank Nigeria', code: '023' },
      { name: 'Ecobank Nigeria', code: '050' },
      { name: 'Fidelity Bank', code: '070' },
      { name: 'First Bank of Nigeria', code: '011' },
      { name: 'First City Monument Bank', code: '214' },
      { name: 'Guaranty Trust Bank', code: '058' },
      { name: 'Heritage Bank', code: '030' },
      { name: 'Keystone Bank', code: '082' },
      { name: 'Polaris Bank', code: '076' },
      { name: 'Providus Bank', code: '101' },
      { name: 'Stanbic IBTC Bank', code: '221' },
      { name: 'Standard Chartered Bank', code: '068' },
      { name: 'Sterling Bank', code: '232' },
      { name: 'Union Bank of Nigeria', code: '032' },
      { name: 'United Bank For Africa', code: '033' },
      { name: 'Unity Bank', code: '215' },
      { name: 'Wema Bank', code: '035' },
      { name: 'Zenith Bank', code: '057' }
    ];
  }
};
