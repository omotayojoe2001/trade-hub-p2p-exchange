import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Star, Zap, Shield, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { creditsService, CreditBundle } from '@/services/creditsService';
import { useAuth } from '@/hooks/useAuth';

const CreditsPurchase = () => {
  const [bundles, setBundles] = useState<CreditBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<CreditBundle | null>(null);
  const [customCredits, setCustomCredits] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load credit pricing and bundles
      const pricing = await creditsService.getCreditPricing();
      setBundles(pricing.bundles);

      // Load current balance
      if (user?.id) {
        const balance = await creditsService.getCreditBalance(user.id);
        setCurrentBalance(balance);
      }

      // Load bank details
      const bankInfo = await creditsService.getVendorBankDetails();
      setBankDetails(bankInfo);

    } catch (error: any) {
      setError(error.message || 'Failed to load credit information');
    } finally {
      setLoading(false);
    }
  };

  const handleBundleSelect = (bundle: CreditBundle) => {
    setSelectedBundle(bundle);
    setCustomCredits('');
    setShowPaymentForm(true);
  };

  const handleCustomCreditsChange = (value: string) => {
    setCustomCredits(value);
    if (value && bundles.length > 0) {
      const credits = parseInt(value);
      const pricePerCredit = bundles[0].price_naira / bundles[0].credits;
      setSelectedBundle({
        credits,
        price_naira: credits * pricePerCredit,
        usd_value: credits * 10, // Assuming $10 per credit
      });
    } else {
      setSelectedBundle(null);
    }
    setShowPaymentForm(!!value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProof(file);
    }
  };

  const handlePurchase = async () => {
    if (!selectedBundle || !user?.id) return;

    try {
      setPurchasing(true);
      setError('');

      // Upload payment proof if provided
      let proofUrl = '';
      if (paymentProof) {
        // In a real app, upload to storage service
        // For now, we'll just use a placeholder
        proofUrl = `proof_${Date.now()}_${paymentProof.name}`;
      }

      await creditsService.purchaseCredits(user.id, {
        credits_amount: selectedBundle.credits,
        payment_reference: paymentReference,
        payment_proof_url: proofUrl,
      });

      // Show success message and redirect
      alert('Credit purchase request submitted! Your credits will be added once payment is confirmed.');
      navigate('/profile');

    } catch (error: any) {
      setError(error.message || 'Failed to purchase credits');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading credit packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">
            Purchase Credits
          </h1>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Balance */}
        <Card className="mb-6">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {currentBalance}
            </div>
            <div className="text-gray-600">Current Credits Balance</div>
            <div className="text-sm text-gray-500 mt-1">
              Worth ${currentBalance * 10} in delivery services
            </div>
          </CardContent>
        </Card>

        {/* Credit Bundles */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Choose Credit Package
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundles.map((bundle, index) => (
              <Card 
                key={index}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedBundle?.credits === bundle.credits 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : ''
                }`}
                onClick={() => handleBundleSelect(bundle)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl font-bold text-gray-900">
                      {bundle.credits} Credits
                    </div>
                    {bundle.popular && (
                      <Badge className="bg-green-100 text-green-800">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-blue-600 mb-2">
                    ₦{bundle.price_naira.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Worth ${bundle.usd_value} in services
                  </div>
                  {bundle.savings && (
                    <div className="text-sm text-green-600 font-medium">
                      Save ₦{bundle.savings.toLocaleString()}!
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Custom Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Enter number of credits"
                  value={customCredits}
                  onChange={(e) => handleCustomCreditsChange(e.target.value)}
                  min="1"
                />
              </div>
              <div className="text-sm text-gray-600">
                {customCredits && (
                  <span>
                    ≈ ₦{(parseInt(customCredits) * 1500).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        {showPaymentForm && selectedBundle && bankDetails && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bank Details */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Transfer to this account:
                </h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Bank:</strong> {bankDetails.bank_name}</div>
                  <div><strong>Account Number:</strong> {bankDetails.account_number}</div>
                  <div><strong>Account Name:</strong> {bankDetails.account_name}</div>
                  <div><strong>Amount:</strong> ₦{selectedBundle.price_naira.toLocaleString()}</div>
                </div>
              </div>

              {/* Payment Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Reference (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="Enter transaction reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>

              {/* Payment Proof Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Proof (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="payment-proof"
                  />
                  <label htmlFor="payment-proof" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {paymentProof ? paymentProof.name : 'Upload payment screenshot'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Purchase Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Purchase Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Credits:</span>
                    <span>{selectedBundle.credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Value:</span>
                    <span>${selectedBundle.usd_value}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total Amount:</span>
                    <span>₦{selectedBundle.price_naira.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {purchasing ? 'Processing...' : 'Confirm Purchase'}
              </Button>

              {/* Security Notice */}
              <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Secure Transaction</p>
                  <p>Your credits will be added to your account once payment is verified by our team.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How Credits Work */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Credits Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
                <p>1 credit = $10 worth of cash pickup/delivery services</p>
              </div>
              <div className="flex items-start space-x-2">
                <CreditCard className="w-4 h-4 text-blue-600 mt-0.5" />
                <p>Credits are deducted when vendor confirms payment receipt</p>
              </div>
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                <p>Unused credits never expire and can be used anytime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreditsPurchase;
