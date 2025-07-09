import React, { useState } from 'react';
import { ArrowLeft, Plus, CreditCard, Building, Star, Edit2, Trash2, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PaymentMethods = () => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: ''
  });
  const [bankData, setBankData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    routingNumber: ''
  });

  const paymentMethods = [
    {
      id: 1,
      type: 'card',
      name: 'Visa **** 1234',
      details: 'Expires 12/25',
      isDefault: true,
      icon: <CreditCard size={20} className="text-blue-600" />
    },
    {
      id: 2,
      type: 'bank',
      name: 'Access Bank',
      details: '**** **** 5678',
      isDefault: false,
      icon: <Building size={20} className="text-green-600" />
    },
    {
      id: 3,
      type: 'card',
      name: 'Mastercard **** 9012',
      details: 'Expires 08/26',
      isDefault: false,
      icon: <CreditCard size={20} className="text-red-600" />
    }
  ];

  const handleCardInputChange = (field: string, value: string) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBankInputChange = (field: string, value: string) => {
    setBankData(prev => ({
      ...prev,
      [field]: value
    }));
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
                <DialogTitle>Add Payment Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => setIsAddingCard(true)}
                  >
                    <CreditCard size={24} className="mb-2" />
                    <span>Add Card</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => setIsAddingBank(true)}
                  >
                    <Building size={24} className="mb-2" />
                    <span>Add Bank</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Payment Methods List */}
        <Card className="bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Payment Methods</h3>
          
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 border">
                    {method.icon}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-semibold text-gray-900">{method.name}</p>
                      {method.isDefault && (
                        <div className="flex items-center ml-2">
                          <Star size={14} className="text-yellow-500 mr-1" />
                          <span className="text-xs text-yellow-600">Default</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{method.details}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Add New Card Form */}
        {isAddingCard && (
          <Card className="bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Card</h3>
              <Button variant="outline" size="sm" onClick={() => setIsAddingCard(false)}>
                Cancel
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <Input
                  value={cardData.cardNumber}
                  onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <Input
                    value={cardData.expiryDate}
                    onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <Input
                    value={cardData.cvv}
                    onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                <Input
                  value={cardData.holderName}
                  onChange={(e) => handleCardInputChange('holderName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <Button className="w-full">
                Add Card
              </Button>
            </div>
          </Card>
        )}

        {/* Add New Bank Form */}
        {isAddingBank && (
          <Card className="bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Bank Account</h3>
              <Button variant="outline" size="sm" onClick={() => setIsAddingBank(false)}>
                Cancel
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <Select onValueChange={(value) => handleBankInputChange('bankName', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="access">Access Bank</SelectItem>
                    <SelectItem value="gtb">GTBank</SelectItem>
                    <SelectItem value="fidelity">Fidelity Bank</SelectItem>
                    <SelectItem value="zenith">Zenith Bank</SelectItem>
                    <SelectItem value="uba">UBA</SelectItem>
                    <SelectItem value="first">First Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <Input
                  value={bankData.accountNumber}
                  onChange={(e) => handleBankInputChange('accountNumber', e.target.value)}
                  placeholder="1234567890"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                <Input
                  value={bankData.accountName}
                  onChange={(e) => handleBankInputChange('accountName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <Button className="w-full">
                Add Bank Account
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