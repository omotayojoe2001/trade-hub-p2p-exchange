import React, { useState } from 'react';
import { ArrowLeft, DollarSign, Truck, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SellForCash = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<'pickup' | 'delivery' | null>(null);

  const handleContinue = () => {
    if (selectedOption === 'pickup') {
      navigate('/sell-crypto-cash-pickup');
    } else if (selectedOption === 'delivery') {
      navigate('/sell-crypto-cash-delivery');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Sell Crypto → Get USD Cash</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <DollarSign className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm text-gray-600">Credits required for this service</span>
          </div>
          <p className="text-gray-700">Choose how you want to receive your USD cash:</p>
        </div>

        <div className="space-y-4 mb-6">
          <Card 
            className={`cursor-pointer transition-all ${selectedOption === 'pickup' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
            onClick={() => setSelectedOption('pickup')}
          >
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <MapPin size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Cash Pickup</h3>
                  <p className="text-sm text-gray-600">Pick up cash from our agent's location</p>
                  <p className="text-xs text-green-600 mt-1">Lower fees • Available locations</p>
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
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Truck size={24} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Cash Delivery</h3>
                  <p className="text-sm text-gray-600">Get cash delivered to your address</p>
                  <p className="text-xs text-blue-600 mt-1">Convenient • Same day delivery</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-yellow-800 mb-2">Credits Required</h4>
          <p className="text-sm text-yellow-700">
            This service requires credits. Credits are deducted based on transaction amount:
          </p>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• $100 = 10 credits</li>
            <li>• $200 = 20 credits</li>
            <li>• $500 = 50 credits</li>
          </ul>
        </div>

        <Button 
          onClick={handleContinue}
          disabled={!selectedOption}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default SellForCash;