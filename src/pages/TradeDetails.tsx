
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
import MessageThread from '@/components/MessageThread';
import StickyHeader from '@/components/StickyHeader';

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
  const [showMessageDialog, setShowMessageDialog] = useState(false);
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
      if (trade) {
        setCurrentTrade(trade);
      } else {
        // Trade not found, show error and redirect
        toast({
          title: "Trade Not Found",
          description: "This trade could not be found or you don't have access to it.",
          variant: "destructive"
        });
        navigate('/my-trades');
      }
    } else if (location.state?.trade) {
      setCurrentTrade(location.state.trade);
    }
  }, [tradeId, transactions, location.state, navigate, toast]);

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
    if (!transactionDetails) return;

    const tradeData = {
      tradeId: transactionDetails.id,
      amount: transactionDetails.amount,
      nairaAmount: transactionDetails.nairaAmount,
      coinType: transactionDetails.coin,
      rate: transactionDetails.rate,
      merchant: transactionDetails.merchant,
      resumeTrade: true
    };

    // Navigate based on trade status to exact step
    switch (transactionDetails.status) {
      case 'pending':
      case 'waiting_payment':
        // User needs to upload payment proof
        if (transactionDetails.type === 'buy') {
          navigate('/buy-crypto-payment-step2', { state: { ...tradeData, activeStep: 2 } });
        } else {
          navigate('/sell-crypto-payment-step2', { state: { ...tradeData, activeStep: 2 } });
        }
        break;
      
      case 'payment_proof_uploaded':
      case 'waiting_confirmation':
        // Waiting for merchant confirmation
        if (transactionDetails.type === 'buy') {
          navigate('/buy-crypto-payment-step3', { state: { ...tradeData, activeStep: 3 } });
        } else {
          navigate('/sell-crypto-payment-step3', { state: { ...tradeData, activeStep: 3 } });
        }
        break;
      
      case 'merchant_accepted':
        // Trade accepted, show escrow instructions
        navigate('/trade-status', { 
          state: {
            tradeRequest: transactionDetails,
            selectedMerchant: transactionDetails.merchant,
            mode: transactionDetails.type,
            step: 'merchant_accepted'
          }
        });
        break;
      
      case 'in_progress':
        // Trade in progress, show status
        navigate('/trade-status', { 
          state: {
            tradeRequest: transactionDetails,
            selectedMerchant: transactionDetails.merchant,
            mode: transactionDetails.type,
            step: 'escrow_pending'
          }
        });
        break;
      
      default:
        // Fallback to trade status page
        navigate('/trade-status', { 
          state: {
            tradeRequest: transactionDetails,
            selectedMerchant: transactionDetails.merchant,
            mode: transactionDetails.type,
            step: 'waiting_for_merchant'
          }
        });
    }
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
  const foundTransaction = transactions.find(t => t.id === tradeId);

  // Use real transaction data or show not found
  const transactionDetails = foundTransaction ? {
    id: foundTransaction.id,
    amount: foundTransaction.amount || foundTransaction.crypto_amount,
    nairaAmount: foundTransaction.naira_amount,
    total: foundTransaction.naira_amount,
    date: new Date(foundTransaction.created_at).toLocaleDateString(),
    time: new Date(foundTransaction.created_at).toLocaleTimeString(),
    status: foundTransaction.status as 'completed' | 'cancelled' | 'pending' | 'failed',
    coin: foundTransaction.coin_type || foundTransaction.crypto_type || 'BTC',
    type: foundTransaction.trade_type || (foundTransaction.buyer_id === user?.id ? 'buy' : 'sell') as 'buy' | 'sell',
    rate: foundTransaction.rate || foundTransaction.exchange_rate,
    merchant: {
      name: foundTransaction.merchant_name || 'Merchant',
      phone: 'Not provided',
      bankAccount: foundTransaction.merchant_bank_details || 'Not provided',
      trades: 0
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
            <p>Loading...</p>
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

  const canResumeTrade = transactionDetails && ['pending', 'waiting_payment', 'waiting_confirmation', 'payment_proof_uploaded', 'merchant_accepted', 'in_progress'].includes(transactionDetails.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-['Poppins']">
      <StickyHeader 
        title={`Trade #${transactionDetails.id?.slice(-8)}`} 
        showBackButton={true}
        rightElement={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100">
                <MoreVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canResumeTrade && (
                <DropdownMenuItem onClick={handleResumeTrade}>
                  <Play size={16} className="mr-2" />
                  Resume Trade
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <Flag size={16} className="mr-2" />
                Report Trade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 size={16} className="mr-2" />
                Cancel Trade
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft size={24} />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">Trade Details</h1>
            <p className="text-blue-100 text-sm">#{transactionDetails.id?.slice(-8)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <MoreVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canResumeTrade && (
                <DropdownMenuItem onClick={handleResumeTrade}>
                  <Play size={16} className="mr-2" />
                  Resume Trade
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <Flag size={16} className="mr-2" />
                Report Trade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 size={16} className="mr-2" />
                Cancel Trade
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge 
            className={`text-sm px-4 py-2 ${
              transactionDetails.status === 'completed' ? 'bg-green-500 text-white' :
              transactionDetails.status === 'pending' ? 'bg-orange-500 text-white' :
              'bg-red-500 text-white'
            }`}
          >
            {transactionDetails.status === 'completed' ? 'Completed' :
             transactionDetails.status === 'pending' ? 'In Progress' : 'Failed'}
          </Badge>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Trade Overview Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {transactionDetails.coin === 'BTC' ? '₿' : 
                   transactionDetails.coin === 'ETH' ? 'Ξ' : '⊎'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {transactionDetails.amount} {transactionDetails.coin}
              </h2>
              <p className="text-lg text-gray-600">
                {(transactionDetails.nairaAmount || 0).toLocaleString()} NGN
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Exchange Rate</p>
                <p className="font-semibold text-gray-900">{transactionDetails.rate ? `₦${transactionDetails.rate.toLocaleString()}/${transactionDetails.coin}` : 'Not available'}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Trade Date</p>
                <p className="font-semibold text-gray-900">{transactionDetails.date}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Merchant Information Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-gray-900">
              <User className="w-5 h-5 mr-2" />
              Merchant Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">{transactionDetails.merchant.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{transactionDetails.merchant.name}</p>
                  <div className="flex items-center">
                    <Star size={14} className="text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-600">{transactionDetails.merchant.rating} • {transactionDetails.merchant.trades} trades</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowMessageDialog(true)}
              >
                <MessageSquare size={16} className="mr-2" />
                Message
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Bank Account</span>
                <span className="font-medium text-gray-900">{transactionDetails.merchant.bankAccount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-gray-900">
              <Clock className="w-5 h-5 mr-2" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Transaction ID</span>
                <span className="font-mono text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {transactionDetails.id?.slice(-12)}
                </span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Crypto Amount</span>
                <span className="font-semibold text-gray-900">{transactionDetails.amount} {transactionDetails.coin}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Naira Value</span>
                <span className="font-semibold text-gray-900">₦{(transactionDetails.nairaAmount || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Platform Fee (1%)</span>
                <span className="font-semibold text-gray-900">₦{Math.round((transactionDetails.nairaAmount || 0) * 0.01).toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Net Amount</span>
                <span className="font-bold text-lg text-gray-900">₦{Math.round((transactionDetails.nairaAmount || 0) * 0.99).toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-3">
                <span className="text-gray-600 font-medium">Payment Method</span>
                <span className="font-semibold text-gray-900">Bank Transfer</span>
              </div>
            </div>

            {/* Action Buttons */}
            {transactionDetails.status === 'pending' && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
                    onClick={handleResumeTrade}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Resume Trade
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Cancel Trade
                  </Button>
                </div>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Continue from where you left off or cancel this trade
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Cards */}
        {transactionDetails.status === 'completed' && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-center text-white">
                <CheckCircle size={48} className="mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Trade Completed Successfully!</h3>
                <p className="text-green-100">Funds have been released and transferred.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {(transactionDetails.status === 'failed' || transactionDetails.status === 'cancelled') && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-xl p-6 text-center text-white">
                <XCircle size={48} className="mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {transactionDetails.status === 'failed' ? 'Trade Failed' : 'Trade Cancelled'}
                </h3>
                <p className="text-red-100">
                  {transactionDetails.status === 'failed' 
                    ? 'This trade could not be completed due to an error.' 
                    : 'This trade has been cancelled by user request.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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

      {/* Message Thread */}
      {showMessageDialog && transactionDetails.merchant && (
        <MessageThread
          otherUserId={transactionDetails.merchant.name || 'merchant'}
          otherUserName={transactionDetails.merchant.name || 'Merchant'}
          tradeId={transactionDetails.id}
          contextType="crypto_trade"
          isOpen={showMessageDialog}
          onClose={() => setShowMessageDialog(false)}
        />
      )}
    </div>
  );
};

export default TradeDetails;
