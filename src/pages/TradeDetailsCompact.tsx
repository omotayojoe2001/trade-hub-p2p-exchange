import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Star, CheckCircle, XCircle, Flag, Trash2, Play, Clock, DollarSign, User, Calendar, AlertTriangle, MessageSquare, Download, Share2, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ReceiptGenerator } from '@/components/ReceiptGenerator';
import MessageThread from '@/components/MessageThread';

const TradeDetailsCompact = () => {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrade, setCurrentTrade] = useState<any>(null);
  const [merchantDetails, setMerchantDetails] = useState<any>(null);
  const [loadingMerchant, setLoadingMerchant] = useState(false);

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

  // Load merchant details for all trades
  useEffect(() => {
    const loadMerchantDetails = async () => {
      if (currentTrade && user) {
        setLoadingMerchant(true);
        try {
          // Get merchant profile details
          const merchantId = currentTrade.seller_id === user.id ? currentTrade.buyer_id : currentTrade.seller_id;
          
          if (merchantId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id, display_name, phone, email, created_at, avatar_url')
              .eq('user_id', merchantId)
              .single();

            if (profile) {
              setMerchantDetails({
                id: profile.user_id,
                name: profile.display_name || profile.email?.split('@')[0] || 'Merchant',
                phone: profile.phone || 'Not provided',
                email: profile.email,
                avatar: profile.avatar_url,
                memberSince: new Date(profile.created_at).toLocaleDateString()
              });
            } else {
              // Profile not found
              setMerchantDetails({
                id: null,
                name: 'Merchant',
                phone: 'Not available',
                email: 'Not available',
                avatar: null,
                memberSince: 'Unknown'
              });
            }
          } else {
            // Fallback for trades without proper merchant IDs
            setMerchantDetails({
              id: null,
              name: currentTrade.merchant_name || 'Merchant',
              phone: 'Not available',
              email: 'Not available',
              avatar: null,
              memberSince: 'Unknown'
            });
          }
        } catch (error) {
          console.error('Error loading merchant details:', error);
          setMerchantDetails({
            id: null,
            name: currentTrade.merchant_name || 'Merchant',
            phone: 'Not available',
            email: 'Not available',
            avatar: null,
            memberSince: 'Unknown'
          });
        } finally {
          setLoadingMerchant(false);
        }
      }
    };

    loadMerchantDetails();
  }, [currentTrade, user]);

  // Load specific trade if tradeId is provided
  useEffect(() => {
    if (tradeId && transactions.length > 0) {
      const trade = transactions.find(t => t.id === tradeId);
      if (trade) {
        setCurrentTrade(trade);
      } else {
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

  const copyTradeId = () => {
    navigator.clipboard.writeText(transactionDetails?.id || '');
    toast({ title: "Copied!", description: "Trade ID copied to clipboard" });
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
    merchant: merchantDetails || {
      id: null,
      name: foundTransaction.merchant_name || 'Merchant',
      phone: 'Loading...',
      avatar: null,
      bankAccount: foundTransaction.merchant_bank_details || 'Not provided',
      trades: 0
    }
  } : null;

  if (!loading && !transactionDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Trade Not Found</h2>
            <p className="text-gray-600 mb-4">The trade you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate('/my-trades')} className="bg-blue-600 hover:bg-blue-700">
              View My Trades
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !transactionDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trade details...</p>
        </div>
      </div>
    );
  }

  const canResumeTrade = transactionDetails && ['pending', 'waiting_payment', 'waiting_confirmation', 'payment_proof_uploaded', 'merchant_accepted', 'in_progress'].includes(transactionDetails.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-white">Trade Details</h1>
            <p className="text-blue-100 text-sm">#{transactionDetails.id?.slice(-8)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canResumeTrade && (
                <DropdownMenuItem>
                  <Play className="w-4 h-4 mr-2" />
                  Resume Trade
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <Flag className="w-4 h-4 mr-2" />
                Report Trade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel Trade
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Status Badge */}
        <div className="flex justify-center mt-4">
          <Badge className={`px-4 py-2 text-sm font-medium ${
            transactionDetails.status === 'completed' ? 'bg-green-500 text-white' :
            transactionDetails.status === 'pending' ? 'bg-orange-500 text-white' :
            'bg-red-500 text-white'
          }`}>
            {transactionDetails.status === 'completed' ? 'Completed' :
             transactionDetails.status === 'pending' ? 'In Progress' : 'Failed'}
          </Badge>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Trade Overview - Enhanced */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-xl font-bold">
                    {transactionDetails.coin === 'BTC' ? '₿' : 
                     transactionDetails.coin === 'ETH' ? 'Ξ' : '⊎'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {transactionDetails.amount} {transactionDetails.coin}
                  </h2>
                  <p className="text-lg text-gray-600 font-medium">
                    ₦{(transactionDetails.nairaAmount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right bg-blue-50 px-3 py-2 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Exchange Rate</p>
                <p className="font-bold text-blue-900">₦{transactionDetails.rate?.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-gray-600 font-medium">Trade ID</span>
              <div className="flex items-center">
                <span className="font-mono text-sm bg-white px-2 py-1 rounded border mr-2">{transactionDetails.id?.slice(-12)}</span>
                <Button size="sm" variant="ghost" onClick={copyTradeId} className="h-8 w-8 p-0">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Merchant Info - Enhanced */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {transactionDetails.merchant.avatar ? (
                  <img 
                    src={transactionDetails.merchant.avatar} 
                    alt={transactionDetails.merchant.name}
                    className="w-12 h-12 rounded-xl object-cover mr-4 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-md">
                    <span className="text-white font-bold text-lg">{transactionDetails.merchant.name?.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 text-lg">{transactionDetails.merchant.name}</p>
                  <p className="text-sm text-gray-600 font-medium">
                    {loadingMerchant ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      transactionDetails.merchant.phone
                    )}
                  </p>
                </div>
              </div>
              {transactionDetails.merchant.id && (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md" onClick={() => setShowMessageDialog(true)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Summary - Enhanced */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-5">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Transaction Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Crypto Amount</span>
                <span className="font-bold text-gray-900">{transactionDetails.amount} {transactionDetails.coin}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Naira Value</span>
                <span className="font-bold text-gray-900">₦{(transactionDetails.nairaAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Platform Fee (1%)</span>
                <span className="font-semibold text-red-600">-₦{Math.round((transactionDetails.nairaAmount || 0) * 0.01).toLocaleString()}</span>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-green-800">Net Amount</span>
                  <span className="font-bold text-xl text-green-800">₦{Math.round((transactionDetails.nairaAmount || 0) * 0.99).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status-specific Actions */}
        {transactionDetails.status === 'completed' && (
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 border-0 shadow-lg">
            <CardContent className="p-6 text-center text-white">
              <CheckCircle className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">Trade Completed!</h3>
              <p className="text-green-100 mb-4">Funds have been successfully transferred.</p>
              <div className="flex justify-center space-x-3">
                <ReceiptGenerator
                  trade={{
                    id: transactionDetails.id,
                    amount: transactionDetails.amount,
                    currency: transactionDetails.coin,
                    nairaAmount: transactionDetails.nairaAmount,
                    type: transactionDetails.type,
                    status: 'completed',
                    date: transactionDetails.date,
                    merchant: transactionDetails.merchant,
                    rate: transactionDetails.rate
                  }}
                  trigger={
                    <Button size="sm" className="bg-white/20 text-white hover:bg-white/30 border-white/30">
                      <Download className="w-4 h-4 mr-2 text-white" />
                      <span className="text-white">Download Receipt</span>
                    </Button>
                  }
                />
                <Button size="sm" className="bg-white/20 text-white hover:bg-white/30 border-white/30" onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Trade Completed',
                      text: `Successfully traded ${transactionDetails.amount} ${transactionDetails.coin}`,
                      url: window.location.href
                    });
                  }
                }}>
                  <Share2 className="w-4 h-4 mr-2 text-white" />
                  <span className="text-white">Share</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {transactionDetails.status === 'pending' && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="text-center">
                <Clock className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Trade In Progress</h3>
                <p className="text-sm text-gray-600 mb-4">Continue from where you left off</p>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Resume Trade
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(transactionDetails.status === 'failed' || transactionDetails.status === 'cancelled') && (
          <Card className="bg-gradient-to-r from-red-500 to-rose-500 border-0 shadow-lg">
            <CardContent className="p-6 text-center text-white">
              <XCircle className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">
                {transactionDetails.status === 'failed' ? 'Trade Failed' : 'Trade Cancelled'}
              </h3>
              <p className="text-red-100">
                {transactionDetails.status === 'failed' 
                  ? 'This trade could not be completed due to an error.' 
                  : 'This trade has been cancelled by user request.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
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
                    Please provide details about why you're reporting this trade.
                  </p>
                </div>
              </div>
            </div>
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue with this trade..."
              rows={4}
            />
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Cancel Trade</DialogTitle>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTrade}
              disabled={isDeleting}
            >
              {isDeleting ? 'Cancelling...' : 'Cancel Trade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Thread */}
      {showMessageDialog && transactionDetails.merchant && transactionDetails.merchant.id && (
        <MessageThread
          otherUserId={transactionDetails.merchant.id}
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

export default TradeDetailsCompact;