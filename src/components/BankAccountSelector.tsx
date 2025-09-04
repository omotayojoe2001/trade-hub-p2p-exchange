import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
}

interface BankAccountSelectorProps {
  selectedAccount: BankAccount | null;
  onAccountSelect: (account: BankAccount) => void;
  mode?: 'buy' | 'sell';
}

const BankAccountSelector: React.FC<BankAccountSelectorProps> = ({
  selectedAccount,
  onAccountSelect,
  mode = 'buy'
}) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBankAccounts();
    }
  }, [user]);

  const fetchBankAccounts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's bank accounts from user_bank_accounts table
      const { data: bankAccounts, error } = await supabase
        .from('user_bank_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching bank accounts:', error);
        return;
      }

      setAccounts(bankAccounts || []);

      // Auto-select first account if none selected
      if (bankAccounts && bankAccounts.length > 0 && !selectedAccount) {
        onAccountSelect(bankAccounts[0]);
      }

    } catch (error) {
      console.error('Error in fetchBankAccounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (account: BankAccount) => {
    onAccountSelect(account);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Receiving Account</label>
        <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {mode === 'sell'
          ? 'Add Account to Receive Your Money'
          : 'Your Bank Account (For payment confirmation)'
        }
      </label>
      
      {accounts.length === 0 ? (
        <div className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 text-center">
          <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">No bank accounts added</p>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              // TODO: Open add bank account popup instead of redirect
              alert('Add Bank Account popup will be implemented. For now, go to Settings > Payment Methods to add accounts.');
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Bank Account
          </Button>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full p-3 border border-gray-200 rounded-lg bg-white flex items-center justify-between hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
              <div className="text-left">
                {selectedAccount ? (
                  <>
                    <p className="font-medium text-gray-900">
                      {selectedAccount.bank_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedAccount.account_number} • {selectedAccount.account_name}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500">Select account</p>
                )}
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-1">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSelect(account)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
                  >
                    <CreditCard className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {account.bank_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {account.account_number} • {account.account_name}
                      </p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      // TODO: Open add bank account popup
                      alert('Add Bank Account popup will be implemented. For now, go to Settings > Payment Methods to add accounts.');
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center text-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-3" />
                    <span className="text-sm">Add New Account</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Premium message for multiple accounts */}
      {accounts.length > 1 && mode === 'sell' && (
        <div className="mt-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💎 <strong>Premium Feature:</strong> You can receive payments in multiple bank accounts with our Premium subscription.
          </p>
        </div>
      )}
    </div>
  );
};

export default BankAccountSelector;
