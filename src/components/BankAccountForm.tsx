import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Building } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { bankAccountService, BankAccount, CreateBankAccountData } from '@/services/bankAccountService';

const BankAccountForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreateBankAccountData>({
    account_name: '',
    account_number: '',
    bank_name: '',
    bank_code: '',
    is_default: false
  });

  useEffect(() => {
    if (user) {
      loadBankAccounts();
    }
  }, [user]);

  const loadBankAccounts = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const accounts = await bankAccountService.getUserBankAccounts(user.id);
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load bank accounts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);
      await bankAccountService.addBankAccount(user.id, formData);
      
      toast({
        title: "Success",
        description: "Bank account added successfully"
      });
      
      setFormData({
        account_name: '',
        account_number: '',
        bank_name: '',
        bank_code: '',
        is_default: false
      });
      setShowAddForm(false);
      await loadBankAccounts();
    } catch (error: any) {
      console.error('Error adding bank account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add bank account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    try {
      setIsLoading(true);
      await bankAccountService.deleteBankAccount(accountId);
      
      toast({
        title: "Success",
        description: "Bank account deleted successfully"
      });
      
      await loadBankAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast({
        title: "Error",
        description: "Failed to delete bank account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await bankAccountService.setDefaultBankAccount(user.id, accountId);
      
      toast({
        title: "Success",
        description: "Default bank account updated"
      });
      
      await loadBankAccounts();
    } catch (error) {
      console.error('Error setting default bank account:', error);
      toast({
        title: "Error",
        description: "Failed to update default bank account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nigerianBanks = bankAccountService.getNigerianBanks();

  return (
    <div className="space-y-6">
      {/* Existing Bank Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Bank Accounts
            </span>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No bank accounts added yet
            </p>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{account.account_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.bank_name} - {account.account_number}
                    </p>
                    {account.is_default && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!account.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(account.id)}
                        disabled={isLoading}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Bank Account Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Bank Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="Enter account holder name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="Enter 10-digit account number"
                  required
                  maxLength={10}
                />
              </div>

              <div>
                <Label htmlFor="bank_name">Bank</Label>
                <Select 
                  value={formData.bank_name} 
                  onValueChange={(value) => {
                    const selectedBank = nigerianBanks.find(bank => bank.name === value);
                    setFormData({ 
                      ...formData, 
                      bank_name: value,
                      bank_code: selectedBank?.code || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianBanks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.name}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default || false}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_default">Set as default account</Label>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Adding...' : 'Add Account'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BankAccountForm;
