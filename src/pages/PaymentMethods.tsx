import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, CreditCard, Building, Star, Edit2, Trash2, Shield, Check, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getBanksByCountry, verifyAccountName, validateAccountNumber, Bank } from '@/services/banksAPI';
import { bankAccountService } from '@/services/bankAccountService';

interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  country: string;
  createdAt: string;
}

const PaymentMethods = () => {
  const { user } = useAuth();
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [availableBanks, setAvailableBanks] = useState<Bank[]>([]);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [bankData, setBankData] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
    country: 'NG'
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    if (user) {
      loadBankAccounts();
      loadBanks();
    }
  }, [user]);

  const loadBankAccounts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Use user_bank_accounts table directly
      const { data: accounts, error } = await supabase
        .from('user_bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAccounts = (accounts || []).map(account => ({
        id: account.id,
        bankName: account.bank_name || '',
        bankCode: account.bank_code || '',
        accountNumber: account.account_number || '',
        accountName: account.account_name || '',
        isDefault: account.is_default || false,
        country: 'NG',
        createdAt: account.created_at
      }));

      setBankAccounts(formattedAccounts);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load bank accounts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      const banks = await getBanksByCountry(bankData.country);
      setAvailableBanks(banks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load banks",
        variant: "destructive"
      });
    }
  };

  const handleVerifyAccount = async () => {
    if (!bankData.accountNumber || !bankData.bankCode) {
      toast({
        title: "Missing Information",
        description: "Please enter account number and select a bank",
        variant: "destructive"
      });
      return;
    }

    if (!validateAccountNumber(bankData.accountNumber, bankData.country)) {
      toast({
        title: "Invalid Account Number",
        description: `Account number format is invalid for ${bankData.country}`,
        variant: "destructive"
      });
      return;
    }

    setVerifyingAccount(true);
    try {
      const result = await verifyAccountName(bankData.accountNumber, bankData.bankCode, bankData.country);

      if (result.success && result.accountName) {
        setBankData(prev => ({ ...prev, accountName: result.accountName! }));
        setAccountVerified(true);
        toast({
          title: "Account Verified",
          description: `Account belongs to ${result.accountName}`,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Could not verify account",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify account",
        variant: "destructive"
      });
    } finally {
      setVerifyingAccount(false);
    }
  };

  const handleAddBankAccount = async () => {
    // Basic validation
    if (!bankData.accountNumber.trim()) {
      toast({
        title: "Missing Account Number",
        description: "Please enter the account number",
        variant: "destructive"
      });
      return;
    }

    if (!bankData.accountName.trim()) {
      toast({
        title: "Missing Account Name",
        description: "Please enter the account holder name",
        variant: "destructive"
      });
      return;
    }

    // Ensure a bank is selected
    if (!bankData.bankCode) {
      toast({
        title: "No Bank Selected",
        description: "Please select a bank from the list",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add a bank account",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      const bankName = availableBanks.find(bank => bank.code === bankData.bankCode)?.name || '';

      const accountData = {
        user_id: user.id,
        type: 'bank_account',
        bank_name: bankName,
        bank_code: bankData.bankCode,
        account_number: bankData.accountNumber,
        account_name: bankData.accountName,
        country: bankData.country,
        is_default: bankAccounts.length === 0, // First account is default
        is_active: true
      };

      // Add to user_bank_accounts table directly
      const { error } = await supabase
        .from('user_bank_accounts')
        .insert({
          user_id: user.id,
          bank_name: bankName,
          bank_code: bankData.bankCode,
          account_number: bankData.accountNumber,
          account_name: bankData.accountName,
          is_default: bankAccounts.length === 0,
          is_verified: false
        });

      if (error) throw error;

      toast({
        title: "Bank Account Added",
        description: "Your bank account has been added successfully",
        duration: 3000
      });

      // Reload bank accounts to show the new one
      await loadBankAccounts();
      resetBankForm();
      setIsAddingBank(false);
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast({
        title: "Error",
        description: "Failed to save bank account. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    if (!user) return;

    try {
      // Use bankAccountService to set default
      await bankAccountService.setDefaultBankAccount(user.id, accountId);

      // Update local state
      setBankAccounts(prev =>
        prev.map(account => ({
          ...account,
          isDefault: account.id === accountId
        }))
      );

      toast({
        title: "Default Account Updated",
        description: "Default bank account has been changed",
      });
    } catch (error) {
      console.error('Error setting default account:', error);
      toast({
        title: "Error",
        description: "Failed to set default account. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    const accountToDelete = bankAccounts.find(acc => acc.id === accountId);
    if (accountToDelete?.isDefault && bankAccounts.length > 1) {
      // Set another account as default
      setBankAccounts(prev => {
        const filtered = prev.filter(acc => acc.id !== accountId);
        if (filtered.length > 0) {
          filtered[0].isDefault = true;
        }
        return filtered;
      });
    } else {
      setBankAccounts(prev => prev.filter(acc => acc.id !== accountId));
    }

    toast({
      title: "Account Deleted",
      description: "Bank account has been removed",
    });
  };

  const resetBankForm = () => {
    setBankData({
      bankName: '',
      bankCode: '',
      accountNumber: '',
      accountName: '',
      country: 'NG'
    });
    setAccountVerified(false);
    setEditingAccount(null);
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setBankData({
      bankName: account.bankName,
      bankCode: account.bankCode,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      country: account.country
    });
    setAccountVerified(true); // Assume existing accounts are verified
    setIsAddingBank(true);
  };

  const handleUpdateBankAccount = () => {
    if (!editingAccount || !accountVerified) {
      toast({
        title: "Cannot Update",
        description: "Please verify the account before updating",
        variant: "destructive"
      });
      return;
    }

    const selectedBank = availableBanks.find(bank => bank.code === bankData.bankCode);

    if (!selectedBank) return;

    const updatedAccount: BankAccount = {
      ...editingAccount,
      bankName: selectedBank.name,
      bankCode: selectedBank.code,
      accountNumber: bankData.accountNumber,
      accountName: bankData.accountName,
      country: bankData.country
    };

    setBankAccounts(prev =>
      prev.map(account =>
        account.id === editingAccount.id ? updatedAccount : account
      )
    );

    resetBankForm();
    setIsAddingBank(false);

    toast({
      title: "Account Updated",
      description: "Your bank account has been updated successfully",
    });
  };

  const handleBankInputChange = (field: string, value: string) => {
    setBankData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset verification when account number or bank changes
    if (field === 'accountNumber' || field === 'bankCode') {
      setAccountVerified(false);
      if (field === 'accountNumber') {
        setBankData(prev => ({ ...prev, accountName: '' }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/settings" className="mr-3">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Payment Methods</h1>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus size={16} className="mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Bank Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center">
                  <Building size={48} className="mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600 mb-4">Add your bank account for secure transactions</p>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setIsAddingBank(true)}
                  >
                    <Building size={20} className="mr-2" />
                    Add Bank Account
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Bank Accounts List */}
        <Card className="bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Bank Accounts</h3>

          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Building size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No bank accounts added yet</p>
              <Button onClick={() => setIsAddingBank(true)}>
                <Plus size={16} className="mr-2" />
                ADD YOUR BANK ACCOUNT
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 border">
                      <Building size={20} className="text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <p className="font-semibold text-gray-900">{account.bankName}</p>
                        {account.isDefault && (
                          <div className="flex items-center ml-2">
                            <Star size={14} className="text-yellow-500 mr-1" />
                            <span className="text-xs text-yellow-600">Default</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {account.accountName} • ****{account.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!account.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(account.id)}
                        title="Set as default"
                      >
                        <Star size={16} className="text-gray-400" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAccount(account)}
                      title="Edit account"
                    >
                      <Edit2 size={16} className="text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                      title="Delete account"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>



        {/* Add New Bank Form */}
        {isAddingBank && (
          <Card className="bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
              </h3>
              <Button variant="outline" size="sm" onClick={() => { setIsAddingBank(false); resetBankForm(); }}>
                Cancel
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <Select value={bankData.country} onValueChange={(value) => handleBankInputChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NG">🇳🇬 Nigeria</SelectItem>
                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                    <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                    <SelectItem value="KE">🇰🇪 Kenya</SelectItem>
                    <SelectItem value="ZA">🇿🇦 South Africa</SelectItem>
                    <SelectItem value="GH">🇬🇭 Ghana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>

                <Select value={bankData.bankCode} onValueChange={(value) => {
                  const selectedBank = availableBanks.find(bank => bank.code === value);
                  if (selectedBank) {
                    handleBankInputChange('bankCode', value);
                    handleBankInputChange('bankName', selectedBank.name);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBanks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.code}>
                        {bank.name} {bank.ussd && `(${bank.ussd})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <div className="flex space-x-2">
                  <Input
                    value={bankData.accountNumber}
                    onChange={(e) => handleBankInputChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                    placeholder={bankData.country === 'NG' ? '1234567890' : 'Account number'}
                    maxLength={bankData.country === 'NG' ? 10 : 20}
                    className="flex-1"
                  />

                </div>
                {bankData.country === 'NG' && (
                  <p className="text-xs text-gray-500 mt-1">Nigerian account numbers are 10 digits</p>
                )}
              </div>

              {/* Account Holder Name - Always show input field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                <Input
                  value={bankData.accountName}
                  onChange={(e) => handleBankInputChange('accountName', e.target.value)}
                  placeholder="Enter account holder name"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the name as it appears on the bank account</p>
              </div>

              {!accountVerified && bankData.accountNumber && bankData.bankCode && (
                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle size={16} className="text-yellow-600 mr-2" />
                  <span className="text-yellow-800 text-sm">
                    Please verify your account number before adding
                  </span>
                </div>
              )}

              <Button
                className="w-full"
                onClick={editingAccount ? handleUpdateBankAccount : handleAddBankAccount}
                disabled={
                  !bankData.accountNumber ||
                  !bankData.accountName ||
                  !bankData.bankCode ||
                  saving
                }
              >
                {editingAccount ? 'Update Bank Account' : 'Add Bank Account'}
              </Button>
            </div>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="bg-white p-6 border-blue-200">
          <div className="flex items-start">
            <Shield size={20} className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Notice</h3>
              <p className="text-sm text-gray-600 mb-3">
                Your payment information is encrypted and stored securely. We use industry-standard security measures to protect your data.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 256-bit SSL encryption</li>
                <li>• PCI DSS compliance</li>
                <li>• Regular security audits</li>
                <li>• Fraud monitoring</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Payment Limits */}
        <Card className="bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Limits</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Daily Limit</span>
              <span className="text-sm font-medium text-gray-900">₦2,000,000</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monthly Limit</span>
              <span className="text-sm font-medium text-gray-900">₦50,000,000</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Remaining Today</span>
              <span className="text-sm font-medium text-green-600">₦1,750,000</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Want higher limits?</span> Upgrade to Premium to increase your daily and monthly limits.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentMethods;