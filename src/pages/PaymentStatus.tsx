
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Building2, Bell, MessageSquare, AlertTriangle, FileText, Shield, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PaymentConfirmationDialog from '@/components/PaymentConfirmationDialog';
import AmountInput from '@/components/sell-crypto/AmountInput';
import QRCodeLib from 'qrcode';

const PaymentStatus = () => {
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
    setTimeout(() => setActiveStep(3), 800);
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

      {/* Progress Steps */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          {/* Step 1: Request Sent */}
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${activeStep >= 1 ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`text-xs ${activeStep >= 1 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 1 ? '✓' : '1'}</span>
            </div>
            <div className="text-center">
              <p className={`text-xs font-medium ${activeStep >= 1 ? 'text-green-600' : 'text-gray-500'}`}>Request</p>
              <p className={`text-xs ${activeStep >= 1 ? 'text-green-600' : 'text-gray-500'}`}>Sent</p>
            </div>
          </div>

          <div className={`flex-1 h-px mx-3 ${activeStep >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>

          {/* Step 2: Payment Sent */}
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${activeStep >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`text-xs ${activeStep >= 2 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 2 ? '✓' : '2'}</span>
            </div>
            <div className="text-center">
              <p className={`text-xs font-medium ${activeStep >= 2 ? 'text-green-600' : 'text-gray-500'}`}>Payment</p>
              <p className={`text-xs ${activeStep >= 2 ? 'text-green-600' : 'text-gray-500'}`}>Sent</p>
            </div>
          </div>

          <div className={`flex-1 h-px mx-3 ${activeStep >= 3 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>

          {/* Step 3: Waiting */}
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${activeStep >= 3 ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <span className={`text-xs ${activeStep >= 3 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 3 ? '3' : '3'}</span>
            </div>
            <div className="text-center">
              <p className={`text-xs font-medium ${activeStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>Waiting</p>
              <p className={`text-xs ${activeStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>Payment</p>
            </div>
          </div>

          <div className={`flex-1 h-px mx-3 ${activeStep >= 4 ? 'bg-green-500' : 'bg-gray-300'}`}></div>

          {/* Step 4: Confirmed */}
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${activeStep >= 4 ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`text-xs ${activeStep >= 4 ? 'text-white' : 'text-gray-500'}`}>{activeStep >= 4 ? '✓' : '4'}</span>
            </div>
            <div className="text-center">
              <p className={`text-xs font-medium ${activeStep >= 4 ? 'text-green-600' : 'text-gray-500'}`}>Confirmed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeStep === 1 && (
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Enter Amount to Sell</h2>
          <p className="text-gray-600 text-sm mb-4">Type the BTC amount. Rate updates live.</p>

          <AmountInput
            amount={amountInput}
            onAmountChange={setAmountInput}
            currentRate={currentRate}
            calculateNairaValue={calculateNairaValue}
          />

          <div className="mt-6">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setActiveStep(2)}
              disabled={!(parseFloat(amountInput || '0') > 0)}
            >
              Continue
            </Button>
          </div>
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

          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer mb-3" onClick={() => triggerFileUpload()}>
            <p className="text-sm text-gray-600 mb-1">{uploadedFile ? uploadedFile.name : 'Tap to upload payment receipt'}</p>
            <p className="text-xs text-gray-500">PNG, JPG or PDF (Max 5MB)</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleMarkAsPaid}
              disabled={!uploadedFile}
            >
              Mark as Paid
            </Button>
            <Button className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => setActiveStep(1)}>Back</Button>
            <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">Cancel Trade</Button>
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
        <div className="px-4 sm:px-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center"
              onClick={() => handlePaymentConfirmation(true)}
            >
              <span className="hidden sm:inline">I have received payment</span>
              <span className="sm:hidden">Received</span>
            </Button>

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
            
            <Button variant="outline" className="w-full border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50 flex items-center justify-center">
              <AlertTriangle size={16} className="mr-2" />
              <span className="hidden sm:inline">Report/Dispute</span>
              <span className="sm:hidden">Report</span>
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
            <span className="text-gray-600">Amount Sold</span>
            <span className="font-medium text-gray-900">{amountInput || amount || '0'} BTC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Receiving</span>
            <span className="font-medium text-gray-900">₦{(nairaAmount ?? calculateNairaValue()).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Merchant</span>
            <div className="flex items-center">
              <span className="font-medium text-gray-900 mr-2">MercyPay</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Wallet Network</span>
            <span className="font-medium text-gray-900">Bitcoin (BTC)</span>
          </div>
        </div>
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
      />
    </div>
  );
};

export default PaymentStatus;
