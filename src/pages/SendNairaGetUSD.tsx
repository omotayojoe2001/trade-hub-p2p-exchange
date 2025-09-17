import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, DollarSign, Truck, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const SendNairaGetUSD = () => {
  const navigate = useNavigate();
  const [nairaAmount, setNairaAmount] = useState('');
  const [selectedOption, setSelectedOption] = useState<'pickup' | 'delivery' | null>(null);
  
  const usdRate = 1650; // ₦1,650 per $1
  const usdAmount = nairaAmount ? (parseFloat(nairaAmount) / usdRate).toFixed(2) : '0.00';
  const creditsRequired = nairaAmount ? Math.ceil(parseFloat(usdAmount) / 10) : 0;

  const handleContinue = () => {
    if (!nairaAmount || !selectedOption) return;
    
    const params = new URLSearchParams({
      nairaAmount,
      usdAmount,
      creditsRequired: creditsRequired.toString(),
      deliveryType: selectedOption
    });
    
    navigate(`/send-naira-payment-step?${params}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Send Naira → Get USD Cash</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <RefreshCw className="w-5 h-5 text-purple-500 mr-2" />
            <span className="text-sm text-gray-600">Direct currency conversion</span>
          </div>
          <p className="text-gray-700">Convert your Naira directly to USD cash</p>
        </div>

        {/* Amount Input */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount in Naira
                </label>
                <Input
                  type="number"
                  value={nairaAmount}
                  onChange={(e) => setNairaAmount(e.target.value)}
                  placeholder="Enter amount in ₦"
                  className="text-lg"
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">You will receive:</span>
                  <span className="text-lg font-semibold text-green-600">${usdAmount} USD</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Rate:</span>
                  <span className="text-sm text-gray-900">₦{usdRate.toLocaleString()} per $1</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Credits required:</span>
                  <span className="text-sm font-medium text-yellow-600">{creditsRequired} credits</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Options */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">How do you want to receive your USD?</h3>
          
          <div className="space-y-3">
            <Card 
              className={`cursor-pointer transition-all ${selectedOption === 'pickup' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
              onClick={() => setSelectedOption('pickup')}
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <MapPin size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Cash Pickup</h4>
                    <p className="text-sm text-gray-600">Pick up from agent location</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${selectedOption === 'delivery' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
              onClick={() => setSelectedOption('delivery')}
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <Truck size={20} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Cash Delivery</h4>
                    <p className="text-sm text-gray-600">Delivered to your address</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Pay Naira directly to our vendor's account</li>
            <li>2. Vendor confirms payment</li>
            <li>3. Vendor delivers USD cash to you</li>
            <li>4. No escrow needed - direct conversion</li>
          </ol>
        </div>

        <Button 
          onClick={handleContinue}
          disabled={!nairaAmount || !selectedOption || parseFloat(nairaAmount) < 1000}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
        >
          Continue to Payment
        </Button>
        
        {parseFloat(nairaAmount) > 0 && parseFloat(nairaAmount) < 1000 && (
          <p className="text-sm text-red-600 text-center mt-2">
            Minimum amount is ₦1,000
          </p>
        )}
      </div>
    </div>
  );
};

export default SendNairaGetUSD;