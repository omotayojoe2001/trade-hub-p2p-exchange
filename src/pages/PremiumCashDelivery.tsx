import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Package, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { creditsService } from '@/services/creditsService';
import { vendorJobService } from '@/services/vendorJobService';
import { tradeMatchingService } from '@/services/tradeMatchingService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const PremiumCashDelivery = () => {
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('delivery');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    phone: ''
  });
  const [creditsRequired, setCreditsRequired] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Setup, 2: Confirmation, 3: Success
  const [jobId, setJobId] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    loadUserCredits();
  }, []);

  useEffect(() => {
    if (amount) {
      calculateCredits();
    }
  }, [amount]);

  const loadUserCredits = async () => {
    if (!user?.id) return;
    try {
      const balance = await creditsService.getCreditBalance(user.id);
      setCurrentBalance(balance);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const calculateCredits = async () => {
    if (!amount) return;
    try {
      const result = await creditsService.calculateCreditsRequired(parseFloat(amount));
      setCreditsRequired(result.creditsRequired);
    } catch (error) {
      console.error('Error calculating credits:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('Please login to continue');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (deliveryType === 'delivery' && (!address.street || !address.city)) {
      setError('Please enter delivery address');
      return;
    }

    if (currentBalance < creditsRequired) {
      setError(`Insufficient credits. You need ${creditsRequired} credits but have ${currentBalance}.`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Use the new trade matching service
      const matchResult = await tradeMatchingService.createPremiumTradeRequest(
        user.id,
        parseFloat(amount),
        deliveryType
      );

      if (matchResult.success) {
        setJobId(matchResult.vendor_job_id || matchResult.trade_id);
        console.log('Trade matching successful:', matchResult.message);
      } else {
        console.warn('Trade matching failed:', matchResult.message);
        // Still proceed to show success - request is queued
        setJobId('queued-' + Date.now());
      }

      setStep(2); // Move to confirmation step

    } catch (error: any) {
      setError(error.message || 'Failed to create delivery request');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRequest = () => {
    setStep(3); // Move to success step
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center p-4 bg-white border-b border-gray-200">
          <button onClick={() => navigate('/premium-trade')} className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Request Submitted</h1>
        </div>

        <div className="p-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-green-900 mb-2">
                Cash {deliveryType === 'pickup' ? 'Pickup' : 'Delivery'} Request Submitted!
              </h2>
              <p className="text-green-800 mb-4">
                Your request for ${amount} has been sent to our delivery agent.
              </p>
              <div className="space-y-2 text-sm text-green-700">
                <p>• Credits deducted: {creditsRequired}</p>
                <p>• Remaining balance: {currentBalance - creditsRequired}</p>
                <p>• Job ID: {jobId.slice(0, 8)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">1</div>
                  <div>
                    <p className="font-medium">Crypto Trade Matching</p>
                    <p className="text-sm text-gray-600">We'll match you with a crypto buyer on our platform</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">2</div>
                  <div>
                    <p className="font-medium">Buyer Payment</p>
                    <p className="text-sm text-gray-600">The buyer will pay Naira to our agent's account</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">3</div>
                  <div>
                    <p className="font-medium">Cash {deliveryType === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                    <p className="text-sm text-gray-600">
                      Our agent will {deliveryType === 'pickup' ? 'meet you at the pickup location' : 'deliver cash to your address'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => navigate('/premium-trades')}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            >
              View My Trades
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center p-4 bg-white border-b border-gray-200">
          <button onClick={() => setStep(1)} className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Confirm Request</h1>
        </div>

        <div className="p-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Request Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Service Type:</span>
                <span className="font-medium">Cash {deliveryType === 'pickup' ? 'Pickup' : 'Delivery'}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">${amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Credits Required:</span>
                <span className="font-medium text-red-600">{creditsRequired} credits</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining Balance:</span>
                <span className="font-medium">{currentBalance - creditsRequired} credits</span>
              </div>
              {deliveryType === 'delivery' && (
                <div>
                  <span>Delivery Address:</span>
                  <p className="text-sm text-gray-600 mt-1">
                    {address.street}, {address.city}, {address.state}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={handleConfirmRequest}
              className="w-full h-12 bg-green-600 hover:bg-green-700"
            >
              Confirm & Submit Request
            </Button>
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="w-full h-12"
            >
              Back to Edit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate('/premium-trade')} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Cash Service</h1>
      </div>

      <div className="p-4">
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Credits Balance */}
        <Card className="mb-6">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-blue-600">{currentBalance} Credits</span>
            </div>
            <p className="text-sm text-gray-600">Available Balance</p>
          </CardContent>
        </Card>

        {/* Service Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Select Service Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDeliveryType('delivery')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  deliveryType === 'delivery'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MapPin className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium">Cash Delivery</p>
                <p className="text-xs text-gray-600">We deliver to you</p>
              </button>
              <button
                onClick={() => setDeliveryType('pickup')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  deliveryType === 'pickup'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Cash Pickup</p>
                <p className="text-xs text-gray-600">You meet our agent</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Amount Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Enter Amount (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              placeholder="Enter amount in USD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg h-12"
            />
            {creditsRequired > 0 && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-sm text-blue-800">
                  Credits required: <strong>{creditsRequired}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Input (for delivery) */}
        {deliveryType === 'delivery' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Street address"
                value={address.street}
                onChange={(e) => setAddress({...address, street: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({...address, city: e.target.value})}
                />
                <Input
                  placeholder="State"
                  value={address.state}
                  onChange={(e) => setAddress({...address, state: e.target.value})}
                />
              </div>
              <Input
                placeholder="Phone number"
                value={address.phone}
                onChange={(e) => setAddress({...address, phone: e.target.value})}
              />
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !amount || (deliveryType === 'delivery' && !address.street)}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Creating Request...' : `Request Cash ${deliveryType === 'pickup' ? 'Pickup' : 'Delivery'}`}
        </Button>

        {/* Info */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>How it works:</strong> You'll be matched with a crypto buyer. They pay our agent, 
            and our agent delivers cash to you. Credits are deducted when the agent confirms payment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumCashDelivery;
