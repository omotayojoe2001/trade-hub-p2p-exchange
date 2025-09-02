
import React, { useState } from 'react';
import { Star, CheckCircle, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useParams } from 'react-router-dom';
import { TradeTemplate } from '@/components/TradeTemplate';

const TradeDetails = () => {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const [txId, setTxId] = useState('');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);

  // Mock transactions data for demo
  const mockTransactions = [
    {
      id: 1,
      amount: '0.05 BTC',
      nairaAmount: '₦45,200,000',
      total: '₦2,260,000',
      txId: 'TXN123456789',
      date: '2023-10-26',
      time: '14:30',
      merchant: 'Michael Adebayo',
      merchantAvatar: 'MA',
      rating: 4.8,
      status: 'completed',
      coin: 'BTC',
      type: 'sell',
      merchantPhone: '+234 801 234 5678',
      bankAccount: 'GT Bank - 0123456789',
      walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      paymentStage: 4,
      progress: 100
    },
    {
      id: 2,
      amount: '1.2 ETH',
      nairaAmount: '₦3,450,000',
      total: '₦4,140,000',
      txId: 'TXN789012345',
      date: '2023-10-25',
      time: '09:15',
      merchant: 'Sarah Johnson',
      merchantAvatar: 'SJ',
      rating: 4.5,
      status: 'pending',
      coin: 'ETH',
      type: 'buy',
      merchantPhone: '+234 802 345 6789',
      bankAccount: 'Access Bank - 0987654321',
      walletAddress: '0x742d35Cc6634C0532925a3b8D563C9A7c3c6b0E2',
      paymentStage: 2,
      progress: 50
    }
  ];

  // Find the transaction data based on URL txId
  const foundTransaction = mockTransactions.find(t => t.txId === tradeId || String(t.id) === tradeId);
  
  // Mock transaction data - use found transaction or default
  const transactionDetails = foundTransaction ? {
    id: foundTransaction.txId,
    amount: foundTransaction.amount,
    nairaAmount: foundTransaction.nairaAmount,
    total: foundTransaction.total,
    date: foundTransaction.date,
    time: foundTransaction.time,
    status: foundTransaction.status as 'completed' | 'cancelled' | 'pending' | 'failed',
    coin: foundTransaction.coin,
    type: foundTransaction.type as 'buy' | 'sell',
    walletAddress: foundTransaction.walletAddress,
    paymentStage: foundTransaction.paymentStage,
    merchant: {
      name: foundTransaction.merchant,
      avatar: foundTransaction.merchantAvatar,
      rating: foundTransaction.rating,
      phone: foundTransaction.merchantPhone,
      bankAccount: foundTransaction.bankAccount,
      trades: Math.floor(Math.random() * 500) + 50
    }
  } : {
    id: tradeId || 'TXN123456789',
    amount: '0.05 BTC',
    nairaAmount: '₦45,200,000',
    total: '₦2,260,000',
    date: '2023-10-26',
    time: '14:30',
    status: 'completed' as 'completed' | 'cancelled' | 'pending' | 'failed',
    coin: 'BTC',
    type: 'sell' as 'buy' | 'sell',
    walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    paymentStage: 4,
    merchant: {
      name: 'John Merchant',
      avatar: 'JM',
      rating: 4.8,
      phone: '+234 901 234 5678',
      bankAccount: 'First Bank - 0123456789',
      trades: 234
    }
  };

  const handleTxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTxId(value);
    setIsButtonEnabled(value.trim().length > 0 || proofUploaded);
  };

  const handleProofUpload = () => {
    // Simulate file upload
    setProofUploaded(true);
    setIsButtonEnabled(true);
  };

  const handleViewPaymentStatus = () => {
    navigate('/payment-status', { state: { step: transactionDetails.paymentStage } });
  };

  return (
    <TradeTemplate
      tradeData={transactionDetails}
      title="Trade Details"
      showPaymentProgress={transactionDetails.status === 'pending'}
      showQRCode={transactionDetails.status === 'pending'}
      actionButtonText={transactionDetails.status === 'pending' ? 'View Payment Status' : undefined}
      onActionClick={transactionDetails.status === 'pending' ? handleViewPaymentStatus : undefined}
    >
      {/* Trade Details Card */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Transaction Details</h4>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Date & Time</span>
              <span className="font-semibold text-gray-900">{transactionDetails.date} • {transactionDetails.time}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Merchant</span>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{transactionDetails.merchant.name}</div>
                <div className="flex items-center text-sm text-gray-500">
                  <Star size={14} className="text-yellow-500 mr-1" />
                  <span>{transactionDetails.merchant.rating} • {transactionDetails.merchant.trades} trades</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Phone</span>
              <span className="font-medium text-gray-900">{transactionDetails.merchant.phone}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Bank Account</span>
              <span className="font-medium text-gray-900">{transactionDetails.merchant.bankAccount}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Trade Type</span>
              <span className={`font-medium ${transactionDetails.type === 'buy' ? 'text-green-600' : 'text-blue-600'}`}>
                {transactionDetails.type === 'buy' ? 'Buying' : 'Selling'} {transactionDetails.coin}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status-specific content for completed trades */}
      {transactionDetails.status === 'completed' && (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <CheckCircle size={32} className="text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-green-900">Trade Completed</h3>
              <p className="text-sm text-green-800 mt-2">Funds have been released successfully.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed/Cancelled Status */}
      {(transactionDetails.status === 'failed' || transactionDetails.status === 'cancelled') && (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <XCircle size={32} className="text-red-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-red-900">Trade {transactionDetails.status}</h3>
              <p className="text-sm text-red-800 mt-2">Reason: Payment not confirmed within the time window.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </TradeTemplate>
  );
};

export default TradeDetails;
