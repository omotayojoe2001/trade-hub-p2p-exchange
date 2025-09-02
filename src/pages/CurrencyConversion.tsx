import React, { useState } from 'react';
import { ArrowLeft, Crown, RefreshCw, DollarSign, TrendingUp, ArrowUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const CurrencyConversion = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [conversionData, setConversionData] = useState({
    fromCurrency: 'NGN',
    toCurrency: 'USD',
    amount: '',
    convertedAmount: ''
  });

  const [exchangeRate] = useState(1550); // NGN to USD rate
  const [isConverting, setIsConverting] = useState(false);

  const currencies = [
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setConversionData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate conversion
    if (field === 'amount' && value) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        let converted;
        if (conversionData.fromCurrency === 'NGN' && conversionData.toCurrency === 'USD') {
          converted = amount / exchangeRate;
        } else if (conversionData.fromCurrency === 'USD' && conversionData.toCurrency === 'NGN') {
          converted = amount * exchangeRate;
        } else {
          converted = amount; // Same currency or other conversions
        }
        
        setConversionData(prev => ({
          ...prev,
          convertedAmount: converted.toFixed(2)
        }));
      }
    }
  };

  const swapCurrencies = () => {
    setConversionData(prev => ({
      ...prev,
      fromCurrency: prev.toCurrency,
      toCurrency: prev.fromCurrency,
      amount: prev.convertedAmount,
      convertedAmount: prev.amount
    }));
  };

  const handleConvert = () => {
    if (!conversionData.amount) {
      toast({
        title: "Missing Amount",
        description: "Please enter an amount to convert",
        variant: "destructive"
      });
      return;
    }

    setIsConverting(true);
    
    // Simulate conversion processing
    setTimeout(() => {
      setIsConverting(false);
      toast({
        title: "Conversion Successful!",
        description: `Converted ${conversionData.amount} ${conversionData.fromCurrency} to ${conversionData.convertedAmount} ${conversionData.toCurrency}`,
      });
      
      // Navigate to confirmation or payment
      navigate('/conversion-confirmation');
    }, 2000);
  };

  const fromCurrency = currencies.find(c => c.code === conversionData.fromCurrency);
  const toCurrency = currencies.find(c => c.code === conversionData.toCurrency);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-dashboard" className="mr-3">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center">
                <RefreshCw size={24} className="mr-2" />
                Currency Conversion
              </h1>
              <p className="text-purple-100 text-sm">Convert Naira to Dollar instantly</p>
            </div>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full">
            <span className="text-xs font-bold">PREMIUM</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Premium Benefits */}
        <Card className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-200">
          <h3 className="font-bold text-purple-900 mb-3 flex items-center">
            <Crown size={20} className="mr-2" />
            Premium Exchange Benefits
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">0.5%</div>
              <div className="text-xs text-purple-600">Best Rates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">Instant</div>
              <div className="text-xs text-purple-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">24/7</div>
              <div className="text-xs text-purple-600">Available</div>
            </div>
          </div>
        </Card>

        {/* Exchange Rate Display */}
        <Card className="p-4 bg-white border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Current Exchange Rate</h3>
            <Button variant="outline" size="sm">
              <RefreshCw size={14} className="mr-1" />
              Refresh
            </Button>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">
                1 USD = ₦{exchangeRate.toLocaleString()}
              </div>
              <div className="text-sm text-purple-600 mt-1">
                Premium rate • Updated 2 minutes ago
              </div>
            </div>
          </div>
        </Card>

        {/* Currency Converter */}
        <Card className="p-4 bg-white border-purple-200">
          <h3 className="font-semibold text-gray-900 mb-4">Convert Currency</h3>
          
          {/* From Currency */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border">
                  <span className="text-2xl mr-2">{fromCurrency?.flag}</span>
                  <div>
                    <div className="font-medium text-sm">{fromCurrency?.code}</div>
                    <div className="text-xs text-gray-500">{fromCurrency?.name}</div>
                  </div>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={conversionData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="flex-1 border-purple-200 focus:border-purple-400"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={swapCurrencies}
                className="rounded-full w-10 h-10 p-0 border-purple-200 hover:bg-purple-50"
              >
                <ArrowUpDown size={16} className="text-purple-600" />
              </Button>
            </div>

            {/* To Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border">
                  <span className="text-2xl mr-2">{toCurrency?.flag}</span>
                  <div>
                    <div className="font-medium text-sm">{toCurrency?.code}</div>
                    <div className="text-xs text-gray-500">{toCurrency?.name}</div>
                  </div>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={conversionData.convertedAmount}
                  readOnly
                  className="flex-1 border-purple-200 bg-purple-50"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Conversion Summary */}
        {conversionData.amount && conversionData.convertedAmount && (
          <Card className="p-4 bg-purple-50 border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3">Conversion Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-purple-700">Amount:</span>
                <span className="font-bold text-purple-900">
                  {fromCurrency?.symbol}{parseFloat(conversionData.amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Exchange Rate:</span>
                <span className="font-bold text-purple-900">
                  1 {conversionData.fromCurrency} = {conversionData.fromCurrency === 'NGN' ? (1/exchangeRate).toFixed(4) : exchangeRate} {conversionData.toCurrency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Premium Fee (0.5%):</span>
                <span className="font-bold text-purple-900">
                  {fromCurrency?.symbol}{(parseFloat(conversionData.amount) * 0.005).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-purple-200 pt-2 flex justify-between">
                <span className="text-purple-700 font-semibold">You'll receive:</span>
                <span className="font-bold text-purple-900 text-lg">
                  {toCurrency?.symbol}{parseFloat(conversionData.convertedAmount).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Convert Button */}
        <Button
          onClick={handleConvert}
          disabled={!conversionData.amount || isConverting}
          className="w-full h-14 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-lg disabled:opacity-50"
        >
          {isConverting ? (
            <>
              <RefreshCw size={20} className="mr-2 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <DollarSign size={20} className="mr-2" />
              Convert Now
            </>
          )}
        </Button>

        {/* Market Trends */}
        <Card className="p-4 bg-white border-purple-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp size={20} className="mr-2" />
            Market Trends
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">24h Change:</span>
              <span className="text-green-600 font-medium">+0.25%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">7d Change:</span>
              <span className="text-red-600 font-medium">-1.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Best Rate Today:</span>
              <span className="text-purple-600 font-medium">₦{(exchangeRate + 5).toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default CurrencyConversion;
