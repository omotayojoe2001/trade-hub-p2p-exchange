
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Building2, Bell, MessageSquare, AlertTriangle, FileText, Shield, Copy, CheckCircle, Upload, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PaymentConfirmationDialog from '@/components/PaymentConfirmationDialog';
import AmountInput from '@/components/sell-crypto/AmountInput';
import BankAccountSelector from '@/components/BankAccountSelector';
import QRCodeLib from 'qrcode';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { storageService } from '@/services/supabaseService';

const PaymentStatus = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const { amount, nairaAmount, mode, selectedMerchant, coinType, activeStep: resumeStep, resumeTrade, tradeId } = (location.state as any) || {};

  // Debug: Log what we received
  console.log('PaymentStatus received state:', location.state);
  console.log('Selected merchant:', selectedMerchant);
  console.log('Selected coin type:', coinType);

  // Use real merchant data and selected currency
  const merchantName = selectedMerchant?.name || selectedMerchant?.display_name || 'NO MERCHANT SELECTED';
  const selectedCurrency = coinType || 'BTC'; // Use actual selected currency

  // Get merchant's rate for the selected currency
  const getMerchantRate = () => {
    if (!selectedMerchant) return 150000000; // Default rate

    switch (selectedCurrency) {
      case 'BTC':
        return selectedMerchant.btc_rate || selectedMerchant.btc_buy_rate || 150000000;
      case 'ETH':
        return selectedMerchant.eth_rate || selectedMerchant.eth_buy_rate || 5000000;
      case 'USDT':
        return selectedMerchant.usdt_rate || selectedMerchant.usdt_buy_rate || 750;
      default:
        return 150000000;
    }
  };

  const merchantRate = getMerchantRate();

  // Alert if no merchant data received
  if (!selectedMerchant) {
    console.error('NO MERCHANT DATA RECEIVED IN PAYMENT STATUS!');
  }

  // State variables
  const [activeStep, setActiveStep] = useState<number>(resumeStep || (location.state as any)?.step || 1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [amountInput, setAmountInput] = useState<string>(amount || '');
  const [currentRate, setCurrentRate] = useState<number>(merchantRate || 150000000);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false);
  const [tradeRequestSubmitted, setTradeRequestSubmitted] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(29 * 60 + 45); // 29:45 in seconds
  const walletAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
  const calculateNairaValue = () => {
    const a = parseFloat(amountInput || '0');
    if (isNaN(a)) return 0;
    return a * currentRate;
  };
  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Live rate simulation for BTC→NGN
  useEffect(() => {
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 10000; // ±5k variation
      setCurrentRate(prev => Math.max(1745000, Math.min(1765000, prev + variation)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Generate QR code for wallet address
  useEffect(() => {
    QRCodeLib.toDataURL(walletAddress)
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation failed', err));
  }, []);

  // Show payment confirmation dialog once we're in Waiting step
  useEffect(() => {
    if (activeStep === 3) {
      const paymentNotificationTimer = setTimeout(() => {
        setShowConfirmDialog(true);
      }, 10000); // demo: 10s after entering waiting state
      return () => clearTimeout(paymentNotificationTimer);
    }
  }, [activeStep]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a PNG, JPG, or PDF file",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
  };

  const uploadPaymentProof = async () => {
    if (!uploadedFile || !user) return;

    setIsUploading(true);
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `payment_proof_${timestamp}_${user.id}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      // Upload to Supabase Storage
      await storageService.uploadFile('receipts', filePath, uploadedFile);

      // Get public URL
      const publicUrl = storageService.getPublicUrl('receipts', filePath);
      setUploadedProofUrl(publicUrl);

      toast({
        title: "Proof Uploaded Successfully",
        description: "Payment proof has been uploaded and verified",
      });

      // Update trade record with proof URL if we have a trade ID
      if (tradeId) {
        await supabase
          .from('trades')
          .update({ payment_proof_url: publicUrl })
          .eq('id', tradeId);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload proof. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const handleContinueToPayment = async () => {
    // Prevent multiple submissions
    if (isSubmittingTrade || tradeRequestSubmitted) {
      toast({
        title: "Trade request already sent",
        description: "Please wait for merchant response",
        variant: "destructive"
      });
      return;
    }

    if (!user || !selectedMerchant) {
      toast({
        title: "Error",
        description: "Missing user or merchant information",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(amountInput || '0');
    if (amount <= 0 || isNaN(amount)) {
      toast({
        title: "Error",
        description: "Please enter a valid numeric amount",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingTrade(true);

    try {
      // NOW create the trade request with the user-entered amount
      const tradeRequestData = {
        trade_type: (mode || 'buy') as 'buy' | 'sell',
        coin_type: selectedCurrency as 'BTC' | 'ETH' | 'USDT',
        amount: amount,
        naira_amount: calculateNairaValue(),
        rate: merchantRate, // Use merchant's rate, not generic rate
        payment_method: 'bank_transfer',
        notes: `${mode === 'buy' ? 'Buy' : 'Sell'} request from ${user.email} for ${merchantName}`,
        // Include bank account for buy orders
        ...(mode === 'buy' && selectedBankAccount && {
          receiving_account: {
            bank_name: selectedBankAccount.bank_name,
            account_number: selectedBankAccount.account_number,
            account_name: selectedBankAccount.account_name
          }
        })
      };

      // Import and use the trade request service
      const { tradeRequestService } = await import('@/services/tradeRequestService');
      const tradeRequest = await tradeRequestService.createTradeRequest(user.id, tradeRequestData);

      console.log('Trade request created:', tradeRequest);

      // Create notification for the selected merchant ONLY
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedMerchant.id,
          type: 'trade_request',
          title: 'New Trade Request',
          message: `${user.email} wants to buy ${amount} ${coinType || 'BTC'} for ₦${calculateNairaValue().toLocaleString()}`,
          read: false,
          data: {
            trade_request_id: tradeRequest.id,
            priority: 'high'
          }
        });

      toast({
        title: "Trade request sent!",
        description: `Your trade request has been sent to ${selectedMerchant.name}`,
      });

      // Mark as submitted to prevent duplicates
      setTradeRequestSubmitted(true);

      // Move to step 2 (payment)
      setActiveStep(2);

    } catch (error) {
      console.error('Error creating trade request:', error);
      toast({
        title: "Error",
        description: "Failed to create trade request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingTrade(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!uploadedFile) {
      toast({
        title: "Upload Required",
        description: "Please upload payment proof before marking as paid",
        variant: "destructive"
      });
      return;
    }

    // Upload the proof first
    await uploadPaymentProof();

    // Move to Payment Sent then Waiting
    setActiveStep(3);

    toast({
      title: "Payment Marked",
      description: "Payment proof uploaded. Waiting for merchant confirmation.",
    });
  };

  const handlePaymentConfirmation = (received: boolean) => {
    setShowConfirmDialog(false);
    if (received) {
      // Mark final step as confirmed
      setActiveStep(4);
      navigate('/trade-completed');
    } else {
      // User can check payment later from My Trades section
      console.log('User reported no payment received - redirecting to My Trades');
      navigate('/my-trades');
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/my-trades">
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Payment Status</h1>
        </div>
        <MoreVertical size={24} className="text-gray-700" />
      </div>

      {/* Resume Trade Banner */}
      {resumeTrade && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              <span className="text-orange-800 text-sm font-medium">
                Resuming Trade - {activeStep === 2 ? 'Upload Payment Proof Required' : activeStep === 3 ? 'Waiting for Confirmation' : 'Continue from where you left off'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4 overflow-x-auto">
          {/* Step 1: Request Sent */}
          <div className="flex items-center flex-shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${activeStep >= 1 ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`text-xs ${activeStep >= 1 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 1 ? '✓' : '1'}</span>
            </div>
            <div className="text-center min-w-0">
              <p className={`text-xs font-medium ${activeStep >= 1 ? 'text-green-600' : 'text-gray-500'}`}>Request</p>
              <p className={`text-xs ${activeStep >= 1 ? 'text-green-600' : 'text-gray-500'}`}>Sent</p>
            </div>
          </div>

          <div className={`flex-1 h-px mx-2 sm:mx-3 ${activeStep >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>

          {/* Step 2: Payment Sent */}
          <div className="flex items-center flex-shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${activeStep >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`text-xs ${activeStep >= 2 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 2 ? '✓' : '2'}</span>
            </div>
            <div className="text-center min-w-0">
              <p className={`text-xs font-medium ${activeStep >= 2 ? 'text-green-600' : 'text-gray-500'}`}>Payment</p>
              <p className={`text-xs ${activeStep >= 2 ? 'text-green-600' : 'text-gray-500'}`}>Sent</p>
            </div>
          </div>

          <div className={`flex-1 h-px mx-2 sm:mx-3 ${activeStep >= 3 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>

          {/* Step 3: Waiting */}
          <div className="flex items-center flex-shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${activeStep >= 3 ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <span className={`text-xs ${activeStep >= 3 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 3 ? '3' : '3'}</span>
            </div>
            <div className="text-center min-w-0">
              <p className={`text-xs font-medium ${activeStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>Waiting</p>
              <p className={`text-xs ${activeStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>Payment</p>
            </div>
          </div>

          <div className={`flex-1 h-px mx-2 sm:mx-3 ${activeStep >= 4 ? 'bg-green-500' : 'bg-gray-300'}`}></div>

          {/* Step 4: Confirmed */}
          <div className="flex items-center flex-shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${activeStep >= 4 ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`text-xs ${activeStep >= 4 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 4 ? '✓' : '4'}</span>
            </div>
            <div className="text-center min-w-0">
              <p className={`text-xs font-medium ${activeStep >= 4 ? 'text-green-600' : 'text-gray-500'}`}>Confirmed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeStep === 1 && (
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {mode === 'buy' ? `Enter Amount to Buy` : `Enter Amount to Sell`}
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            {mode === 'buy'
              ? `Type the {selectedCurrency} amount you want to buy. Rate updates live.`
              : `Type the {selectedCurrency} amount you want to sell. Rate updates live.`
            }
          </p>

          <AmountInput
            amount={amountInput}
            onAmountChange={setAmountInput}
            currentRate={currentRate}
            calculateNairaValue={calculateNairaValue}
            currency={selectedCurrency}
            mode={mode}
          />

          {/* Bank Account Selection - Only show for sell transactions */}
          {mode === 'sell' && (
            <div className="mt-6">
              <BankAccountSelector
                selectedAccount={selectedBankAccount}
                onAccountSelect={setSelectedBankAccount}
                mode={mode}
              />
            </div>
          )}

        </div>
      )}

      {activeStep === 2 && (
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Send Crypto</h2>
          <p className="text-gray-600 text-sm mb-4">Send the exact amount to the wallet below and upload your proof.</p>

          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Amount to Send</span>
              <span className="font-semibold">{(amountInput || amount || '0')} BTC</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Equivalent (NGN)</span>
              <span className="font-semibold">₦{(nairaAmount ?? calculateNairaValue()).toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Wallet Address</span>
                <button onClick={handleCopyAddress} className="text-blue-600 hover:underline flex items-center text-xs">
                  <Copy size={14} className="mr-1" /> Copy
                </button>
              </div>
              <p className="font-mono break-all text-gray-900 mt-1">{walletAddress}</p>
            </div>
            {qrDataUrl && (
              <div className="flex flex-col items-center pt-2">
                <img src={qrDataUrl} alt="BTC wallet QR" className="w-40 h-40" loading="lazy" />
                <p className="text-xs text-gray-500 mt-2">Scan to pay</p>
              </div>
            )}
          </div>

          {/* Upload Payment Proof */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Upload Payment Proof</h3>

            {!uploadedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={triggerFileUpload}
              >
                <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-1">Tap to upload payment proof</p>
                <p className="text-xs text-gray-500">PNG, JPG or PDF (Max 5MB)</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <FileText size={20} className="text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                {uploadedFile.type.startsWith('image/') && (
                  <div className="mt-3">
                    <img
                      src={URL.createObjectURL(uploadedFile)}
                      alt="Payment proof preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-3 mt-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleMarkAsPaid}
              disabled={!uploadedFile || isUploading}
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading...
                </div>
              ) : (
                'Mark as Paid'
              )}
            </Button>

            {/* Navigation Buttons */}
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                  onClick={() => setActiveStep(1)}
                >
                  Previous
                </Button>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    if (uploadedFile) {
                      setActiveStep(3);
                    } else {
                      toast({
                        title: "Upload Required",
                        description: "Please upload payment proof before proceeding",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={!uploadedFile}
                >
                  Next
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => {
                  // Add cancel trade functionality
                  if (confirm('Are you sure you want to cancel this trade?')) {
                    navigate('/my-trades');
                  }
                }}
              >
                Cancel Trade
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="p-6 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 size={40} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Waiting for Confirmation</h2>
          <p className="text-gray-600 mb-8">You've submitted your payment. The merchant is confirming now.</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">Payment in Progress</span>
              <div className="flex items-center">
                <div className="w-12 h-12 relative">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="75, 100" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">75%</span>
                  </div>
                </div>
              </div>
            </div>
          <p className="text-sm text-gray-500">Estimated Time: 30 mins</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle size={12} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-orange-800 font-medium">Auto-refund in {formatTime(timeLeft)}</p>
                <p className="text-orange-600 text-sm">If merchant doesn't respond</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {activeStep === 3 && (
        <div className="px-4 space-y-3">
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center"
            onClick={() => handlePaymentConfirmation(true)}
          >
            <span className="hidden sm:inline">I have received payment</span>
            <span className="sm:hidden">Received Payment</span>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 flex items-center justify-center">
              <Bell size={16} className="mr-2" />
              <span className="hidden sm:inline">Remind Merchant</span>
              <span className="sm:hidden">Remind</span>
            </Button>
            
            <Button className="w-full bg-blue-50 text-blue-600 py-3 rounded-lg hover:bg-blue-100 flex items-center justify-center">
              <MessageSquare size={16} className="mr-2" />
              <span className="hidden sm:inline">Message Merchant</span>
              <span className="sm:hidden">Message</span>
            </Button>
          </div>
          
          <Button variant="outline" className="w-full border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50 flex items-center justify-center">
            <AlertTriangle size={16} className="mr-2" />
            <span className="hidden sm:inline">Report/Dispute</span>
            <span className="sm:hidden">Report Issue</span>
          </Button>
        </div>
      )}

      {/* Confirmation Step */}
      {activeStep === 4 && (
        <div className="p-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Payment Confirmed!</h2>
          <p className="text-gray-600 mb-8">Your payment has been confirmed and the trade is now complete.</p>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/trade-completed')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg"
            >
              View Trade Details
            </Button>
            <Button
              onClick={() => navigate('/my-trades')}
              variant="outline"
              className="w-full py-3 rounded-lg"
            >
              Go to My Trades
            </Button>
          </div>
        </div>
      )}

      {/* Trade Summary */}
      <div className="p-4 sm:p-6 mt-6">
        <div className="flex items-center mb-4">
          <FileText size={20} className="text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Trade Summary</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {mode === 'buy' ? 'Amount Buying' : 'Amount Selling'}
            </span>
            <span className="font-medium text-gray-900">{amountInput || amount || '0'} {selectedCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Platform Fee (1%)</span>
            <span className="font-medium text-gray-900">₦{Math.round((nairaAmount ?? calculateNairaValue()) * 0.01).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              {mode === 'buy' ? 'Total Paying' : 'Total Receiving'}
            </span>
            <span className="font-medium text-gray-900">₦{Math.round((nairaAmount ?? calculateNairaValue()) * 0.99).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Merchant</span>
            <div className="flex items-center">
              <span className="font-medium text-gray-900 mr-2">{merchantName}</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Wallet Network</span>
            <span className="font-medium text-gray-900">{selectedCurrency === 'BTC' ? 'Bitcoin (BTC)' : selectedCurrency === 'ETH' ? 'Ethereum (ETH)' : selectedCurrency === 'USDT' ? 'Tether (USDT)' : `${selectedCurrency} Network`}</span>
          </div>
        </div>

        {/* Send Trade Request Button - Only show on step 1 */}
        {activeStep === 1 && (
          <div className="mt-6">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleContinueToPayment}
              disabled={!(parseFloat(amountInput || '0') > 0) || isSubmittingTrade || tradeRequestSubmitted}
            >
              {isSubmittingTrade ? 'Sending...' : tradeRequestSubmitted ? 'Trade Request Sent' : 'Send Trade Request'}
            </Button>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="p-4 sm:p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield size={20} className="text-blue-600 mr-3 mt-0.5" />
            <p className="text-blue-800 text-sm">
              Your crypto is securely held in escrow. It will be released only when you confirm payment or when the timer completes without dispute.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Dialog */}
      <PaymentConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handlePaymentConfirmation}
        amount={Math.round((nairaAmount ?? calculateNairaValue()) * 0.99)}
        bankAccount={selectedBankAccount ? `${selectedBankAccount.account_number}` : "Your Bank Account"}
        merchantName={merchantName}
        bankName={selectedBankAccount?.bank_name}
      />
    </div>
  );
};

export default PaymentStatus;
