
import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Star, CheckCircle, XCircle, Flag, Trash2, Play, Clock, DollarSign, User, Calendar, AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { TradeTemplate } from '@/components/TradeTemplate';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const TradeDetails = () => {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [txId, setTxId] = useState('');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrade, setCurrentTrade] = useState<any>(null);

  // Dialog states
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!user) return;

      try {
        // Fetch completed trades
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        // Fetch trade requests (incomplete trades)
        const { data: requests, error: requestsError } = await supabase
          .from('trade_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (tradesError) throw tradesError;
        if (requestsError) throw requestsError;

        // Combine both trades and requests
        const allTransactions = [
          ...(trades || []).map(t => ({ ...t, isTradeRequest: false })),
          ...(requests || []).map(r => ({ ...r, isTradeRequest: true }))
        ];

        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user]);

  // Load specific trade if tradeId is provided
  useEffect(() => {
    if (tradeId && transactions.length > 0) {
      const trade = transactions.find(t => t.id === tradeId);
      setCurrentTrade(trade);
    } else if (location.state?.trade) {
      setCurrentTrade(location.state.trade);
    }
  }, [tradeId, transactions, location.state]);

  const handleReportTrade = async () => {
    if (!reportReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for reporting this trade.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsReporting(true);

      // Submit report to support tickets instead of trade_reports
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id,
          subject: 'Trade Report',
          message: `Trade ID: ${currentTrade?.id}, Reason: ${reportReason}`,
          category: 'dispute',
          status: 'open',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Trade Reported",
        description: "Your report has been submitted. We'll review it shortly.",
        duration: 3000
      });

      setShowReportDialog(false);
      setReportReason('');
    } catch (error) {
      console.error('Error reporting trade:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsReporting(false);
    }
  };

  const handleDeleteTrade = async () => {
    try {
      setIsDeleting(true);

      // Update trade status to cancelled
      const { error } = await supabase
        .from(currentTrade?.isTradeRequest ? 'trade_requests' : 'trades')
        .update({ status: 'cancelled' })
        .eq('id', currentTrade?.id);

      if (error) throw error;

      toast({
        title: "Trade Deleted",
        description: "The trade has been cancelled successfully.",
        duration: 3000
      });

      setShowDeleteDialog(false);
      navigate('/my-trades');
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast({
        title: "Error",
        description: "Failed to delete trade. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResumeTrade = () => {
    if (!currentTrade) return;

    // Navigate to PaymentStatus to resume the trade
    navigate('/payment-status', {
      state: {
        tradeId: currentTrade.id,
        amount: currentTrade.amount,
        nairaAmount: currentTrade.naira_amount,
        mode: currentTrade.trade_type,
        selectedMerchant: { name: 'Merchant' },
        coinType: currentTrade.coin_type,
        activeStep: getResumeStep(currentTrade.status),
        resumeTrade: true
      }
    });
  };

  const getResumeStep = (status: string) => {
    switch (status) {
      case 'pending':
      case 'waiting_payment':
        return 2; // Upload payment proof
      case 'waiting_confirmation':
        return 3; // Confirmation step
      default:
        return 1;
    }
  };

  // Find the transaction data based on URL tradeId
  const foundTransaction = transactions.find(t => t.id === tradeId || t.txId === tradeId);

  // Use real transaction data or show not found
  const transactionDetails = foundTransaction ? {
    id: foundTransaction.txId || foundTransaction.id,
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

  const canResumeTrade = currentTrade && ['pending', 'waiting_payment', 'waiting_confirmation'].includes(currentTrade.status);

  return (
    <TradeTemplate
      tradeData={transactionDetails}
      title="Trade Details"
      showPaymentProgress={transactionDetails.status === 'pending'}
      showQRCode={transactionDetails.status === 'pending'}
      actionButtonText={transactionDetails.status === 'pending' ? 'View Payment Status' : undefined}
      onActionClick={transactionDetails.status === 'pending' ? handleViewPaymentStatus : undefined}
      onReportTrade={() => setShowReportDialog(true)}
      onDeleteTrade={() => setShowDeleteDialog(true)}
      onResumeTrade={handleResumeTrade}
      canResume={canResumeTrade}
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

      {/* Comprehensive Trade Information */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Complete Trade Information</h4>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Transaction ID</span>
              <span className="font-semibold text-gray-900 text-sm">{transactionDetails.id}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Cryptocurrency Amount</span>
              <span className="font-semibold text-gray-900">{transactionDetails.amount} {transactionDetails.coin}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Naira Value</span>
              <span className="font-semibold text-gray-900">₦{(transactionDetails.nairaAmount || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Exchange Rate</span>
              <span className="font-semibold text-gray-900">₦{(1650000).toLocaleString()}/{transactionDetails.coin || 'BTC'}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Platform Fee (1%)</span>
              <span className="font-semibold text-gray-900">₦{Math.round((transactionDetails.nairaAmount || 0) * 0.01).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Net Amount</span>
              <span className="font-semibold text-gray-900">₦{Math.round((transactionDetails.nairaAmount || 0) * 0.99).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-semibold text-gray-900">Bank Transfer</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Current Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                transactionDetails.status === 'completed' ? 'bg-green-100 text-green-700' :
                transactionDetails.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                transactionDetails.status === 'waiting_confirmation' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {transactionDetails.status === 'completed' ? 'Completed' :
                 transactionDetails.status === 'pending' ? 'Pending Payment' :
                 transactionDetails.status === 'waiting_confirmation' ? 'Awaiting Confirmation' : 'Failed'}
              </span>
            </div>
          </div>

          {/* Resume Trade Button for Incomplete Trades */}
          {(transactionDetails.status === 'pending' || transactionDetails.status === 'waiting_confirmation') && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  // Navigate back to PaymentStatus to resume the trade
                  navigate('/payment-status', {
                    state: {
                      tradeId: transactionDetails.id,
                      amount: transactionDetails.amount,
                      nairaAmount: transactionDetails.nairaAmount,
                      mode: transactionDetails.type,
                      selectedMerchant: { name: transactionDetails.merchant?.name || transactionDetails.merchant },
                      coinType: transactionDetails.coin,
                      activeStep: transactionDetails.status === 'pending' ? 2 : 3,
                      resumeTrade: true
                    }
                  });
                }}
              >
                Resume Trade
              </Button>
              <p className="text-sm text-gray-500 text-center mt-2">
                Continue from where you left off
              </p>
            </div>
          )}
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

      {/* Report Trade Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-orange-600">Report Trade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="text-orange-500 mr-3 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-orange-800 mb-1">Report this trade</h4>
                  <p className="text-orange-700 text-sm">
                    Please provide details about why you're reporting this trade. Our team will review it.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for reporting:</label>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue with this trade..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleReportTrade}
              disabled={isReporting}
            >
              {isReporting ? 'Reporting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Trade Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Trade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Are you sure?</h4>
                  <p className="text-red-700 text-sm">
                    This will cancel the trade permanently. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTrade}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Trade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TradeTemplate>
  );
};

export default TradeDetails;
