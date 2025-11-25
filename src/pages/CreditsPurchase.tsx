import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Upload, CheckCircle, Clock, AlertTriangle, DollarSign, QrCode, Bitcoin, Coins } from 'lucide-react';
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
import CreditReceiptGenerator from '@/components/CreditReceiptGenerator';
import { InAppPhotoPicker } from '@/components/ui/InAppPhotoPicker';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import SessionRecoveryModal from '@/components/SessionRecoveryModal';

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
  const { saveSession, getActiveSessionsByType, removeSession } = useSessionPersistence();

  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES_BASE[1]);
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [customCredits, setCustomCredits] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'USDT'>('BTC');
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentAddress, setPaymentAddress] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [countdown, setCountdown] = useState(2 * 60 * 60); // 2 hours
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Disabled countdown timer to prevent scroll interference
  // useEffect(() => {
  //   if (countdown > 0 && currentStep === 2) {
  //     const timer = setInterval(() => {
  //       setCountdown(prev => prev - 1);
  //     }, 1000);
  //     return () => clearInterval(timer);
  //   }
  // }, [countdown, currentStep]);

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

  // Initialize component and restore session if exists
  React.useEffect(() => {
    // Check for existing session on page load
    const savedSession = sessionStorage.getItem('active_credit_purchase');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        // Only restore if session has payment address AND is not completed (step 3)
        if (sessionData.data?.paymentAddress && sessionData.step < 3) {
          console.log('🔄 Restoring active session on page load:', sessionData);
          
          setSessionId(sessionData.id);
          setCurrentStep(sessionData.step);
          setSelectedPackage(sessionData.data.selectedPackage || CREDIT_PACKAGES_BASE[1]);
          setCustomCredits(sessionData.data.customCredits || '');
          setIsCustom(sessionData.data.isCustom || false);
          setSelectedCrypto(sessionData.data.selectedCrypto || 'BTC');
          setPaymentAddress(sessionData.data.paymentAddress || '');
          setPurchaseId(sessionData.data.purchaseId || '');
          setTransactionHash(sessionData.data.transactionHash || '');
          
          // Regenerate QR code
          if (sessionData.data.paymentAddress) {
            QRCode.toDataURL(sessionData.data.paymentAddress, {
              width: 200,
              margin: 2,
              color: { dark: '#000000', light: '#FFFFFF' }
            }).then(setQrCodeUrl).catch(console.error);
          }
        } else if (sessionData.step >= 3) {
          // Clear completed sessions
          console.log('🗑️ Clearing completed session');
          sessionStorage.removeItem('active_credit_purchase');
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        sessionStorage.removeItem('active_credit_purchase');
      }
    }
    
    setCreditPackages(CREDIT_PACKAGES_BASE.map(pkg => ({
      ...pkg,
      usd: pkg.credits * 0.01,
      btc: (pkg.credits * 0.01) / 100000,
      usdt: pkg.credits * 0.01
    })));
    setPricesLoading(false);
  }, []);

  // ONLY save sessions when user has payment address (step 2+)
  const savePaymentSession = () => {
    if (currentStep >= 2 && sessionId && paymentAddress) {
      const sessionData = {
        id: sessionId,
        type: 'credit_purchase' as const,
        step: currentStep,
        data: {
          selectedPackage,
          customCredits,
          isCustom,
          selectedCrypto,
          paymentAddress,
          purchaseId,
          transactionHash,
          timestamp: Date.now()
        }
      };
      
      saveSession(sessionData);
      sessionStorage.setItem('active_credit_purchase', JSON.stringify(sessionData));
      console.log('💾 Payment session saved:', sessionData);
    }
  };
  
  // Force new address generation for each credit purchase
  const generateUniqueTradeId = () => {
    return `credit-${Date.now()}-${user?.id || 'anon'}-${Math.random().toString(36).substr(2, 9)}`;
  };
  
  // Save session when user switches tabs or minimizes
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentStep >= 2 && paymentAddress) {
        savePaymentSession();
        console.log('💾 Session saved on tab switch');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentStep, paymentAddress, sessionId, selectedPackage, customCredits, isCustom, selectedCrypto, purchaseId, transactionHash]);

  const handlePurchaseStart = async () => {
    console.log('🚀 Purchase start clicked');
    
    if (!user) {
      console.error('❌ No user found');
      return;
    }

    const currentPackage = getCurrentPackage();
    console.log('📦 Current package:', currentPackage);
    
    const validation = creditsService.validatePurchaseAmount(currentPackage.credits);
    console.log('✅ Validation result:', validation);
    
    if (!validation.valid) {
      toast({
        title: "Invalid Amount",
        description: validation.message,
        variant: "destructive"
      });
      return;
    }

    // Generate session ID - DON'T save until payment address exists
    const newSessionId = `credit_${Date.now()}_${user.id}`;
    setSessionId(newSessionId);
    console.log('🆔 Generated session ID:', newSessionId);

    setLoading(true);
    console.log('⏳ Loading started');
    
    try {
      // Use real Supabase + BitGo integration with real-time pricing
      console.log('💰 Calculating crypto amount...');
      const cryptoAmount = await cryptoPriceService.calculateCryptoAmount(currentPackage.credits, selectedCrypto);
      const tradeId = generateUniqueTradeId();
      
      // Debug: Log the selected crypto type
      console.log('🔍 Selected crypto for address generation:', selectedCrypto);
      console.log('🔍 Crypto amount:', cryptoAmount);
      console.log('🔍 Unique trade ID:', tradeId);
      console.log('🔍 Current package credits:', currentPackage.credits);
      
      // Generate payment address (real BitGo for BTC, mock for others)
      console.log('🏦 Generating escrow address...');
      const address = await bitgoEscrow.generateEscrowAddress(
        tradeId, 
        selectedCrypto, 
        cryptoAmount
      );
      console.log('🏦 Generated address:', address);

      if (!address) {
        console.error('❌ No address returned from BitGo service');
        throw new Error('Failed to generate payment address');
      }

      // Create purchase record in real database
      console.log('💾 Creating database record...');
      const { data: purchase, error } = await supabase
        .from('credit_purchase_transactions')
        .insert({
          user_id: user.id,
          credits_amount: currentPackage.credits,
          price_paid_naira: currentPackage.usd * 1650, // Convert USD to NGN
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('💾 Database record created:', purchase);

      console.log('🔄 Setting payment state...');
      setPaymentAddress(address);
      setPurchaseId(purchase.id);
      
      // Generate QR code
      console.log('📱 Generating QR code...');
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
        console.log('📱 QR code generated successfully');
      } catch (qrError) {
        console.error('❌ Error generating QR code:', qrError);
      }
      
      console.log('➡️ Moving to step 2');
      setCurrentStep(2);

      // Save session immediately after address generation
      console.log('💾 Saving payment session...');
      savePaymentSession();

      toast({
        title: `${selectedCrypto} Payment Address Generated`,
        description: `Send exactly ${cryptoAmount.toFixed(8)} ${selectedCrypto} to this ${selectedCrypto === 'BTC' ? 'real BitGo' : 'mock'} address`,
      });

    } catch (error) {
      console.error('❌ Error starting purchase:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate payment address",
        variant: "destructive"
      });
    } finally {
      console.log('✅ Loading finished');
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
      
      // CLEAR SESSION - address is now consumed
      sessionStorage.removeItem('active_credit_purchase');
      if (sessionId) {
        removeSession(sessionId);
      }
      console.log('🗑️ Session cleared - address consumed');

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

  const handleRestoreSession = (session: any) => {
    // ONLY restore if session has payment address AND is not completed
    if (session.data.paymentAddress && session.step < 3) {
      setSessionId(session.id);
      setCurrentStep(session.step);
      setSelectedPackage(session.data.selectedPackage || CREDIT_PACKAGES_BASE[1]);
      setCustomCredits(session.data.customCredits || '');
      setIsCustom(session.data.isCustom || false);
      setSelectedCrypto(session.data.selectedCrypto || 'BTC');
      setPaymentAddress(session.data.paymentAddress || '');
      setPurchaseId(session.data.purchaseId || '');
      setTransactionHash(session.data.transactionHash || '');
      
      // Regenerate QR code
      QRCode.toDataURL(session.data.paymentAddress, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      }).then(setQrCodeUrl).catch(console.error);
      
      toast({
        title: "Session Restored",
        description: `Resumed your credit purchase at step ${session.step}`,
      });
    }
    
    setShowSessionModal(false);
  };

  const handleDismissSession = (sessionId: string) => {
    removeSession(sessionId);
    setShowSessionModal(false);
  };

  const handleCancelTransaction = () => {
    // Clear session and navigate back
    sessionStorage.removeItem('active_credit_purchase');
    if (sessionId) {
      removeSession(sessionId);
    }
    setShowCancelDialog(false);
    navigate(-1);
    
    toast({
      title: "Transaction Cancelled",
      description: "Your credit purchase has been cancelled",
    });
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
      <div className="sticky top-0 bg-white border-b shadow-sm z-[99999] w-full">
        <div className="p-4 flex items-center justify-between bg-white w-full relative z-[99999]">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (currentStep >= 2 && paymentAddress) {
                setShowCancelDialog(true);
              } else {
                navigate(-1);
              }
            }} 
            className="bg-white hover:bg-gray-50 relative z-[99999]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold bg-white px-4 py-2 rounded relative z-[99999]">Purchase Credits</h1>
          <div className="w-10" />
        </div>
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

      <div className="p-4 pb-20">
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Credit Value Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <DollarSign size={16} />
                <span className="font-medium">1 Credit = $0.01 USD</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
                  Live
                </span>
              </div>
            </div>

            {/* Package Selection */}
            <div className="bg-white border rounded-lg">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Select Credit Package</h3>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  {pricesLoading ? (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      Loading prices...
                    </div>
                  ) : (
                    creditPackages.map((pkg) => {
                      const isSelected = !isCustom && selectedPackage.credits === pkg.credits;
                      return (
                        <div
                          key={pkg.credits}
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setIsCustom(false);
                          }}
                          className={`p-3 border-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500 text-white' 
                              : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">
                                {pkg.credits} Credits
                              </span>
                              <span className={`font-medium text-sm ${
                                isSelected ? 'text-white' : 'text-green-600'
                              }`}>
                                ${pkg.usd}
                              </span>
                              {pkg.popular && (
                                <span className="px-2 py-0.5 bg-orange-200 text-orange-700 text-xs rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                            <div className={`text-xs ${
                              isSelected ? 'text-white' : 'text-gray-500'
                            }`}>
                              {pkg.btc.toFixed(8)} BTC • {pkg.usdt?.toFixed(2)} USDT
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-white bg-white' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Custom Amount */}
                  <div
                    onClick={() => setIsCustom(true)}
                    className={`p-3 border-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                      isCustom 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">Custom Amount</span>
                        <span className={`text-xs ${
                          isCustom ? 'text-white' : 'text-blue-600'
                        }`}>(Min: 10)</span>
                      </div>
                      {isCustom && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Enter credits"
                            value={customCredits}
                            onChange={(e) => setCustomCredits(e.target.value)}
                            min="10"
                            className="w-24 h-8 text-sm"
                          />
                          {customCredits && parseInt(customCredits) >= 10 && (
                            <span className="text-xs text-green-600">
                              = ${(parseInt(customCredits) * 0.01).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isCustom 
                        ? 'border-white bg-white' 
                        : 'border-gray-300'
                    }`}>
                      {isCustom && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptocurrency Options */}
            <div className="bg-white border rounded-lg">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Choose Cryptocurrency</h3>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  <div
                    onClick={() => setSelectedCrypto('BTC')}
                    className={`p-3 border-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                      selectedCrypto === 'BTC' 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Bitcoin 
                        size={20} 
                        className={`mr-3 ${
                          selectedCrypto === 'BTC' ? 'text-white' : 'text-orange-500'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-sm">
                          Bitcoin
                        </div>
                        <div className={`text-xs ${
                          selectedCrypto === 'BTC' ? 'text-white' : 'text-gray-500'
                        }`}>
                          {getCurrentPackage().btc?.toFixed(8) || '0.00000000'} BTC
                        </div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedCrypto === 'BTC' 
                        ? 'border-white bg-white' 
                        : 'border-gray-300'
                    }`}>
                      {selectedCrypto === 'BTC' && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedCrypto('USDT')}
                    className={`p-3 border-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                      selectedCrypto === 'USDT' 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Coins 
                        size={20} 
                        className={`mr-3 ${
                          selectedCrypto === 'USDT' ? 'text-white' : 'text-green-500'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-sm">
                          USDT (Solana)
                        </div>
                        <div className={`text-xs ${
                          selectedCrypto === 'USDT' ? 'text-white' : 'text-gray-500'
                        }`}>
                          {getCurrentPackage().usdt?.toFixed(2) || '0.00'} USDT
                        </div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedCrypto === 'USDT' 
                        ? 'border-white bg-white' 
                        : 'border-gray-300'
                    }`}>
                      {selectedCrypto === 'USDT' && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                console.log('💆 Button clicked!');
                console.log('💆 Loading state:', loading);
                console.log('💆 Is custom:', isCustom);
                console.log('💆 Custom credits:', customCredits);
                console.log('💆 Selected package:', selectedPackage);
                console.log('💆 Selected crypto:', selectedCrypto);
                handlePurchaseStart();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg" 
              disabled={loading || (isCustom && (!customCredits || parseInt(customCredits) < MIN_CREDIT_PURCHASE))}
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Timer */}
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-center text-sm">
                <Clock className="w-4 h-4 text-orange-600 mr-2" />
                <span className="text-orange-800 font-medium">
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
                    Send exactly <strong>{selectedCrypto === 'BTC' ? (getCurrentPackage().btc?.toFixed(8) || '0.00000000') : (getCurrentPackage().usdt?.toFixed(2) || '0.00')} {selectedCrypto}</strong> to:
                  </div>
                  
                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className="flex justify-center mb-3">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <img src={qrCodeUrl} alt="Payment QR Code" className="w-32 h-32" />
                        <div className="text-center mt-1">
                          <div className="flex items-center justify-center text-white text-xs bg-gray-800 px-2 py-0.5 rounded">
                            <QrCode size={10} className="mr-1 text-white" />
                            Scan
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Address */}
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 bg-white rounded font-mono text-sm break-all text-black">
                      {paymentAddress}
                    </div>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => copyToClipboard(paymentAddress)}
                    >
                      <Copy size={16} className="text-white" />
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
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPhotoPicker(true)}
                      className="w-full"
                    >
                      <Upload size={16} className="mr-2" />
                      {paymentProof ? paymentProof.name : 'Upload Payment Proof'}
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

                <div className="sticky bottom-4 bg-white pt-4 -mx-6 px-6 border-t">
                  <Button
                    onClick={handleSubmitPayment}
                    disabled={!paymentProof && !transactionHash}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 text-lg"
                    size="lg"
                  >
                    Submit Payment Proof
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
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
                    <div>Amount: {selectedCrypto === 'BTC' ? (getCurrentPackage().btc?.toFixed(8) || '0.00000000') : (getCurrentPackage().usdt?.toFixed(2) || '0.00')} {selectedCrypto}</div>
                    <div>Status: Pending Confirmation</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Generator */}
            {user && (
              <CreditReceiptGenerator
                purchaseData={{
                  id: purchaseId,
                  credits: getCurrentPackage().credits,
                  usdAmount: getCurrentPackage().usd || 0,
                  cryptoAmount: selectedCrypto === 'BTC' ? (getCurrentPackage().btc || 0) : (getCurrentPackage().usdt || 0),
                  cryptoType: selectedCrypto,
                  paymentAddress: paymentAddress,
                  transactionHash: transactionHash,
                  createdAt: new Date().toISOString()
                }}
                userInfo={{
                  name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
                  email: user.email || ''
                }}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => navigate('/credits-history')}>
                View History
              </Button>
              <Button onClick={() => {
                // Clear any remaining session data before going home
                sessionStorage.removeItem('active_credit_purchase');
                navigate('/');
              }}>
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* In-App Photo Picker */}
      <InAppPhotoPicker
        isOpen={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onSelect={(file) => {
          setPaymentProof(file);
          setShowPhotoPicker(false);
        }}
        title="Upload Payment Proof"
      />
      
      {/* Session Recovery Modal - ONLY show incomplete sessions with payment addresses */}
      <SessionRecoveryModal
        sessions={showSessionModal ? getActiveSessionsByType('credit_purchase').filter(s => s.data?.paymentAddress && s.step < 3) : []}
        onRestore={handleRestoreSession}
        onDismiss={handleDismissSession}
        onClose={() => setShowSessionModal(false)}
      />
      
      {/* Cancel Transaction Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-3">Cancel Transaction?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this credit purchase? Your payment address will be discarded.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Continue Payment
              </button>
              <button
                onClick={handleCancelTransaction}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsPurchase;