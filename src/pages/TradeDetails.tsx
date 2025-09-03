
import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useParams } from 'react-router-dom';
import { TradeTemplate } from '@/components/TradeTemplate';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const TradeDetails = () => {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [txId, setTxId] = useState('');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!user) return;
      
      try {
        const { data: trades, error } = await supabase
          .from('trades')
          .select('*')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(trades || []);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user]);

  // Find the transaction data based on URL tradeId
  const foundTransaction = transactions.find(t => t.id === tradeId || t.txId === tradeId);

  // Use real transaction data or show not found
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
  } : null;

  // If no transaction found and not loading, show not found
  if (!loading && !transactionDetails) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Trade Not Found</h2>
            <p className="text-gray-600 mb-4">The trade you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate('/my-trades')} className="bg-blue-600 hover:bg-blue-700">
              View My Trades
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If still loading, show loading state
  if (loading || !transactionDetails) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading trade details...</p>
          </div>
        </div>
      </div>
    );
  }

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
