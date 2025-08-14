import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCryptoPayments } from '@/hooks/useCryptoPayments';
import { useBlockchainAPI } from '@/hooks/useBlockchainAPI';
import { useToast } from '@/hooks/use-toast';

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
  status: 'pending' | 'crypto_received' | 'cash_sent' | 'completed' | 'disputed';
  createdAt: Date;
  txHash?: string;
  cashConfirmationTime?: Date;
}

interface EscrowFlowManagerProps {
  transactionId: string;
  onStatusChange?: (status: string) => void;
}

export const useEscrowFlowManager = ({ 
  transactionId, 
  onStatusChange 
}: EscrowFlowManagerProps) => {
  const [transaction, setTransaction] = useState<EscrowTransaction | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { getPaymentAddress, verifyPayment } = useCryptoPayments();
  const { verifyTransaction } = useBlockchainAPI();
  const { toast } = useToast();
  const navigate = useNavigate();

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
    // In production, fetch from Supabase
    // For now, create mock transaction
    const mockTransaction: EscrowTransaction = {
      id: transactionId,
      amount: 0.5,
      coin: 'bitcoin',
      network: 'mainnet',
      escrowAddress: getPaymentAddress('bitcoin', 'mainnet').address,
      receiverBankDetails: {
        accountNumber: '1234567890',
        bankName: 'First Bank',
        accountName: 'John Doe'
      },
      status: 'pending',
      createdAt: new Date()
    };
    
    setTransaction(mockTransaction);
  };

  const startCryptoMonitoring = () => {
    setIsMonitoring(true);
    
    const monitoringInterval = setInterval(async () => {
      if (!transaction) return;

      try {
        // Check blockchain for incoming transactions
        const verification = await verifyTransaction(
          transaction.txHash || 'mock-hash', 
          transaction.coin === 'bitcoin' ? 'btc' : 'eth'
        );

        if (verification && verification.status === 'confirmed') {
          updateTransactionStatus('crypto_received', verification.hash);
          clearInterval(monitoringInterval);
          setIsMonitoring(false);
          
          // Notify cash sender
          await notifyCashSender();
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds

    // Clear after 30 minutes
    setTimeout(() => {
      clearInterval(monitoringInterval);
      setIsMonitoring(false);
    }, 30 * 60 * 1000);
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
    // In production, this would trigger blockchain transaction
    // to release crypto from escrow to cash sender
    toast({
      title: "Crypto Released",
      description: "Crypto has been released from escrow to the cash sender",
    });
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
        return 'Waiting for crypto payment';
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
    updateTransactionStatus
  };
};