import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Shield, Copy, CheckCircle, Clock, AlertTriangle, Upload, CreditCard, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEscrowFlowManager } from '@/components/escrow/EscrowFlowManager';
import { ReceiptGenerator } from '@/components/escrow/ReceiptGenerator';
import { useCryptoPayments } from '@/hooks/useCryptoPayments';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const EscrowFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { tradeId, trade, request, amount: initialAmount, mode, deliveryType, deliveryAddress, serviceFee } = (location.state as any) || {};
  
  // Get user ID from auth context
  const { user } = useAuth();
  
  // Step management - based on actual escrow flow requirements
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [transactionId, setTransactionId] = useState<string>(tradeId || 'mock-transaction-id');
  
  // Step 1: Escrow vault creation and crypto deposit instruction
  const [escrowAddress, setEscrowAddress] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [cryptoPaymentProof, setCryptoPaymentProof] = useState<string>('');
  
  // Step 2: Payment confirmation and bank details display (only after crypto deposited)
  const [showBankDetails, setShowBankDetails] = useState<boolean>(false);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [fiatPaymentProof, setFiatPaymentProof] = useState<string>('');
  
  // Step 3: Completion and receipt
  const [receiptData, setReceiptData] = useState<any>(null);
  const [userRole, setUserRole] = useState<'merchant' | 'buyer'>('merchant'); // Determine user role
  const [systemConfirmedCrypto, setSystemConfirmedCrypto] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  
  const { generateQRCode } = useCryptoPayments();

  // Extract trade details from passed data
  const tradeAmount = trade?.amount_crypto || request?.amount_crypto || initialAmount || 0;
  const tradeCurrency = trade?.crypto_type || request?.crypto_type || 'BTC';
  const fiatAmount = trade?.amount_fiat || request?.amount_fiat || (location.state?.nairaAmount || 0);
  const buyerWalletAddress = trade?.receiver_wallet_address || '';

  const {
    transaction,
    confirmCashReceived,
    handleDispute: escrowHandleDispute,
    isMonitoring,
    setReceiverWalletAddress
  } = useEscrowFlowManager({
    transactionId,
    tradeAmount,
    onStatusChange: (status) => {
      handleStatusUpdate(status);
    }
  });

  useEffect(() => {
    // Set the buyer's wallet address for crypto release
    if (buyerWalletAddress) {
      setReceiverWalletAddress(buyerWalletAddress);
    }
    
    // Set user role based on mode
    if (mode === 'sell-for-cash') {
      setUserRole('merchant'); // User is selling crypto, so they are the merchant
    } else {
      const roleFromState = location.state?.userRole;
      if (roleFromState === 'buyer') {
        setUserRole('buyer');
      } else {
        setUserRole('merchant'); // Default to merchant who deposits crypto
      }
    }
    
    // Fetch merchant's real bank details
    fetchMerchantBankDetails();
    
    // Also set default bank details as fallback
    setBankDetails({
      accountName: 'Loading...',
      accountNumber: 'Loading...',
      bankName: 'Loading...',
      bankCode: '000'
    });
  }, [buyerWalletAddress, trade]);

  const handleStatusUpdate = (status: string) => {
    switch (status) {
      case 'vault_created':
        if (userRole === 'merchant') {
          setCurrentStep(1); // Merchant deposits crypto
          setShowQRCode(true);
        } else {
          setCurrentStep(1); // Buyer waits for merchant deposit
        }
        break;
      case 'crypto_received':
        setCurrentStep(2); // Both see step 2 - buyer makes payment
        setShowBankDetails(true);
        setSystemConfirmedCrypto(true);
        toast({
          title: "Crypto Secured!",
          description: userRole === 'buyer' 
            ? "Crypto is in escrow. Send payment to merchant's account."
            : "Crypto deposited to escrow. Buyer can now send cash payment.",
        });
        break;
      case 'completed':
        setCurrentStep(4);
        generateReceiptData();
        break;
    }
  };

  const handleMerchantCryptoPayment = async () => {
    if (!cryptoPaymentProof) {
      toast({
        title: "Proof Required",
        description: "Please upload proof or enter transaction hash",
        variant: "destructive"
      });
      return;
    }

    // Merchant confirms they sent crypto to escrow
    toast({
      title: "Payment Confirmed",
      description: "Updating escrow status...",
    });
    
    // Update database immediately
    try {
      console.log('Updating escrow status for transactionId:', transactionId);
      console.log('tradeId from location.state:', tradeId);
      console.log('All location.state:', location.state);
      
      // Try to find trade by multiple possible IDs
      let existingTrade = null;
      
      // Try trade_request_id first
      const { data: tradeByRequestId } = await supabase
        .from('trades')
        .select('*')
        .eq('trade_request_id', transactionId)
        .maybeSingle();
        
      if (tradeByRequestId) {
        existingTrade = tradeByRequestId;
      } else {
        // Try by trade ID
        const { data: tradeById } = await supabase
          .from('trades')
          .select('*')
          .eq('id', transactionId)
          .maybeSingle();
        existingTrade = tradeById;
      }
      
      // If still not found, try using tradeId from location.state
      if (!existingTrade && tradeId) {
        const { data: tradeByTradeId } = await supabase
          .from('trades')
          .select('*')
          .eq('trade_request_id', tradeId)
          .maybeSingle();
        existingTrade = tradeByTradeId;
      }
      
      // If still not found, try finding by trade ID directly
      if (!existingTrade && trade?.id) {
        const { data: tradeByDirectId } = await supabase
          .from('trades')
          .select('*')
          .eq('id', trade.id)
          .maybeSingle();
        existingTrade = tradeByDirectId;
      }
        
      console.log('Found trade:', existingTrade);
      
      if (!existingTrade) {
        throw new Error('Trade not found');
      }
      
      const { data: updatedTrade, error: updateError } = await supabase
        .from('trades')
        .update({ escrow_status: 'crypto_deposited' })
        .eq('id', existingTrade.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating trade:', updateError);
        throw updateError;
      }
      
      console.log('Trade updated:', updatedTrade);
        
      setSystemConfirmedCrypto(true);
      handleStatusUpdate('crypto_received');
      
      toast({
        title: "Success!",
        description: "Crypto payment confirmed. Buyer will see bank details.",
      });
    } catch (error) {
      console.error('Error updating escrow status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBuyerFiatPayment = () => {
    // Buyer confirms they sent fiat payment
    toast({
      title: "Payment Confirmed",
      description: "Merchant has been notified of your payment.",
    });
    setCurrentStep(3); // Move to waiting for merchant confirmation
  };

  const handleCashReceived = () => {
    setShowConfirmDialog(true);
  };
  
  const confirmRelease = async () => {
    setShowConfirmDialog(false);
    
    try {
      // Update trade status to completed in database
      console.log('Looking for trade with transactionId:', transactionId);
      
      // Try multiple ways to find the trade
      let trade = null;
      let fetchError = null;
      
      // First try by trade ID directly
      const { data: tradeById, error: error1 } = await supabase
        .from('trades')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle();
        
      if (tradeById) {
        trade = tradeById;
      } else {
        // Try by trade_request_id
        const { data: tradeByRequestId, error: error2 } = await supabase
          .from('trades')
          .select('*')
          .eq('trade_request_id', transactionId)
          .maybeSingle();
        trade = tradeByRequestId;
        fetchError = error2;
      }
      
      console.log('Found trade:', trade);
        
      if (fetchError) {
        console.error('Error fetching trade:', fetchError);
        throw fetchError;
      }
        
      if (!trade) {
        console.error('No trade found for transaction ID:', transactionId);
        
        // List all trades to debug
        const { data: allTrades } = await supabase
          .from('trades')
          .select('id, trade_request_id, status')
          .limit(10);
        console.log('Available trades:', allTrades);
        
        throw new Error('Trade not found');
      }
      
      console.log('Updating trade status to completed for trade:', trade.id);
      
      const { error: updateError } = await supabase
        .from('trades')
        .update({ 
          status: 'completed',
          escrow_status: 'completed',
          transaction_hash: `bitgo-${Date.now()}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', trade.id);
        
      if (updateError) {
        console.error('Error updating trade status:', updateError);
        throw updateError;
      }
      
      console.log('Trade status updated to completed successfully');
      
      toast({
        title: "Trade Completed!",
        description: "Crypto has been released from escrow.",
      });
      
      await confirmCashReceived();
      setCurrentStep(4); // Move to completion
    } catch (error) {
      console.error('Error confirming release:', error);
      toast({
        title: "Error",
        description: "Failed to complete trade. Please try again.",
        variant: "destructive"
      });
    }
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

  const fetchMerchantBankDetails = async () => {
    if (!user?.id) return;
    
    try {
      const { data: paymentMethods, error } = await (supabase as any)
        .rpc('get_merchant_payment_method', { merchant_id: user.id });
        
      if (error) {
        console.error('RPC error:', error);
        throw error;
      }
        
      const paymentMethod = paymentMethods?.[0];
      
      if (paymentMethod) {
        setBankDetails({
          accountName: paymentMethod.account_name,
          accountNumber: paymentMethod.account_number,
          bankName: paymentMethod.bank_name,
          bankCode: paymentMethod.bank_code
        });
      } else {
        // Fallback to default details if no payment method found
        setBankDetails({
          accountName: user.user_metadata?.display_name || 'Merchant',
          accountNumber: 'Not Set',
          bankName: 'Please add payment method',
          bankCode: '000'
        });
      }
    } catch (error) {
      console.error('Error fetching merchant bank details:', error);
      // Set fallback details on error
      setBankDetails({
        accountName: user.user_metadata?.display_name || 'Merchant',
        accountNumber: 'Error loading',
        bankName: 'Please try again',
        bankCode: '000'
      });
    }
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
                  {mode === 'sell-for-cash' ? 'Deposit Crypto to Sell for Cash' : 
                   userRole === 'merchant' ? 'Send Crypto to Escrow' : 'Waiting for Crypto Deposit'}
                </h2>
                <p className="text-gray-600">
                  {mode === 'sell-for-cash' 
                    ? `Deposit ${tradeAmount} ${tradeCurrency} to escrow. Your trade request will go to all users for fastest acceptance.`
                    : userRole === 'merchant' 
                    ? `Send ${tradeAmount} ${tradeCurrency} to the secure escrow address below`
                    : 'Merchant is depositing crypto into secure BitGo escrow'
                  }
                </p>
              </div>

              {transaction?.escrowAddress && userRole === 'merchant' && (
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
                      BitGo Escrow Address:
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

                  {/* Payment Proof Upload */}
                  <div className="space-y-3">
                    <Label htmlFor="crypto-proof">Upload Proof of Payment or Type Hash</Label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setCryptoPaymentProof(e.target.files[0].name);
                          }
                        }}
                      />
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="flex-1"
                        >
                          <Upload size={16} className="mr-2" />
                          Upload (JPEG/PNG/PDF)
                        </Button>
                      </div>
                      <div className="text-center text-sm text-gray-500">OR</div>
                      <Input
                        id="crypto-proof"
                        placeholder="Type transaction hash"
                        value={cryptoPaymentProof}
                        onChange={(e) => setCryptoPaymentProof(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Merchant Confirmation Button */}
                  <Button
                    onClick={handleMerchantCryptoPayment}
                    disabled={!cryptoPaymentProof}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                  >
                    {mode === 'sell-for-cash' ? 'I Have Deposited the Crypto' : 'I Have Made the Payment'}
                  </Button>
                </div>
              )}

              {userRole === 'buyer' && (
                <div className="text-center py-8">
                  <Clock size={32} className="text-orange-500 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium">Waiting for merchant to deposit crypto...</p>
                  <p className="text-sm text-gray-500 mt-2">You will be notified when crypto is secured in escrow</p>
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">What's happening:</p>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Merchant is sending {tradeAmount} {tradeCurrency} to escrow</li>
                      <li>• BitGo will verify the deposit</li>
                      <li>• You'll get bank details once confirmed</li>
                    </ul>
                  </div>
                </div>
              )}

              {!transaction?.escrowAddress && userRole === 'merchant' && (
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
                    {userRole === 'merchant' ? (
                      <>
                        <li>• Send crypto only to the address above</li>
                        <li>• Once confirmed, buyer will receive bank details for cash payment</li>
                        <li>• Do not send from exchange accounts - use personal wallet</li>
                        <li>• Transaction is monitored in real-time by BitGo</li>
                      </>
                    ) : (
                      <>
                        <li>• Crypto is being secured in institutional-grade escrow</li>
                        <li>• You will receive bank details once crypto is confirmed</li>
                        <li>• Your payment will be protected until trade completion</li>
                        <li>• BitGo provides enterprise-level security</li>
                      </>
                    )}
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
                  {mode === 'sell-for-cash' ? 'Crypto Secured! Finding Buyer...' : 'Crypto Secured in Escrow!'}
                </h2>
                <p className="text-gray-600">
                  {mode === 'sell-for-cash'
                    ? `Your ${tradeAmount} ${tradeCurrency} is secured. Trade request sent to all users. Fastest buyer will pay vendor for your cash ${deliveryType}.`
                    : userRole === 'buyer' 
                    ? `Merchant has deposited crypto in escrow. Send ₦${fiatAmount?.toLocaleString()} to complete the trade.`
                    : `Crypto secured in escrow. Buyer has been notified to send ₦${fiatAmount?.toLocaleString()}.`
                  }
                </p>
              </div>

              {bankDetails && systemConfirmedCrypto && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <CreditCard size={20} className="text-blue-600 mr-2" />
                      <h3 className="font-medium text-blue-800">
                        {userRole === 'buyer' ? 'Send Payment To:' : 'Your Bank Details (shown to buyer):'}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Account Name:</span>
                        <span className="font-medium text-blue-900">{bankDetails.accountName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Account Number:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-blue-900">{bankDetails.accountNumber}</span>
                          {userRole === 'buyer' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(bankDetails.accountNumber, 'Account number')}
                            >
                              <Copy size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Bank Name:</span>
                        <span className="font-medium text-blue-900">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Amount {userRole === 'buyer' ? 'to Send' : 'Expected'}:</span>
                        <span className="font-bold text-blue-900 text-lg">₦{fiatAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {userRole === 'buyer' && (
                    <div className="space-y-4">
                      {/* Payment Proof Upload */}
                      <div className="space-y-3">
                        <Label htmlFor="fiat-proof">Upload Payment Proof (Optional)</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="fiat-proof"
                            placeholder="Receipt URL or transaction reference"
                            value={fiatPaymentProof}
                            onChange={(e) => setFiatPaymentProof(e.target.value)}
                          />
                          <Button size="sm" variant="outline">
                            <Upload size={16} />
                          </Button>
                        </div>
                      </div>

                      {/* Buyer Confirmation Button */}
                      <Button
                        onClick={handleBuyerFiatPayment}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        I Have Made the Payment
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {!systemConfirmedCrypto && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800 font-medium">Waiting for System Confirmation</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Bank details will be shown once BitGo confirms crypto deposit.
                  </p>
                </div>
              )}
            </Card>

            {mode === 'sell-for-cash' ? (
              <Card className="p-4 border-green-200 bg-green-50">
                <h4 className="font-medium text-green-800 mb-2">Cash Delivery in Progress</h4>
                <p className="text-sm text-green-700 mb-4">
                  A buyer has accepted your trade! They will pay the vendor who will deliver cash to your {deliveryType === 'delivery' ? 'address' : 'pickup location'}.
                  You will be notified when cash is ready for {deliveryType}.
                </p>
                
                {deliveryType === 'delivery' && deliveryAddress && (
                  <div className="bg-white p-3 rounded border border-green-200 mb-3">
                    <p className="text-sm text-green-800 font-medium">Delivery Address:</p>
                    <p className="text-xs text-green-700">{deliveryAddress}</p>
                  </div>
                )}
                
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-sm text-green-800 font-medium">Service Fee: {serviceFee} credits (already deducted)</p>
                  <p className="text-xs text-green-600 mt-1">Vendor will contact you for {deliveryType} details</p>
                </div>
              </Card>
            ) : userRole === 'merchant' && (
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
            )}

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
        return userRole === 'buyer' ? (
          // Buyer waiting for merchant confirmation
          <div className="space-y-6">
            <Card className="p-6">
              <div className="text-center mb-6">
                <Clock size={48} className="text-orange-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Waiting for Merchant Confirmation
                </h2>
                <p className="text-gray-600">
                  Your payment confirmation has been sent. Waiting for merchant to verify and release crypto.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Merchant verifies payment in their bank account</li>
                  <li>• Once confirmed, crypto will be released from escrow</li>
                  <li>• You will receive {tradeAmount} {tradeCurrency} in your wallet</li>
                  <li>• Transaction will be marked as completed</li>
                </ul>
              </div>
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
        ) : (
          // Merchant waiting for buyer payment confirmation - same as case 3 buyer view
          <div className="space-y-6">
            <Card className="p-6">
              <div className="text-center mb-6">
                <Clock size={48} className="text-orange-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Waiting for Payment Confirmation
                </h2>
                <p className="text-gray-600">
                  Buyer has been notified to send payment. You will be notified when they confirm.
                </p>
              </div>
            </Card>
          </div>
        );

      case 4:
        return (
          // Completed transaction for both parties
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Transaction Completed!
              </h2>
              <p className="text-gray-600">
                {userRole === 'buyer' 
                  ? `You have received ${tradeAmount} ${tradeCurrency} in your wallet`
                  : `Crypto has been successfully released from escrow to the buyer`
                }
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
                onClick={() => navigate('/trade-completed', {
                  state: {
                    tradeId: transactionId,
                    date: new Date().toLocaleString(),
                    amountSold: tradeAmount,
                    coin: tradeCurrency,
                    rate: `₦${Math.round(fiatAmount / tradeAmount).toLocaleString()}/${tradeCurrency}`,
                    totalReceived: `₦${fiatAmount.toLocaleString()}`,
                    platformFee: `₦${Math.round(fiatAmount * 0.005).toLocaleString()}`,
                    netAmount: `₦${Math.round(fiatAmount * 0.995).toLocaleString()}`,
                    merchant: bankDetails?.accountName || 'Merchant',
                    bankAccount: `${bankDetails?.bankName} • • • • ${bankDetails?.accountNumber?.slice(-4)}`,
                    status: 'completed'
                  }
                })}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                View Receipt
              </Button>
              <Button 
                onClick={() => navigate('/trade-requests')}
                variant="outline"
                className="w-full"
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
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">BitGo Escrow</h1>
            <p className="text-sm text-gray-500">Secure crypto transaction</p>
          </div>
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
          <span>Crypto</span>
          <span>Payment</span>
          <span>Confirm</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderStepContent()}
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">⚠️ Confirm Escrow Release</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowConfirmDialog(false)}>
                <X size={16} />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">
                This will release <strong>{tradeAmount} {tradeCurrency}</strong> from escrow to the buyer's wallet.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Are you sure you have received the payment?</strong>
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  This action cannot be undone once confirmed.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmRelease}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Yes, Release Crypto
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscrowFlow;