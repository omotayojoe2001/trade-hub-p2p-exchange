import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCryptoPayments } from '@/hooks/useCryptoPayments';
import { useBlockchainAPI } from '@/hooks/useBlockchainAPI';
import { useToast } from '@/hooks/use-toast';
import { bitgoEscrow } from '@/services/bitgoEscrow';

interface EscrowTransaction {
  id: string;
  amount: number;
  coin: string;
  network: string;
  escrowAddress: string;
  receiverBankDetails: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
  receiverWalletAddress?: string; // For crypto buyers
  status: 'pending' | 'vault_created' | 'crypto_received' | 'cash_sent' | 'completed' | 'disputed';
  createdAt: Date;
  txHash?: string;
  vaultId?: string;
  cashConfirmationTime?: Date;
}

interface EscrowFlowManagerProps {
  transactionId: string;
  tradeAmount?: number;
  onStatusChange?: (status: string) => void;
}

export const useEscrowFlowManager = ({ 
  transactionId, 
  tradeAmount,
  onStatusChange 
}: EscrowFlowManagerProps) => {
  const [transaction, setTransaction] = useState<EscrowTransaction | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { getPaymentAddress, verifyPayment } = useCryptoPayments();
  const { verifyTransaction } = useBlockchainAPI();
  const { toast } = useToast();
  const navigate = useNavigate();
  // BitGo escrow service is imported as singleton

  useEffect(() => {
    // Initialize or load transaction from backend
    initializeTransaction();
  }, [transactionId]);

  useEffect(() => {
    if (transaction && transaction.status === 'pending' && !isMonitoring) {
      startCryptoMonitoring();
    }
  }, [transaction]);

  const initializeTransaction = async () => {
    try {
      // Get actual trade amount from props or default
      const actualAmount = tradeAmount || 0.001;
      
      // Create BitGo escrow address with expected amount
      const escrowAddress = await bitgoEscrow.generateEscrowAddress(transactionId, 'BTC', actualAmount);
      
      // Create real escrow transaction
      const transaction: EscrowTransaction = {
        id: transactionId,
        amount: actualAmount,
        coin: 'bitcoin',
        network: 'testnet',
        escrowAddress,
        vaultId: transactionId,
        receiverBankDetails: {
          accountNumber: '',
          bankName: '',
          accountName: ''
        },
        receiverWalletAddress: '',
        status: 'vault_created',
        createdAt: new Date()
      };
      
      setTransaction(transaction);
      
      toast({
        title: "Escrow Address Created",
        description: "BitGo escrow address created successfully",
      });
    } catch (error) {
      console.error('Error initializing transaction:', error);
      toast({
        title: "Error",
        description: "Failed to initialize escrow transaction",
        variant: "destructive",
      });
    }
  };

  const startCryptoMonitoring = () => {
    setIsMonitoring(true);
    
    // Use BitGo monitoring (simplified for now)
    const checkDeposit = async () => {
      if (!transaction?.escrowAddress) return;
      
      try {
        const depositStatus = await bitgoEscrow.checkDeposit(transaction.escrowAddress);
        if (depositStatus.confirmed) {
          updateTransactionStatus('crypto_received');
          setIsMonitoring(false);
          notifyCashSender();
        }
      } catch (error) {
        console.error('Error checking deposit:', error);
      }
    };
    
    // Check every 30 seconds
    const interval = setInterval(checkDeposit, 30000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  };

  const updateTransactionStatus = (status: EscrowTransaction['status'], txHash?: string) => {
    if (!transaction) return;

    const updatedTransaction = {
      ...transaction,
      status,
      ...(txHash && { txHash })
    };

    setTransaction(updatedTransaction);
    onStatusChange?.(status);

    toast({
      title: "Status Updated",
      description: getStatusMessage(status),
    });
  };

  const notifyCashSender = async () => {
    // In production, send notification to cash sender via Supabase
    toast({
      title: "Crypto Received",
      description: "Cash sender has been notified to send payment",
    });
  };

  const confirmCashReceived = async () => {
    if (!transaction) return;

    updateTransactionStatus('cash_sent');
    
    // Release crypto from escrow
    await releaseCryptoFromEscrow();
    
    updateTransactionStatus('completed');
    
    // Generate receipt and navigate to completion
    generateReceipt();
    navigate('/trade-completed', { 
      state: { 
        transactionId: transaction.id,
        type: 'escrow_completed'
      }
    });
  };

  const releaseCryptoFromEscrow = async () => {
    if (!transaction?.receiverWalletAddress) {
      toast({
        title: "Error",
        description: "Recipient wallet address not provided",
        variant: "destructive",
      });
      return;
    }

    try {
      const txid = await bitgoEscrow.releaseFunds(
        transactionId, 
        transaction.receiverWalletAddress,
        transaction.amount,
        'BTC'
      );
      
      toast({
        title: "Crypto Released",
        description: `Crypto released from escrow. TX: ${txid}`,
      });
    } catch (error) {
      console.error('Error releasing crypto:', error);
      toast({
        title: "Error",
        description: "Failed to release crypto from escrow",
        variant: "destructive",
      });
    }
  };

  const generateReceipt = () => {
    if (!transaction) return;

    const receiptData = {
      transactionId: transaction.id,
      amount: transaction.amount,
      coin: transaction.coin,
      escrowAddress: transaction.escrowAddress,
      status: transaction.status,
      completedAt: new Date(),
      bankDetails: transaction.receiverBankDetails
    };

    // Store receipt data for download
    localStorage.setItem(`receipt_${transaction.id}`, JSON.stringify(receiptData));
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Initializing escrow vault';
      case 'vault_created':
        return 'Escrow vault created, waiting for crypto deposit';
      case 'crypto_received':
        return 'Crypto received in escrow, notifying cash sender';
      case 'cash_sent':
        return 'Cash payment confirmed';
      case 'completed':
        return 'Transaction completed successfully';
      case 'disputed':
        return 'Transaction under dispute';
      default:
        return 'Status updated';
    }
  };

  const setReceiverWalletAddress = (address: string) => {
    if (transaction) {
      setTransaction({
        ...transaction,
        receiverWalletAddress: address
      });
    }
  };

  const handleDispute = () => {
    updateTransactionStatus('disputed');
    navigate('/dispute', { 
      state: { 
        transactionId: transaction?.id,
        type: 'escrow_dispute'
      }
    });
  };

  return {
    transaction,
    confirmCashReceived,
    handleDispute,
    isMonitoring,
    updateTransactionStatus,
    setReceiverWalletAddress
  };
};