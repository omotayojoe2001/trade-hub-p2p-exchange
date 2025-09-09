import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Shield, Copy, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEscrowFlowManager } from '@/components/escrow/EscrowFlowManager';
import { ReceiptGenerator } from '@/components/escrow/ReceiptGenerator';
import { useCryptoPayments } from '@/hooks/useCryptoPayments';
import { useToast } from '@/hooks/use-toast';

const EscrowFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { tradeId, trade, request, amount: initialAmount, mode } = (location.state as any) || {};
  
  // Step management - based on actual escrow flow requirements
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [transactionId, setTransactionId] = useState<string>(tradeId || 'mock-transaction-id');
  
  // Step 1: Escrow vault creation and crypto deposit instruction
  const [escrowAddress, setEscrowAddress] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  
  // Step 2: Payment confirmation and bank details display (only after crypto deposited)
  const [showBankDetails, setShowBankDetails] = useState<boolean>(false);
  const [bankDetails, setBankDetails] = useState<any>(null);
  
  // Step 3: Completion and receipt
  const [receiptData, setReceiptData] = useState<any>(null);
  
  const { generateQRCode } = useCryptoPayments();

  const {
    transaction,
    confirmCashReceived,
    handleDispute: escrowHandleDispute,
    isMonitoring,
    setReceiverWalletAddress
  } = useEscrowFlowManager({
    transactionId,
    onStatusChange: (status) => {
      handleStatusUpdate(status);
    }
  });

  // Extract trade details from passed data
  const tradeAmount = trade?.amount_crypto || request?.amount_crypto || initialAmount || 0;
  const tradeCurrency = trade?.crypto_type || request?.crypto_type || 'BTC';
  const fiatAmount = trade?.amount_fiat || request?.amount_fiat || 0;
  const buyerWalletAddress = trade?.receiver_wallet_address || '';

  useEffect(() => {
    // Set the buyer's wallet address for crypto release
    if (buyerWalletAddress) {
      setReceiverWalletAddress(buyerWalletAddress);
    }
    
    // Get mock bank details (in production, fetch from merchant profile)
    setBankDetails({
      accountName: 'John Merchant',
      accountNumber: '1234567890',
      bankName: 'First Bank Nigeria',
      bankCode: '011'
    });
  }, [buyerWalletAddress]);

  const handleStatusUpdate = (status: string) => {
    switch (status) {
      case 'vault_created':
        setCurrentStep(1);
        setShowQRCode(true);
        break;
      case 'crypto_received':
        setCurrentStep(2);
        setShowBankDetails(true);
        toast({
          title: "Crypto Received!",
          description: "Crypto deposited to escrow. Buyer can now send cash payment.",
        });
        break;
      case 'completed':
        setCurrentStep(3);
        generateReceiptData();
        break;
    }
  };

  const handleCashReceived = async () => {
    await confirmCashReceived();
  };

  const generateReceiptData = () => {
    const receipt = {
      transactionId,
      amount: tradeAmount,
      coin: tradeCurrency,
      fiatAmount,
      escrowAddress: transaction?.escrowAddress || escrowAddress,
      receiverBankDetails: bankDetails,
      buyerWalletAddress,
      completedAt: new Date(),
      txHash: transaction?.txHash || '',
    };
    
    setReceiptData(receipt);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="text-center mb-6">
                <Shield size={48} className="text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Fireblocks Escrow Vault Created
                </h2>
                <p className="text-gray-600">
                  Send {tradeAmount} {tradeCurrency} to the secure escrow address below
                </p>
              </div>

              {transaction?.escrowAddress && (
                <div className="space-y-4">
                  {/* QR Code */}
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <img 
                      src={generateQRCode(transaction.escrowAddress, tradeAmount)} 
                      alt="Escrow QR Code" 
                      className="w-40 h-40 mx-auto mb-3"
                    />
                    <p className="text-sm text-gray-600">
                      Scan to send {tradeAmount} {tradeCurrency}
                    </p>
                  </div>

                  {/* Escrow Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Fireblocks Escrow Address:
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 p-3 bg-gray-100 rounded font-mono text-sm break-all">
                        {transaction.escrowAddress}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(transaction.escrowAddress!, 'Escrow address')}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Amount to send:</strong> {tradeAmount} {tradeCurrency}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Make sure to send exactly this amount to the escrow address
                    </p>
                  </div>

                  {/* Vault ID */}
                  {transaction.vaultId && (
                    <div className="text-sm text-gray-600">
                      <p>Vault ID: <span className="font-mono text-xs">{transaction.vaultId}</span></p>
                    </div>
                  )}
                </div>
              )}

              {!transaction?.escrowAddress && (
                <div className="text-center py-8">
                  <Clock size={32} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Creating escrow vault...</p>
                </div>
              )}
            </Card>

            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Important Instructions</h4>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Send crypto only to the address above</li>
                    <li>• Once confirmed, buyer will receive bank details for cash payment</li>
                    <li>• Do not send from exchange accounts - use personal wallet</li>
                    <li>• Transaction is monitored in real-time by Fireblocks</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="text-center mb-6">
                <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Crypto Received in Escrow!
                </h2>
                <p className="text-gray-600">
                  Buyer has been notified to send ₦{fiatAmount} to your bank account
                </p>
              </div>

              {bankDetails && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-800 mb-3">Your Bank Details (shown to buyer):</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-700">Account Name:</span>
                        <span className="font-medium text-green-900">{bankDetails.accountName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Account Number:</span>
                        <span className="font-medium text-green-900">{bankDetails.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Bank Name:</span>
                        <span className="font-medium text-green-900">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Amount Expected:</span>
                        <span className="font-medium text-green-900">₦{fiatAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-4 border-orange-200 bg-orange-50">
              <h4 className="font-medium text-orange-800 mb-2">Waiting for Cash Payment</h4>
              <p className="text-sm text-orange-700 mb-4">
                Once you receive the cash payment in your bank account, click the button below to release the crypto from escrow.
              </p>
              
              <Button
                onClick={handleCashReceived}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                I Have Received the Payment
              </Button>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium text-gray-800 mb-2">Having Issues?</h4>
              <Button
                onClick={escrowHandleDispute}
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
              >
                Report Dispute
              </Button>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Transaction Completed!
              </h2>
              <p className="text-gray-600">
                Crypto has been successfully released from escrow
              </p>
            </div>
            
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
                onClick={() => navigate('/trade-requests')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                New Requests
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
          <Link to="/trade-requests">
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Fireblocks Escrow</h1>
            <p className="text-sm text-gray-500">Secure crypto transaction</p>
          </div>
        </div>
        <MoreVertical size={24} className="text-gray-700" />
      </div>

      {/* Progress Bar */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
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
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>Crypto Deposit</span>
          <span>Cash Payment</span>
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