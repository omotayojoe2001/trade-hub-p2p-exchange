import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Upload, CheckCircle, Clock, AlertTriangle, DollarSign, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { bitgoEscrow } from '@/services/bitgoEscrow';
import { creditsService, MIN_CREDIT_PURCHASE } from '@/services/creditsService';
import { cryptoPriceService } from '@/services/cryptoPriceService';

// Credit packages with real-time pricing
const CREDIT_PACKAGES_BASE = [
  { credits: 100, popular: false },
  { credits: 500, popular: true },
  { credits: 1000, popular: false },
  { credits: 2500, popular: false },
  { credits: 5000, popular: false }
];

const CreditsPurchase = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES_BASE[1]);
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [customCredits, setCustomCredits] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH'>('BTC');
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentAddress, setPaymentAddress] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [countdown, setCountdown] = useState(2 * 60 * 60); // 2 hours
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (countdown > 0 && currentStep === 2) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown, currentStep]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPackage = () => {
    if (isCustom && customCredits) {
      const credits = parseInt(customCredits);
      return {
        credits,
        usd: credits * 0.01,
        btc: 0,
        eth: 0
      };
    }
    
    // Find the package with real-time pricing
    const packageWithPricing = creditPackages.find(pkg => pkg.credits === selectedPackage.credits);
    return packageWithPricing || {
      credits: selectedPackage.credits,
      usd: selectedPackage.credits * 0.01,
      btc: 0,
      eth: 0
    };
  };

  // Load real-time crypto prices
  useEffect(() => {
    const loadPrices = async () => {
      setPricesLoading(true);
      try {
        const packagesWithPrices = await Promise.all(
          CREDIT_PACKAGES_BASE.map(async (pkg) => {
            const pricing = await cryptoPriceService.calculateCreditValue(pkg.credits);
            return { ...pkg, ...pricing };
          })
        );
        setCreditPackages(packagesWithPrices);
      } catch (error) {
        console.error('Error loading crypto prices:', error);
        // Fallback to base packages
        setCreditPackages(CREDIT_PACKAGES_BASE.map(pkg => ({
          ...pkg,
          usd: pkg.credits * 0.01,
          btc: (pkg.credits * 0.01) / 100000,
          eth: (pkg.credits * 0.01) / 3500
        })));
      } finally {
        setPricesLoading(false);
      }
    };

    loadPrices();
  }, []);

  const handlePurchaseStart = async () => {
    if (!user) return;

    const currentPackage = getCurrentPackage();
    const validation = creditsService.validatePurchaseAmount(currentPackage.credits);
    
    if (!validation.valid) {
      toast({
        title: "Invalid Amount",
        description: validation.message,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Use real Supabase + BitGo integration with real-time pricing
      const cryptoAmount = await cryptoPriceService.calculateCryptoAmount(currentPackage.credits, selectedCrypto);
      const tradeId = `credit-${Date.now()}`;
      
      // Generate real BitGo payment address
      const address = await bitgoEscrow.generateEscrowAddress(
        tradeId, 
        selectedCrypto, 
        cryptoAmount
      );

      if (!address) {
        throw new Error('Failed to generate payment address');
      }

      // Create purchase record in real database
      const { data: purchase, error } = await supabase
        .from('credit_purchase_transactions')
        .insert({
          user_id: user.id,
          crypto_type: selectedCrypto,
          crypto_amount: cryptoAmount,
          credits_amount: currentPackage.credits,
          payment_address: address,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      setPaymentAddress(address);
      setPurchaseId(purchase.id);
      
      // Generate QR code
      try {
        const qrUrl = await QRCode.toDataURL(address, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrUrl);
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
      }
      
      setCurrentStep(2);

      toast({
        title: "Real Payment Address Generated",
        description: `Send exactly ${cryptoAmount.toFixed(8)} ${selectedCrypto} to this real BitGo address`,
      });

    } catch (error) {
      console.error('Error starting purchase:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate payment address",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPaymentProof(event.target.files[0]);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentProof && !transactionHash) {
      toast({
        title: "Proof Required",
        description: "Please upload payment proof or enter transaction hash",
        variant: "destructive"
      });
      return;
    }

    try {
      // Real payment processing with Supabase
      let proofUrl = '';
      
      if (paymentProof) {
        // Upload proof to real Supabase storage
        const fileExt = paymentProof.name.split('.').pop();
        const fileName = `${user?.id}/credit-payment-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('profiles')
          .upload(fileName, paymentProof);

        if (error) {
          console.error('Storage error:', error);
          throw new Error(`Failed to upload proof: ${error.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(fileName);
        
        proofUrl = urlData.publicUrl;
      }

      // Update purchase record in real database
      const { error: updateError } = await supabase
        .from('credit_purchase_transactions')
        .update({
          status: 'paid',
          payment_proof_url: proofUrl
        })
        .eq('id', purchaseId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`Failed to update purchase: ${updateError.message}`);
      }

      setCurrentStep(3);

      toast({
        title: "Payment Submitted to Real System",
        description: "Your payment proof has been submitted. Credits will be added once payment is confirmed on blockchain.",
      });

    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: "Error",
        description: "Failed to submit payment proof",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Purchase Credits</h1>
        <div className="w-10" />
      </div>

      {/* Progress Bar */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step ? '✓' : step}
              </div>
              {step < 3 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  currentStep > step ? 'bg-blue-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>Select</span>
          <span>Payment</span>
          <span>Complete</span>
        </div>
      </div>

      <div className="p-4">
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Credit Value Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <DollarSign size={20} />
                  <span className="font-medium">1 Credit = $0.01 USD</span>
                  <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                    Live System
                  </span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Use credits for cash pickup (50 credits), delivery (100 credits), and premium features
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Real BitGo addresses • Blockchain verification • Manual confirmation required
                </p>
              </CardContent>
            </Card>

            {/* Package Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Credit Package</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricesLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading real-time prices...
                  </div>
                ) : (
                  creditPackages.map((pkg) => (
                  <div
                    key={pkg.credits}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      !isCustom && selectedPackage.credits === pkg.credits
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setIsCustom(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{pkg.credits} Credits</span>
                          <span className="text-green-600 font-medium">${pkg.usd}</span>
                          {pkg.popular && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {pkg.btc.toFixed(8)} BTC • {pkg.eth.toFixed(6)} ETH
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        !isCustom && selectedPackage.credits === pkg.credits
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {!isCustom && selectedPackage.credits === pkg.credits && (
                          <div className="w-full h-full rounded-full bg-white scale-50" />
                        )}
                      </div>
                    </div>
                  </div>
                  ))
                )}
                
                {/* Custom Amount */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isCustom
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setIsCustom(true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">Custom Amount</span>
                        <span className="text-blue-600 text-sm">(Min: 10 credits)</span>
                      </div>
                      {isCustom && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Enter credits"
                            value={customCredits}
                            onChange={(e) => setCustomCredits(e.target.value)}
                            min="10"
                            className="w-32"
                          />
                          <span className="text-sm text-gray-600">
                            {customCredits && parseInt(customCredits) >= 10 && (
                              <span className="text-green-600">
                                = ${(parseInt(customCredits) * 0.01).toFixed(2)}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isCustom
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {isCustom && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Crypto Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 border rounded-lg cursor-pointer text-center ${
                      selectedCrypto === 'BTC'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCrypto('BTC')}
                  >
                    <div className="font-semibold">Bitcoin</div>
                    <div className="text-sm text-gray-600">
                      {getCurrentPackage().btc?.toFixed(8) || '0.00000000'} BTC
                    </div>
                  </div>
                  <div
                    className={`p-4 border rounded-lg cursor-pointer text-center ${
                      selectedCrypto === 'ETH'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCrypto('ETH')}
                  >
                    <div className="font-semibold">Ethereum</div>
                    <div className="text-sm text-gray-600">
                      {getCurrentPackage().eth?.toFixed(6) || '0.000000'} ETH
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handlePurchaseStart} 
              className="w-full" 
              size="lg"
              disabled={loading || (isCustom && (!customCredits || parseInt(customCredits) < MIN_CREDIT_PURCHASE))}
            >
              {loading ? 'Generating...' : 'Generate Payment Address'}
            </Button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Timer */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600 mr-2" />
                <span className="text-orange-800 font-semibold">
                  Time Remaining: {formatTime(countdown)}
                </span>
              </div>
            </div>

            {/* Payment Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Send Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-800 mb-4">
                    Send exactly <strong>{selectedCrypto === 'BTC' ? (getCurrentPackage().btc?.toFixed(8) || '0.00000000') : (getCurrentPackage().eth?.toFixed(6) || '0.000000')} {selectedCrypto}</strong> to:
                  </div>
                  
                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48" />
                        <div className="text-center mt-2">
                          <div className="flex items-center justify-center text-gray-600 text-xs">
                            <QrCode size={12} className="mr-1" />
                            Scan to pay
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Address */}
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 bg-white rounded font-mono text-sm break-all">
                      {paymentAddress}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(paymentAddress)}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <div className="font-medium mb-1">Important:</div>
                      <ul className="space-y-1">
                        <li>• Send the exact amount shown above</li>
                        <li>• Payment expires in 2 hours</li>
                        <li>• Credits will be added after confirmation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Proof */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Payment Proof</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="payment-proof">Upload Screenshot (Optional)</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentProofUpload}
                    className="hidden"
                    id="payment-proof"
                  />
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('payment-proof')?.click()}
                      className="w-full"
                    >
                      <Upload size={16} className="mr-2" />
                      {paymentProof ? paymentProof.name : 'Choose File'}
                    </Button>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500">OR</div>

                <div>
                  <Label htmlFor="tx-hash">Transaction Hash</Label>
                  <Input
                    id="tx-hash"
                    placeholder="Enter transaction hash"
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSubmitPayment}
                  disabled={!paymentProof && !transactionHash}
                  className="w-full"
                  size="lg"
                >
                  Submit Payment Proof
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Payment Submitted!</h2>
                <p className="text-gray-600 mb-4">
                  Your payment is being verified. Credits will be added to your account once confirmed.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-800">
                    <div className="font-medium mb-2">Purchase Details:</div>
                    <div>Credits: {getCurrentPackage().credits}</div>
                    <div>USD Value: ${getCurrentPackage().usd?.toFixed(2) || '0.00'}</div>
                    <div>Amount: {selectedCrypto === 'BTC' ? (getCurrentPackage().btc?.toFixed(8) || '0.00000000') : (getCurrentPackage().eth?.toFixed(6) || '0.000000')} {selectedCrypto}</div>
                    <div>Status: Pending Confirmation</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => navigate('/credits-history')}>
                View History
              </Button>
              <Button onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditsPurchase;