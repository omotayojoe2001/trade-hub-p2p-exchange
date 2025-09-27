import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, DollarSign, Truck, MapPin, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { creditsService, calculatePlatformFeeCredits } from '@/services/creditsService';

const SendNairaGetUSD = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [nairaAmount, setNairaAmount] = useState('');
  const [selectedOption, setSelectedOption] = useState<'pickup' | 'delivery' | null>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const usdRate = 1650; // ₦1,650 per $1
  const usdAmount = nairaAmount ? (parseFloat(nairaAmount) / usdRate).toFixed(2) : '0.00';
  const creditsRequired = nairaAmount ? calculatePlatformFeeCredits(parseFloat(usdAmount)) : 0;

  useEffect(() => {
    if (user) {
      loadUserCredits();
    }
  }, [user]);

  const loadUserCredits = async () => {
    try {
      const credits = await creditsService.getUserCredits(user!.id);
      setUserCredits(credits);
    } catch (error) {
      console.error('Error loading credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!nairaAmount || !selectedOption || !user) return;
    
    // Check if user has enough credits
    if (creditsRequired > userCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsRequired} credits but only have ${userCredits}. Please purchase more credits.`,
        variant: "destructive",
      });
      navigate('/credits/purchase');
      return;
    }
    
    const params = new URLSearchParams({
      nairaAmount,
      usdAmount,
      creditsRequired: creditsRequired.toString(),
      deliveryType: selectedOption
    });
    
    navigate(`/send-naira-details-step?${params}`);
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
                  <span className={`text-sm font-medium ${creditsRequired > userCredits ? 'text-red-600' : 'text-yellow-600'}`}>
                    {creditsRequired} credits
                  </span>
                </div>
                {!loading && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Your credits:</span>
                    <span className={`text-sm font-medium ${userCredits < creditsRequired ? 'text-red-600' : 'text-green-600'}`}>
                      {userCredits} credits
                    </span>
                  </div>
                )}
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

        {!loading && creditsRequired > userCredits && nairaAmount && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Insufficient Credits</p>
                  <p className="text-sm">You need {creditsRequired} credits but only have {userCredits}.</p>
                  <Button 
                    onClick={() => navigate('/credits/purchase')}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white text-sm h-8"
                  >
                    Purchase Credits
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button 
          onClick={handleContinue}
          disabled={!nairaAmount || !selectedOption || parseFloat(nairaAmount) < 1000 || loading || (creditsRequired > userCredits)}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Continue to Payment'}
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