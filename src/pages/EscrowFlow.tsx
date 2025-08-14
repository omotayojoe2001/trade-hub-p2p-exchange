import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEscrowFlowManager } from '@/components/escrow/EscrowFlowManager';
import { EscrowStatusDisplay } from '@/components/escrow/EscrowStatusDisplay';
import { ReceiptGenerator } from '@/components/escrow/ReceiptGenerator';
import { CurrencySelector } from '@/components/CurrencySelector';
import { useCryptoPayments } from '@/hooks/useCryptoPayments';
import AmountInput from '@/components/sell-crypto/AmountInput';

interface MerchantSelection {
  type: 'auto' | 'manual';
  selectedMerchant?: {
    id: string;
    name: string;
    rating: number;
    completedTrades: number;
  };
}

const EscrowFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount: initialAmount, mode } = (location.state as any) || {};
  
  // Step management
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [transactionId, setTransactionId] = useState<string>('');
  
  // Step 1: Transaction Type & Amount
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTC');
  const [amount, setAmount] = useState<string>(initialAmount || '');
  const [currentRate, setCurrentRate] = useState<number>(1755000);
  
  // Step 2: Merchant Selection
  const [merchantSelection, setMerchantSelection] = useState<MerchantSelection>({ type: 'auto' });
  
  // Step 3: Escrow Status
  const [escrowStatus, setEscrowStatus] = useState<'pending' | 'crypto_received' | 'cash_sent' | 'completed' | 'disputed'>('pending');
  const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60); // 30 minutes
  
  // Step 4: Receipt
  const [receiptData, setReceiptData] = useState<any>(null);
  
  const { getPaymentAddress, generateQRCode } = useCryptoPayments();

  // Live rate simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 10000;
      setCurrentRate(prev => Math.max(1745000, Math.min(1765000, prev + variation)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (currentStep === 3 && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep, timeRemaining]);

  const calculateNairaValue = () => {
    const a = parseFloat(amount || '0');
    if (isNaN(a)) return 0;
    return a * currentRate;
  };

  const handleStepForward = () => {
    if (currentStep === 1) {
      // Generate transaction ID and move to merchant selection
      const newTransactionId = `ESC-${Date.now()}`;
      setTransactionId(newTransactionId);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Move to escrow monitoring
      setCurrentStep(3);
      // Start monitoring process
      startEscrowProcess();
    }
  };

  const startEscrowProcess = () => {
    // Simulate escrow process
    setTimeout(() => {
      setEscrowStatus('crypto_received');
    }, 5000);
  };

  const handleCashConfirmed = () => {
    setEscrowStatus('completed');
    
    // Generate receipt data
    const receipt = {
      transactionId,
      amount: parseFloat(amount),
      coin: selectedCrypto,
      escrowAddress: getPaymentAddress('bitcoin', 'mainnet').address,
      receiverBankDetails: {
        accountNumber: '1234567890',
        bankName: 'First Bank Nigeria',
        accountName: 'John Doe'
      },
      completedAt: new Date(),
      txHash: 'mock-tx-hash-12345'
    };
    
    setReceiptData(receipt);
    setCurrentStep(4);
  };

  const handleDispute = () => {
    setEscrowStatus('disputed');
    navigate('/dispute', { 
      state: { 
        transactionId,
        type: 'escrow_dispute'
      }
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Transaction Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Cryptocurrency
                  </label>
                  <CurrencySelector 
                    value={selectedCrypto}
                    onValueChange={setSelectedCrypto}
                    className="w-full"
                  />
                </div>
                
                <AmountInput
                  amount={amount}
                  onAmountChange={setAmount}
                  currentRate={currentRate}
                  calculateNairaValue={calculateNairaValue}
                />
              </div>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">How Escrow Works</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your crypto is held securely until cash is confirmed</li>
                <li>• Cash sender receives your bank details</li>
                <li>• You confirm cash receipt to release crypto</li>
                <li>• Auto-refund if no confirmation within 30 minutes</li>
              </ul>
            </div>

            <Button 
              onClick={handleStepForward}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue to Merchant Selection
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Choose Merchant</h2>
              
              <div className="space-y-4">
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    merchantSelection.type === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setMerchantSelection({ type: 'auto' })}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Auto Merchant Match</h3>
                      <p className="text-sm text-gray-600">Platform finds the best merchant for you</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
                      {merchantSelection.type === 'auto' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                  </div>
                </div>

                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    merchantSelection.type === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setMerchantSelection({ type: 'manual' })}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Manual Selection</h3>
                      <p className="text-sm text-gray-600">Choose from a list of available merchants</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
                      {merchantSelection.type === 'manual' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                  </div>
                </div>
              </div>

              {merchantSelection.type === 'manual' && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-gray-900">Available Merchants</h4>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">MercyPay</p>
                        <p className="text-sm text-gray-600">★★★★☆ 4.8 • 127 trades</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setMerchantSelection({ 
                          type: 'manual', 
                          selectedMerchant: { id: '1', name: 'MercyPay', rating: 4.8, completedTrades: 127 }
                        })}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Button 
              onClick={handleStepForward}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Escrow Process
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Escrow in Progress</h2>
              
              <EscrowStatusDisplay
                status={escrowStatus}
                amount={parseFloat(amount)}
                coin={selectedCrypto}
                escrowAddress={getPaymentAddress('bitcoin', 'mainnet').address}
                timeRemaining={timeRemaining}
                onConfirmCash={handleCashConfirmed}
                onDispute={handleDispute}
              />
            </Card>

            {escrowStatus === 'pending' && (
              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Send Crypto to Escrow</h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <img 
                      src={generateQRCode(getPaymentAddress('bitcoin', 'mainnet').address, parseFloat(amount))} 
                      alt="Escrow QR Code" 
                      className="w-32 h-32 mx-auto mb-2"
                    />
                    <p className="text-xs text-gray-600">Scan to send {amount} {selectedCrypto}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600">Escrow Address:</p>
                    <p className="font-mono break-all">{getPaymentAddress('bitcoin', 'mainnet').address}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 text-center">Transaction Completed!</h2>
            
            {receiptData && (
              <ReceiptGenerator 
                receiptData={receiptData}
                onDownload={() => console.log('Receipt downloaded')}
                onShare={(platform) => console.log(`Shared to ${platform}`)}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => navigate('/my-trades')}
                variant="outline"
                className="w-full"
              >
                View My Trades
              </Button>
              <Button 
                onClick={() => navigate('/buy-sell')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                New Trade
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/buy-sell">
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Crypto Escrow</h1>
        </div>
        <MoreVertical size={24} className="text-gray-700" />
      </div>

      {/* Progress Bar */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step ? '✓' : step}
              </div>
              {step < 4 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  currentStep > step ? 'bg-blue-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>Details</span>
          <span>Merchant</span>
          <span>Escrow</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default EscrowFlow;