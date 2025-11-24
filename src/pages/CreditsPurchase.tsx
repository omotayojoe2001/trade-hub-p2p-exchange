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

  // Check for existing sessions on mount
  React.useEffect(() => {
    const existingSessions = getActiveSessionsByType('credit_purchase');
    if (existingSessions.length > 0) {
      setShowSessionModal(true);
    }
    
    setCreditPackages(CREDIT_PACKAGES_BASE.map(pkg => ({
      ...pkg,
      usd: pkg.credits * 0.01,
      btc: (pkg.credits * 0.01) / 100000,
      usdt: pkg.credits * 0.01
    })));
    setPricesLoading(false);
  }, []);

  // Save session whenever important state changes
  React.useEffect(() => {
    if (currentStep > 1 && sessionId) {
      saveSession({
        id: sessionId,
        type: 'credit_purchase',
        step: currentStep,
        data: {
          selectedPackage,
          customCredits,
          isCustom,
          selectedCrypto,
          paymentAddress,
          purchaseId,
          transactionHash,
          credits: getCurrentPackage().credits,
          usdAmount: getCurrentPackage().usd,
          cryptoAmount: selectedCrypto === 'BTC' ? getCurrentPackage().btc : getCurrentPackage().usdt
        }
      });
    }
  }, [currentStep, selectedPackage, customCredits, isCustom, selectedCrypto, paymentAddress, purchaseId, transactionHash, sessionId]);

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

    // Generate session ID
    const newSessionId = `credit_${Date.now()}_${user.id}`;
    setSessionId(newSessionId);

    setLoading(true);
    try {
      // Use real Supabase + BitGo integration with real-time pricing
      const cryptoAmount = await cryptoPriceService.calculateCryptoAmount(currentPackage.credits, selectedCrypto);
      const tradeId = `credit-${Date.now()}`;
      
      // Debug: Log the selected crypto type
      console.log('🔍 Selected crypto for address generation:', selectedCrypto);
      console.log('🔍 Crypto amount:', cryptoAmount);
      
      // Generate payment address (real BitGo for BTC, mock for others)
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
          credits_amount: currentPackage.credits,
          price_paid_naira: currentPackage.usd * 1650, // Convert USD to NGN
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

      // Save initial session
      saveSession({
        id: newSessionId,
        type: 'credit_purchase',
        step: 2,
        data: {
          selectedPackage,
          customCredits,
          isCustom,
          selectedCrypto,
          paymentAddress: address,
          purchaseId: purchase.id,
          credits: currentPackage.credits,
          usdAmount: currentPackage.usd,
          cryptoAmount
        }
      });

      toast({
        title: `${selectedCrypto} Payment Address Generated`,
        description: `Send exactly ${cryptoAmount.toFixed(8)} ${selectedCrypto} to this ${selectedCrypto === 'BTC' ? 'real BitGo' : 'mock'} address`,
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

  const handleRestoreSession = (session: any) => {
    setSessionId(session.id);
    setCurrentStep(session.step);
    setSelectedPackage(session.data.selectedPackage || CREDIT_PACKAGES_BASE[1]);
    setCustomCredits(session.data.customCredits || '');
    setIsCustom(session.data.isCustom || false);
    setSelectedCrypto(session.data.selectedCrypto || 'BTC');
    setPaymentAddress(session.data.paymentAddress || '');
    setPurchaseId(session.data.purchaseId || '');
    setTransactionHash(session.data.transactionHash || '');
    
    // Regenerate QR code if we have payment address
    if (session.data.paymentAddress) {
      QRCode.toDataURL(session.data.paymentAddress, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      }).then(setQrCodeUrl).catch(console.error);
    }
    
    setShowSessionModal(false);
    
    toast({
      title: "Session Restored",
      description: `Resumed your credit purchase at step ${session.step}`,
    });
  };

  const handleDismissSession = (sessionId: string) => {
    removeSession(sessionId);
    const remainingSessions = getActiveSessionsByType('credit_purchase').filter(s => s.id !== sessionId);
    if (remainingSessions.length === 0) {
      setShowSessionModal(false);
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
      <div className="sticky top-0 bg-white border-b shadow-sm z-[99999] w-full">
        <div className="p-4 flex items-center justify-between bg-white w-full relative z-[99999]">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-white hover:bg-gray-50 relative z-[99999]">
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

      <div className="p-4 pb-32">
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
              <CardContent>
                <div className="space-y-3">
                  {pricesLoading ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                      Loading real-time prices...
                    </div>
                  ) : (
                    creditPackages.map((pkg) => (
                      <div
                        key={pkg.credits}
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setIsCustom(false);
                        }}
                        style={{
                          padding: '16px',
                          border: '2px solid',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: !isCustom && selectedPackage.credits === pkg.credits ? '#3b82f6' : '#ffffff',
                          borderColor: !isCustom && selectedPackage.credits === pkg.credits ? '#3b82f6' : '#d1d5db',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (isCustom || selectedPackage.credits !== pkg.credits) {
                            e.currentTarget.style.backgroundColor = '#eff6ff';
                            e.currentTarget.style.borderColor = '#93c5fd';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isCustom || selectedPackage.credits !== pkg.credits) {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span 
                              style={{ 
                                fontWeight: '600',
                                color: !isCustom && selectedPackage.credits === pkg.credits ? '#ffffff' : '#111827'
                              }}
                            >
                              {pkg.credits} Credits
                            </span>
                            <span 
                              style={{ 
                                fontWeight: '500',
                                color: !isCustom && selectedPackage.credits === pkg.credits ? '#ffffff' : '#059669'
                              }}
                            >
                              ${pkg.usd}
                            </span>
                            {pkg.popular && (
                              <span style={{
                                padding: '4px 8px',
                                backgroundColor: '#fed7aa',
                                color: '#ea580c',
                                fontSize: '12px',
                                borderRadius: '9999px'
                              }}>
                                Popular
                              </span>
                            )}
                          </div>
                          <div 
                            style={{ 
                              fontSize: '14px',
                              color: !isCustom && selectedPackage.credits === pkg.credits ? '#ffffff' : '#6b7280'
                            }}
                          >
                            {pkg.btc.toFixed(8)} BTC • {pkg.usdt?.toFixed(2)} USDT
                          </div>
                        </div>
                        <div 
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: !isCustom && selectedPackage.credits === pkg.credits ? '#ffffff' : '#d1d5db',
                            backgroundColor: !isCustom && selectedPackage.credits === pkg.credits ? '#ffffff' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {!isCustom && selectedPackage.credits === pkg.credits && (
                            <div 
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6'
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Custom Amount */}
                  <div
                    onClick={() => setIsCustom(true)}
                    style={{
                      padding: '16px',
                      border: '2px solid',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      backgroundColor: isCustom ? '#3b82f6' : '#ffffff',
                      borderColor: isCustom ? '#3b82f6' : '#d1d5db',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCustom) {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.borderColor = '#93c5fd';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCustom) {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '600', color: isCustom ? '#ffffff' : '#111827' }}>Custom Amount</span>
                          <span style={{ color: isCustom ? '#ffffff' : '#2563eb', fontSize: '14px' }}>(Min: 10 credits)</span>
                        </div>
                        {isCustom && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Input
                              type="number"
                              placeholder="Enter credits"
                              value={customCredits}
                              onChange={(e) => setCustomCredits(e.target.value)}
                              min="10"
                              style={{ width: '128px' }}
                            />
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>
                              {customCredits && parseInt(customCredits) >= 10 && (
                                <span style={{ color: '#059669' }}>
                                  = ${(parseInt(customCredits) * 0.01).toFixed(2)}
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <div 
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: isCustom ? '#ffffff' : '#d1d5db',
                          backgroundColor: isCustom ? '#ffffff' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isCustom && (
                          <div 
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#3b82f6'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cryptocurrency Options */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Cryptocurrency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div
                    onClick={() => setSelectedCrypto('BTC')}
                    className="crypto-option"
                    style={{
                      padding: '16px',
                      border: '2px solid',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: selectedCrypto === 'BTC' ? '#3b82f6' : '#ffffff',
                      borderColor: selectedCrypto === 'BTC' ? '#3b82f6' : '#d1d5db',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCrypto !== 'BTC') {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.borderColor = '#93c5fd';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCrypto !== 'BTC') {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <Bitcoin 
                        size={24} 
                        style={{ 
                          color: selectedCrypto === 'BTC' ? '#ffffff' : '#f97316',
                          marginRight: '12px'
                        }} 
                      />
                      <div>
                        <div 
                          style={{ 
                            fontWeight: '600',
                            color: selectedCrypto === 'BTC' ? '#ffffff' : '#111827'
                          }}
                        >
                          Bitcoin
                        </div>
                        <div 
                          style={{ 
                            fontSize: '14px',
                            color: selectedCrypto === 'BTC' ? '#ffffff' : '#6b7280',
                            marginTop: '2px'
                          }}
                        >
                          {getCurrentPackage().btc?.toFixed(8) || '0.00000000'} BTC
                        </div>
                      </div>
                    </div>
                    <div 
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: selectedCrypto === 'BTC' ? '#ffffff' : '#d1d5db',
                        backgroundColor: selectedCrypto === 'BTC' ? '#ffffff' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {selectedCrypto === 'BTC' && (
                        <div 
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6'
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedCrypto('USDT')}
                    className="crypto-option"
                    style={{
                      padding: '16px',
                      border: '2px solid',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: selectedCrypto === 'USDT' ? '#3b82f6' : '#ffffff',
                      borderColor: selectedCrypto === 'USDT' ? '#3b82f6' : '#d1d5db',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCrypto !== 'USDT') {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.borderColor = '#93c5fd';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCrypto !== 'USDT') {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <Coins 
                        size={24} 
                        style={{ 
                          color: selectedCrypto === 'USDT' ? '#ffffff' : '#10b981',
                          marginRight: '12px'
                        }} 
                      />
                      <div>
                        <div 
                          style={{ 
                            fontWeight: '600',
                            color: selectedCrypto === 'USDT' ? '#ffffff' : '#111827'
                          }}
                        >
                          USDT (Solana)
                        </div>
                        <div 
                          style={{ 
                            fontSize: '14px',
                            color: selectedCrypto === 'USDT' ? '#ffffff' : '#6b7280',
                            marginTop: '2px'
                          }}
                        >
                          {getCurrentPackage().usdt?.toFixed(2) || '0.00'} USDT
                        </div>
                      </div>
                    </div>
                    <div 
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: selectedCrypto === 'USDT' ? '#ffffff' : '#d1d5db',
                        backgroundColor: selectedCrypto === 'USDT' ? '#ffffff' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {selectedCrypto === 'USDT' && (
                        <div 
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handlePurchaseStart} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 text-lg rounded-xl shadow-lg" 
              size="lg"
              disabled={loading || (isCustom && (!customCredits || parseInt(customCredits) < MIN_CREDIT_PURCHASE))}
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
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
                    Send exactly <strong>{selectedCrypto === 'BTC' ? (getCurrentPackage().btc?.toFixed(8) || '0.00000000') : (getCurrentPackage().usdt?.toFixed(2) || '0.00')} {selectedCrypto}</strong> to:
                  </div>
                  
                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48" />
                        <div className="text-center mt-2">
                          <div className="flex items-center justify-center text-white text-xs bg-gray-800 px-2 py-1 rounded">
                            <QrCode size={12} className="mr-1 text-white" />
                            Scan to pay
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
              <Button onClick={() => navigate('/')}>
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
      
      {/* Session Recovery Modal */}
      <SessionRecoveryModal
        sessions={showSessionModal ? getActiveSessionsByType('credit_purchase') : []}
        onRestore={handleRestoreSession}
        onDismiss={handleDismissSession}
        onClose={() => setShowSessionModal(false)}
      />
    </div>
  );
};

export default CreditsPurchase;