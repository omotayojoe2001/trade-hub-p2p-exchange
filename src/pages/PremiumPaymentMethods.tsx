import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, CreditCard, Plus, Edit, Trash2, Shield, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

interface PaymentMethod {
  id: string;
  type: 'bank' | 'card' | 'crypto';
  name: string;
  details: string;
  isDefault: boolean;
  isPremium: boolean;
}

const PremiumPaymentMethods = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMethod, setNewMethod] = useState({
    type: 'bank',
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  useEffect(() => {
    loadPaymentMethods();
  }, [user]);

  const loadPaymentMethods = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load real payment methods from database
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Convert bank accounts to payment methods format
      const methods: PaymentMethod[] = (data || []).map((account: any) => ({
        id: account.id,
        type: 'bank' as const,
        name: account.bank_name || 'Bank Account',
        details: `****${account.account_number?.slice(-4)} - ${account.account_holder_name}`,
        isDefault: account.is_default || false,
        isPremium: true
      }));

      setPaymentMethods(methods);

    } catch (error) {
      console.error('Error loading payment methods:', error);
      // Show empty state if no payment methods
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = () => {
    if (newMethod.bankName && newMethod.accountNumber && newMethod.accountName) {
      const method: PaymentMethod = {
        id: Date.now().toString(),
        type: 'bank',
        name: newMethod.bankName,
        details: `****${newMethod.accountNumber.slice(-4)} - ${newMethod.accountName}`,
        isDefault: false,
        isPremium: true
      };
      
      setPaymentMethods([...paymentMethods, method]);
      setNewMethod({ type: 'bank', bankName: '', accountNumber: '', accountName: '' });
      setShowAddForm(false);
      
      toast({
        title: "Payment Method Added",
        description: "Your premium payment method has been added successfully",
      });
    }
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
    
    toast({
      title: "Default Updated",
      description: "Default payment method updated",
    });
  };

  const handleDelete = (id: string) => {
    setPaymentMethods(methods => methods.filter(method => method.id !== id));
    toast({
      title: "Method Removed",
      description: "Payment method has been removed",
    });
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return '🏦';
      case 'card':
        return '💳';
      case 'crypto':
        return '₿';
      default:
        return '💳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-settings" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <CreditCard size={24} className="mr-2 text-yellow-600" />
                Payment Methods
              </h1>
              <p className="text-gray-600 text-sm">Manage your premium payment options</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Premium Benefits */}
        <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
          <div className="flex items-center space-x-3 mb-3">
            <Shield size={24} className="text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">Premium Payment Security</h3>
              <p className="text-sm text-yellow-700">Enhanced protection for all your payment methods</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Star size={16} className="text-yellow-600" />
              <span className="text-yellow-800">Bank-level encryption</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star size={16} className="text-yellow-600" />
              <span className="text-yellow-800">Priority processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star size={16} className="text-yellow-600" />
              <span className="text-yellow-800">24/7 fraud monitoring</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star size={16} className="text-yellow-600" />
              <span className="text-yellow-800">Instant verification</span>
            </div>
          </div>
        </Card>

        {/* Payment Methods List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Payment Methods</h2>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Plus size={16} className="mr-2" />
              Add Method
            </Button>
          </div>

          {paymentMethods.map((method) => (
            <Card key={method.id} className="p-4 bg-white border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getMethodIcon(method.type)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      {method.isDefault && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                      {method.isPremium && (
                        <Crown size={14} className="text-yellow-500" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{method.details}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!method.isDefault && (
                    <Button
                      onClick={() => handleSetDefault(method.id)}
                      variant="outline"
                      size="sm"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    >
                      Set Default
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="p-2">
                    <Edit size={16} className="text-gray-600" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(method.id)}
                    variant="ghost"
                    size="sm"
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add Payment Method Form */}
        {showAddForm && (
          <Card className="p-4 bg-white border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-4">Add Bank Account</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <Input
                  value={newMethod.bankName}
                  onChange={(e) => setNewMethod({...newMethod, bankName: e.target.value})}
                  placeholder="e.g., First Bank"
                  className="border-yellow-200 focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <Input
                  value={newMethod.accountNumber}
                  onChange={(e) => setNewMethod({...newMethod, accountNumber: e.target.value})}
                  placeholder="1234567890"
                  className="border-yellow-200 focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <Input
                  value={newMethod.accountName}
                  onChange={(e) => setNewMethod({...newMethod, accountName: e.target.value})}
                  placeholder="John Smith"
                  className="border-yellow-200 focus:border-yellow-400"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleAddMethod}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Add Method
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  className="border-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Shield size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Security Notice</h4>
              <p className="text-sm text-blue-700 mt-1">
                All payment methods are encrypted and secured with premium-grade protection. 
                We never store your full account details and use tokenization for all transactions.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumPaymentMethods;
