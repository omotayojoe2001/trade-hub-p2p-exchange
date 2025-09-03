import React, { useState } from 'react';
import { ArrowLeft, Crown, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { realTimeTradeRequestService } from '@/services/supabaseService';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const CreateTradeRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trade_type: 'buy' as 'buy' | 'sell',
    coin_type: 'BTC',
    amount: '',
    rate: '',
    payment_method: 'bank_transfer',
    notes: ''
  });

  const cryptoOptions = [
    { value: 'BTC', label: 'Bitcoin (BTC)', rate: 150000000 },
    { value: 'ETH', label: 'Ethereum (ETH)', rate: 5350000 },
    { value: 'USDT', label: 'Tether (USDT)', rate: 1550 },
    { value: 'BNB', label: 'Binance Coin (BNB)', rate: 850000 },
    { value: 'ADA', label: 'Cardano (ADA)', rate: 1200 }
  ];

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash_delivery', label: 'Cash Delivery (Premium)' },
    { value: 'cash_pickup', label: 'Cash Pickup (Premium)' }
  ];

  const selectedCrypto = cryptoOptions.find(c => c.value === formData.coin_type);
  const calculatedNairaAmount = formData.amount && formData.rate 
    ? parseFloat(formData.amount) * parseFloat(formData.rate)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.rate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const request = await realTimeTradeRequestService.createTradeRequest({
        trade_type: formData.trade_type,
        coin_type: formData.coin_type,
        amount: parseFloat(formData.amount),
        naira_amount: calculatedNairaAmount,
        rate: parseFloat(formData.rate),
        payment_method: formData.payment_method,
        notes: formData.notes || undefined
      });

      toast({
        title: "Trade Request Created!",
        description: `Your ${formData.trade_type} request for ${formData.amount} ${formData.coin_type} has been posted`,
      });

      // Navigate back to trade requests
      navigate('/premium-trade-requests');
      
    } catch (error) {
      console.error('Error creating trade request:', error);
      toast({
        title: "Error",
        description: "Failed to create trade request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Crown size={24} className="mr-2 text-yellow-600" />
                Create Trade Request
              </h1>
              <p className="text-gray-600 text-sm">Set your own rates and terms</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trade Type Selection */}
          <Card className="p-4 bg-white border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Trade Type</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, trade_type: 'buy' }))}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.trade_type === 'buy'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <TrendingUp size={24} className={`mx-auto mb-2 ${
                  formData.trade_type === 'buy' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <div className="font-medium text-gray-900">Buy Crypto</div>
                <div className="text-sm text-gray-600">I want to buy cryptocurrency</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, trade_type: 'sell' }))}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.trade_type === 'sell'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <TrendingDown size={24} className={`mx-auto mb-2 ${
                  formData.trade_type === 'sell' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="font-medium text-gray-900">Sell Crypto</div>
                <div className="text-sm text-gray-600">I want to sell cryptocurrency</div>
              </button>
            </div>
          </Card>

          {/* Crypto Selection */}
          <Card className="p-4 bg-white border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Cryptocurrency</h3>
            <Select value={formData.coin_type} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, coin_type: value, rate: cryptoOptions.find(c => c.value === value)?.rate.toString() || '' }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cryptoOptions.map(crypto => (
                  <SelectItem key={crypto.value} value={crypto.value}>
                    {crypto.label} - ₦{crypto.rate.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Amount and Rate */}
          <Card className="p-4 bg-white border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Amount & Rate</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ({formData.coin_type})
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder={`Enter ${formData.coin_type} amount`}
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate (₦ per {formData.coin_type})
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="Enter your rate"
                  value={formData.rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                  required
                />
                {selectedCrypto && (
                  <p className="text-sm text-gray-600 mt-1">
                    Market rate: ₦{selectedCrypto.rate.toLocaleString()}
                  </p>
                )}
              </div>
              {calculatedNairaAmount > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Total Value</div>
                  <div className="text-lg font-semibold text-gray-900">
                    ₦{calculatedNairaAmount.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="p-4 bg-white border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
            <Select value={formData.payment_method} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, payment_method: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Notes */}
          <Card className="p-4 bg-white border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h3>
            <Textarea
              placeholder="Add any special instructions or requirements..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Creating Request...
              </>
            ) : (
              <>
                <Crown size={16} className="mr-2" />
                Create Trade Request
              </>
            )}
          </Button>
        </form>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default CreateTradeRequest;
