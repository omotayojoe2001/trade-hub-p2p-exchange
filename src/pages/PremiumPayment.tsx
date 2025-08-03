import React, { useState } from 'react';
import { ArrowLeft, Crown, Shield, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { PaymentForm } from "@/components/PaymentForm";

const PremiumPayment = () => {
  const navigate = useNavigate();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    // Simulate payment processing
    setTimeout(() => {
      navigate('/premium-dashboard');
    }, 3000);
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-sm w-full text-center bg-white">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <Crown size={24} className="text-yellow-500 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Premium!</h2>
          <p className="text-gray-600 mb-4">
            Your subscription is now active. Redirecting to your premium dashboard...
          </p>
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-2">
          <Crown size={20} className="text-yellow-500" />
          <h1 className="text-lg font-semibold text-gray-900">Premium Payment</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Subscription Summary */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Premium Annual Plan</h2>
              <p className="text-purple-100">Unlock all premium features</p>
            </div>
            <Crown size={32} className="text-yellow-300" />
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">$99.99</span>
            <span className="text-purple-100 ml-2">/year</span>
          </div>
        </Card>

        {/* Features Included */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">What's Included:</h3>
          <div className="space-y-3">
            {[
              'Priority merchant matching',
              'Instant withdrawals',
              '24/7 premium support',
              'Advanced trading analytics',
              'Lower transaction fees',
              'Exclusive trading opportunities'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Form */}
        <PaymentForm className="mb-6" />

        {/* Security Notice */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-start space-x-3">
            <Shield size={20} className="text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Secure Payment</h4>
              <p className="text-sm text-gray-600 mt-1">
                Your payment is processed securely through Stripe. We never store your payment information.
              </p>
            </div>
          </div>
        </Card>

        {/* Demo Button */}
        <Button
          onClick={handlePaymentSuccess}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
        >
          🎬 Demo: Simulate Successful Payment
        </Button>
      </div>
    </div>
  );
};

export default PremiumPayment;