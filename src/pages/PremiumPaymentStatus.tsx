import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Building2, Bell, MessageSquare, AlertTriangle, FileText, Shield, Copy, CheckCircle, Crown, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PaymentConfirmationDialog from '@/components/PaymentConfirmationDialog';
import AmountInput from '@/components/sell-crypto/AmountInput';
import QRCodeLib from 'qrcode';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumPaymentStatus = () => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [timeLeft, setTimeLeft] = useState(29 * 60 + 45); // 29:45 in seconds
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, nairaAmount, mode } = (location.state as any) || {};
  const [activeStep, setActiveStep] = useState<number>((location.state as any)?.step || 1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [amountInput, setAmountInput] = useState<string>(amount || '');
  const [currentRate, setCurrentRate] = useState<number>(1755000);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
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
      }, 8000); // Premium: faster notification (8s instead of 10s)
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
    const file = e.target.files?.[0] || null;
    setUploadedFile(file);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const handleMarkAsPaid = () => {
    // Move to Payment Sent then Waiting
    setActiveStep(2);
    setTimeout(() => setActiveStep(3), 600); // Premium: faster transition
  };

  const handlePaymentConfirmation = (received: boolean) => {
    setShowConfirmDialog(false);
    if (received) {
      // Mark final step as confirmed
      setActiveStep(4);
      navigate('/premium-trade-completed');
    } else {
      // User can check payment later from My Trades section
      console.log('User reported no payment received - redirecting to Premium Trades');
      navigate('/premium-trades');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-trades">
              <ArrowLeft size={24} className="text-gray-600 mr-4" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Crown size={20} className="mr-2 text-yellow-600" />
                Premium Payment Status
              </h1>
              <p className="text-gray-600 text-sm">Priority processing enabled</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200">
        <div className="flex items-center justify-between">
          {/* Step 1: Request Sent */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${activeStep >= 1 ? 'bg-yellow-500' : 'bg-gray-300'}`}>
              <span className={`text-sm font-bold ${activeStep >= 1 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 1 ? '✓' : '1'}</span>
            </div>
            <div className="text-center">
              <p className={`text-xs font-medium ${activeStep >= 1 ? 'text-yellow-700' : 'text-gray-500'}`}>Request</p>
            </div>
          </div>

          <div className={`flex-1 h-1 mx-4 rounded ${activeStep >= 2 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>

          {/* Step 2: Payment Sent */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${activeStep >= 2 ? 'bg-yellow-500' : 'bg-gray-300'}`}>
              <span className={`text-sm font-bold ${activeStep >= 2 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 2 ? '✓' : '2'}</span>
            </div>
            <div className="text-center">
              <p className={`text-xs font-medium ${activeStep >= 2 ? 'text-yellow-700' : 'text-gray-500'}`}>Payment</p>
            </div>
          </div>

          <div className={`flex-1 h-1 mx-4 rounded ${activeStep >= 3 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>

          {/* Step 3: Waiting */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${activeStep >= 3 ? 'bg-yellow-500' : 'bg-gray-300'}`}>
              <span className={`text-sm font-bold ${activeStep >= 3 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 3 ? '✓' : '3'}</span>
            </div>
            <div className="text-center">
              <p className={`text-xs font-medium ${activeStep >= 3 ? 'text-yellow-700' : 'text-gray-500'}`}>Waiting</p>
            </div>
          </div>

          <div className={`flex-1 h-1 mx-4 rounded ${activeStep >= 4 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>

          {/* Step 4: Confirmed */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${activeStep >= 4 ? 'bg-yellow-500' : 'bg-gray-300'}`}>
              <span className={`text-sm font-bold ${activeStep >= 4 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 4 ? '✓' : '4'}</span>
            </div>
            <div className="text-center">
              <p className={`text-xs font-medium ${activeStep >= 4 ? 'text-yellow-700' : 'text-gray-500'}`}>Complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeStep === 1 && (
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Enter Amount to Sell</h2>
          <p className="text-gray-600 text-sm mb-4">Premium rate updates with priority access.</p>

          <AmountInput
            amount={amountInput}
            onAmountChange={setAmountInput}
            currentRate={currentRate}
            calculateNairaValue={calculateNairaValue}
          />

          <div className="mt-6">
            <Button
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => setActiveStep(2)}
              disabled={!(parseFloat(amountInput || '0') > 0)}
            >
              <Crown size={16} className="mr-2" />
              Continue with Premium
            </Button>
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Send Payment</h2>
          <p className="text-gray-600 text-sm mb-4">Send your crypto to the address below and upload proof.</p>

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
                <button onClick={handleCopyAddress} className="text-yellow-600 hover:underline flex items-center text-xs">
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

          <div className="border-2 border-dashed border-yellow-200 rounded-lg p-6 text-center cursor-pointer mb-3" onClick={() => triggerFileUpload()}>
            <p className="text-sm text-gray-600 mb-1">{uploadedFile ? uploadedFile.name : 'Tap to upload payment receipt'}</p>
            <p className="text-xs text-gray-500">PNG, JPG or PDF (Max 5MB)</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />

          <div className="space-y-3 mt-4">
            <Button 
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" 
              onClick={handleMarkAsPaid}
              disabled={!uploadedFile}
            >
              <Zap size={16} className="mr-2" />
              Mark as Paid (Premium)
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => setActiveStep(1)}>Back</Button>
              <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">Cancel Trade</Button>
            </div>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="p-6 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown size={40} className="text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Premium Processing</h2>
          <p className="text-gray-600 mb-8">Your premium payment is being processed with priority confirmation.</p>

          <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-800 font-medium">Premium Payment in Progress</span>
              <div className="flex items-center">
                <div className="w-12 h-12 relative">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#fef3c7" strokeWidth="2" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="85, 100" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold text-yellow-700">85%</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-yellow-700 text-sm">Premium users get 3x faster processing</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Time Remaining</span>
              <span className="font-semibold text-gray-900">{formatTime(timeLeft)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${Math.max(0, (timeLeft / (30 * 60)) * 100)}%` }}></div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center"
            >
              <CheckCircle size={16} className="mr-2" />
              I Have Received Payment
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 flex items-center justify-center">
                <Bell size={16} className="mr-2" />
                <span className="hidden sm:inline">Priority Alert</span>
                <span className="sm:hidden">Alert</span>
              </Button>

              <Button className="w-full bg-yellow-50 text-yellow-700 py-3 rounded-lg hover:bg-yellow-100 flex items-center justify-center border border-yellow-200">
                <MessageSquare size={16} className="mr-2" />
                <span className="hidden sm:inline">Premium Chat</span>
                <span className="sm:hidden">Chat</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Step */}
      {activeStep === 4 && (
        <div className="p-6 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Premium Payment Confirmed!</h2>
          <p className="text-gray-600 mb-8">Your premium payment has been confirmed and the trade is now complete.</p>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/premium-trade-completed')}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg"
            >
              <Crown size={16} className="mr-2" />
              View Premium Trade Details
            </Button>
            <Button
              onClick={() => navigate('/premium-trades')}
              variant="outline"
              className="w-full py-3 rounded-lg border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              Go to Premium Trades
            </Button>
          </div>
        </div>
      )}

      {/* Trade Summary */}
      <div className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Trade Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Sold</span>
            <span className="font-medium text-gray-900">{amountInput || amount || '0'} BTC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Receiving</span>
            <span className="font-medium text-gray-900">₦{(nairaAmount ?? calculateNairaValue()).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Premium Merchant</span>
            <div className="flex items-center">
              <span className="font-medium text-gray-900 mr-2">PremiumPay</span>
              <Crown size={12} className="text-yellow-500 mr-1" />
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Processing Speed</span>
            <span className="font-medium text-yellow-700">3x Faster</span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 sm:p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield size={20} className="text-yellow-600 mr-3 mt-0.5" />
            <p className="text-yellow-800 text-sm">
              Your crypto is securely held in premium escrow with enhanced protection. Premium trades get priority processing and dedicated support.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Dialog */}
      <PaymentConfirmationDialog 
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handlePaymentConfirmation}
        amount={amount || 0}
        bankAccount="Default Bank Account"
        merchantName="Merchant"
      />

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumPaymentStatus;
