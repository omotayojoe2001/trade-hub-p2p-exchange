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
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import SessionRecoveryModal from '@/components/SessionRecoveryModal';

const EscrowFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { tradeId, trade, request, amount: initialAmount, mode, deliveryType, deliveryAddress, serviceFee } = (location.state as any) || {};
  
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [transactionId, setTransactionId] = useState<string>(tradeId || 'mock-transaction-id');
  
  const [escrowAddress, setEscrowAddress] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [cryptoPaymentProof, setCryptoPaymentProof] = useState<string>('');
  
  const [showBankDetails, setShowBankDetails] = useState<boolean>(false);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [fiatPaymentProof, setFiatPaymentProof] = useState<string>('');
  
  const [receiptData, setReceiptData] = useState<any>(null);
  const [userRole, setUserRole] = useState<'merchant' | 'buyer'>('merchant');
  const [systemConfirmedCrypto, setSystemConfirmedCrypto] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState('');
  const [showSessionModal, setShowSessionModal] = useState(false);
  
  const { generateQRCode } = useCryptoPayments();
  const { saveSession, getActiveSessionsByType, removeSession } = useSessionPersistence();

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
    coinType: tradeCurrency as 'BTC' | 'ETH' | 'USDT',
    onStatusChange: (status) => {
      handleStatusUpdate(status);
    }
  });

  useEffect(() => {
    const existingSessions = getActiveSessionsByType('escrow');
    if (existingSessions.length > 0) {
      setShowSessionModal(true);
    }
    
    if (buyerWalletAddress) {
      setReceiverWalletAddress(buyerWalletAddress);
    }
    
    if (mode === 'sell-for-cash') {
      setUserRole('merchant');
    } else {
      const roleFromState = location.state?.userRole;
      if (roleFromState === 'buyer') {
        setUserRole('buyer');
      } else {
        setUserRole('merchant');
      }
    }
    
    const newSessionId = location.state?.sessionId || `escrow_${Date.now()}`;
    setSessionId(newSessionId);
    
    fetchMerchantBankDetails();
    
    setBankDetails({
      accountName: 'Loading...',
      accountNumber: 'Loading...',
      bankName: 'Loading...',
      bankCode: '000'
    });
  }, [buyerWalletAddress, trade]);

  useEffect(() => {
    if (currentStep > 0 && sessionId) {
      saveSession({
        id: sessionId,
        type: 'escrow',
        step: currentStep,
        data: {
          transactionId,
          tradeAmount,
          tradeCurrency,
          fiatAmount,
          userRole,
          escrowAddress,
          cryptoPaymentProof,
          fiatPaymentProof,
          systemConfirmedCrypto,
          mode,
          deliveryType,
          deliveryAddress,
          serviceFee
        }
      });
    }
  }, [currentStep, transactionId, escrowAddress, cryptoPaymentProof, fiatPaymentProof, systemConfirmedCrypto, sessionId]);

  const handleStatusUpdate = (status: string) => {
    switch (status) {
      case 'vault_created':
        if (userRole === 'merchant') {
          setCurrentStep(1);
          setShowQRCode(true);
        } else {
          setCurrentStep(1);
        }
        break;
      case 'crypto_received':
        setCurrentStep(2);
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

    toast({
      title: "Payment Confirmed",
      description: "Updating escrow status...",
    });
    
    try {
      let existingTrade = null;
      
      const { data: tradeByRequestId } = await supabase
        .from('trades')
        .select('*')
        .eq('trade_request_id', transactionId)
        .maybeSingle();
        
      if (tradeByRequestId) {
        existingTrade = tradeByRequestId;
      } else {
        const { data: tradeById } = await supabase
          .from('trades')
          .select('*')
          .eq('id', transactionId)
          .maybeSingle();
        existingTrade = tradeById;
      }
      
      if (!existingTrade && tradeId) {
        const { data: tradeByTradeId } = await supabase
          .from('trades')
          .select('*')
          .eq('trade_request_id', tradeId)
          .maybeSingle();
        existingTrade = tradeByTradeId;
      }
      
      if (!existingTrade && trade?.id) {
        const { data: tradeByDirectId } = await supabase
          .from('trades')
          .select('*')
          .eq('id', trade.id)
          .maybeSingle();
        existingTrade = tradeByDirectId;
      }
      
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
        throw updateError;
      }
        
      setSystemConfirmedCrypto(true);
      handleStatusUpdate('crypto_received');
      
      toast({
        title: "Success!",
        description: "Crypto payment confirmed. Buyer will see bank details.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBuyerFiatPayment = () => {
    toast({
      title: "Payment Confirmed",
      description: "Merchant has been notified of your payment.",
    });
    setCurrentStep(3);
  };

  const handleCashReceived = async () => {
    try {
      const { data: trade, error } = await supabase
        .from('trades')
        .select('status, payment_proof_url')
        .eq('trade_request_id', transactionId)
        .single();
        
      if (error || !trade) {
        toast({
          title: "Error",
          description: "Could not verify payment status. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (trade.status !== 'payment_sent' || !trade.payment_proof_url) {
        toast({
          title: "Payment Not Confirmed",
          description: "Buyer has not uploaded payment proof yet. Please wait for confirmation.",
          variant: "destructive"
        });
        return;
      }
      
      setShowConfirmDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not verify payment status. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const confirmRelease = async () => {
    setShowConfirmDialog(false);
    
    try {
      let trade = null;
      
      const { data: tradeById } = await supabase
        .from('trades')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle();
        
      if (tradeById) {
        trade = tradeById;
      } else {
        const { data: tradeByRequestId } = await supabase
          .from('trades')
          .select('*')
          .eq('trade_request_id', transactionId)
          .maybeSingle();
        trade = tradeByRequestId;
      }
        
      if (!trade) {
        throw new Error('Trade not found');
      }
      
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
        throw updateError;
      }
      
      toast({
        title: "Trade Completed!",
        description: "Crypto has been released from escrow.",
      });
      
      await confirmCashReceived();
      setCurrentStep(4);
    } catch (error) {
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
        setBankDetails({
          accountName: user.user_metadata?.display_name || 'Merchant',
          accountNumber: 'Not Set',
          bankName: 'Please add payment method',
          bankCode: '000'
        });
      }
    } catch (error) {
      setBankDetails({
        accountName: user.user_metadata?.display_name || 'Merchant',
        accountNumber: 'Error loading',
        bankName: 'Please try again',
        bankCode: '000'
      });
    }
  };

  const handleRestoreSession = (session: any) => {
    setSessionId(session.id);
    setCurrentStep(session.step);
    setTransactionId(session.data.transactionId || transactionId);
    setEscrowAddress(session.data.escrowAddress || '');
    setCryptoPaymentProof(session.data.cryptoPaymentProof || '');
    setFiatPaymentProof(session.data.fiatPaymentProof || '');
    setSystemConfirmedCrypto(session.data.systemConfirmedCrypto || false);
    setShowSessionModal(false);
    
    toast({
      title: "Session Restored",
      description: `Resumed your escrow transaction at step ${session.step}`,
    });
  };

  const handleDismissSession = (sessionId: string) => {
    removeSession(sessionId);
    const remainingSessions = getActiveSessionsByType('escrow').filter(s => s.id !== sessionId);
    if (remainingSessions.length === 0) {
      setShowSessionModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
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

      <div className="p-4 bg-gray-50">
        <div className="flex items-center">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
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
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>Crypto</span>
          <span>Payment</span>
          <span>Confirm</span>
          <span>Complete</span>
        </div>
      </div>

      <div className="p-4">
        <div>Basic escrow flow content</div>
      </div>
      
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
      
      <SessionRecoveryModal
        sessions={showSessionModal ? getActiveSessionsByType('escrow') : []}
        onRestore={handleRestoreSession}
        onDismiss={handleDismissSession}
        onClose={() => setShowSessionModal(false)}
      />
    </div>
  );
};

export default EscrowFlow;