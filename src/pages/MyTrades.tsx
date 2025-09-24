import React, { useState, useMemo, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, Bell, MessageCircle, Calendar, CheckCircle, XCircle, ArrowRight, MoveRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import BottomNavigation from '@/components/BottomNavigation';
import { useQuickAuth } from '@/hooks/useQuickAuth';

import { useAuth } from '@/hooks/useAuth';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TradeCountdown from '@/components/TradeCountdown';
import TradeTimeDisplay from '@/components/TradeTimeDisplay';

const MyTrades = () => {
  const navigate = useNavigate();
  const { isQuickAuthActive } = useQuickAuth();
  const isPremium = false; // Removed premium system
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('All');
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<{from?: Date, to?: Date} | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch real trades from database and cleanup expired requests
  useEffect(() => {
    if (user) {
      cleanupExpiredRequests();
      fetchUserTrades();
    }
  }, [user]);

  const cleanupExpiredRequests = async () => {
    try {
      // Auto-expire old trade requests
      try {
        await supabase.rpc('auto_expire_trade_requests');
      } catch (error) {
        console.log('auto_expire_trade_requests function not available yet');
      }
      
      // Auto-expire escrow trades where cash payment wasn't made
      try {
        await supabase.rpc('auto_expire_escrow_trades');
      } catch (error) {
        console.log('auto_expire_escrow_trades function not available yet');
      }
    } catch (error) {
      console.error('Error cleaning up expired requests:', error);
    }
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDatePicker && !(event.target as Element).closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // Set up real-time subscriptions for trade updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to trades table changes
    const tradesChannel = supabase
      .channel('trades-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trades'
        // Remove filter to catch all trade changes, then filter in callback
      }, (payload) => {
        // Only refresh if the change affects current user
        const trade = payload.new || payload.old;
        console.log('Trade change payload:', payload);
        if (trade && (trade.buyer_id === user.id || trade.seller_id === user.id)) {
          console.log('Trade change detected for user, refreshing trades');
          setTimeout(() => fetchUserTrades(), 500); // Small delay to ensure DB is updated
        }
      })
      .subscribe();

    // Subscribe to trade_requests table changes
    const requestsChannel = supabase
      .channel('trade-requests-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trade_requests',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Refresh trades when any change occurs
        fetchUserTrades();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [user]);

  const fetchUserTrades = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch trades where user is buyer or seller (simplified query)
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
        


      if (tradesError) {
        console.error('Error fetching trades:', tradesError);
        toast({
          title: "Error",
          description: "Failed to load trades",
          variant: "destructive"
        });
        return;
      }

      // Also fetch trade requests where user is the requester (exclude expired)
      const { data: tradeRequestsData, error: requestsError } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('user_id', user.id)
        .gte('expires_at', new Date().toISOString()) // Only non-expired
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching trade requests:', requestsError);
      }

      // Format trades data with complete information
      const formattedTrades = [
        // Format completed/ongoing trades
        ...(tradesData || []).map(trade => {
          const isBuyer = trade.buyer_id === user.id;
          const tradeStatus = getTradeStatus(trade.status, trade.escrow_status);
          const awaitingAction = needsUserAction(trade, user.id);

          const formattedTrade = {
            id: trade.id,
            type: isBuyer ? 'buy' : 'sell',
            coin: trade.coin_type || 'BTC',
            amount: `₦${trade.naira_amount?.toLocaleString() || '0'}`,
            coinAmount: `${trade.amount || 0} ${trade.coin_type || 'BTC'}`,
            nairaAmount: trade.naira_amount || 0,
            merchant: isBuyer ? 'Seller' : 'Buyer',
            rating: 4.5, // Default rating
            status: tradeStatus,
            progress: getTradeProgress(trade.status, trade.escrow_status),
            startTime: new Date(trade.created_at).toLocaleDateString(),
            startDateTime: new Date(trade.created_at), // Add full datetime
            date: new Date(trade.created_at),
            avatar: 'T',
            category: tradeStatus === 'completed' ? 'completed' : (tradeStatus === 'cancelled' || trade.status === 'cancelled' || trade.status === 'failed') ? 'cancelled' : 'ongoing',
            canUserCancel: canUserCancel(trade, user.id),
            cryptoSenderId: trade.crypto_sender_id,
            cashSenderId: trade.cash_sender_id,
            escrowExpiresAt: trade.escrow_expires_at ? new Date(trade.escrow_expires_at) : null,
            paymentProofUploaded: !!trade.payment_proof_uploaded_at,
            paymentProofUrl: trade.payment_proof_url,
            paymentHash: trade.payment_hash,
            isDisputed: trade.status === 'disputed',
            awaitingUserAction: awaitingAction,
            actionRequired: getActionRequired(trade, user.id),
            tradeData: trade
          };
          

          return formattedTrade;
        }),
        // Format pending trade requests (only non-expired)
        ...(tradeRequestsData || []).map(request => {
          const requestStatus = getTradeRequestStatus(request.status);
          return {
            id: request.id,
            type: request.trade_type,
            coin: request.crypto_type,
            amount: `₦${request.amount_fiat?.toLocaleString() || '0'}`,
            coinAmount: `≈ ${request.amount_crypto || 0} ${request.crypto_type}`,
            nairaAmount: request.amount_fiat || 0,
            merchant: requestStatus === 'cancelled' ? 'Cancelled' : 'Waiting for merchant...',
            rating: 0,
            status: requestStatus,
            progress: requestStatus === 'cancelled' ? 100 : 10,
            startTime: new Date(request.created_at).toLocaleDateString(),
            startDateTime: new Date(request.created_at),
            date: new Date(request.created_at),
            avatar: requestStatus === 'cancelled' ? 'X' : 'W',
            category: requestStatus === 'cancelled' ? 'cancelled' : 'ongoing',
            isTradeRequest: true,
            awaitingUserAction: false,
            tradeData: request
          };
        })
      ];

      setTrades(formattedTrades);

    } catch (error) {
      console.error('Error in fetchUserTrades:', error);
      toast({
        title: "Error",
        description: "Failed to load trades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTradeStatus = (status: string, escrowStatus?: string) => {

    if (status === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    if (status === 'failed') return 'cancelled';
    if (status === 'disputed') return 'disputed';
    if (escrowStatus === 'crypto_received') return 'waiting_payment';
    if (escrowStatus === 'payment_proof_uploaded') return 'awaiting_confirmation';
    if (escrowStatus === 'cash_received') return 'confirming';
    return 'in_progress';
  };

  const getTradeProgress = (status: string, escrowStatus?: string) => {
    if (status === 'completed') return 100;
    if (status === 'cancelled' || status === 'failed') return 100;
    if (escrowStatus === 'crypto_received') return 50;
    if (escrowStatus === 'cash_received') return 80;
    return 25;
  };

  const getTradeRequestStatus = (status: string) => {
    if (status === 'cancelled' || status === 'expired') return 'cancelled';
    if (status === 'accepted') return 'in_progress';
    return 'waiting_merchant';
  };

  const canUserCancel = (trade: any, userId: string) => {
    if (trade.status === 'completed' || trade.status === 'cancelled' || trade.status === 'disputed') return false;
    
    // Once payment proof is uploaded, no one can cancel - only confirm or dispute
    if (trade.escrow_status === 'payment_proof_uploaded') return false;
    
    // If crypto is in escrow, crypto sender cannot cancel
    if (trade.escrow_status === 'crypto_received') {
      return trade.crypto_sender_id !== userId;
    }
    
    return true; // Before escrow, anyone can cancel
  };

  const getCryptoSenderId = (trade: any) => {
    // In buy crypto: merchant sends crypto
    // In sell crypto: seller sends crypto
    return trade.trade_type === 'buy' ? trade.seller_id : trade.buyer_id;
  };

  const getCashSenderId = (trade: any) => {
    // In buy crypto: buyer sends cash
    // In sell crypto: merchant sends cash
    return trade.trade_type === 'buy' ? trade.buyer_id : trade.seller_id;
  };

  const needsUserAction = (trade: any, userId: string) => {
    if (trade.status === 'completed' || trade.status === 'cancelled') return false;

    // Cash sender needs to upload payment proof
    if (trade.escrow_status === 'crypto_received' && trade.cash_sender_id === userId) {
      return true;
    }

    // Crypto sender needs to confirm payment received or dispute
    if (trade.escrow_status === 'payment_proof_uploaded' && trade.crypto_sender_id === userId) {
      return true;
    }

    return false;
  };

  const getActionRequired = (trade: any, userId: string) => {
    if (trade.status === 'completed' || trade.status === 'cancelled') return null;

    // Cash sender needs to upload payment proof
    if (trade.escrow_status === 'crypto_received' && trade.cash_sender_id === userId) {
      return 'Upload Payment Proof (30 min)';
    }

    // Crypto sender needs to confirm or dispute
    if (trade.escrow_status === 'payment_proof_uploaded' && trade.crypto_sender_id === userId) {
      return 'Confirm Payment Received';
    }

    return null;
  };

  // Filter trades based on active tab and date
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Tab filter
      if (activeTab === 'All') {
        // Allow all
      } else if (activeTab === 'Ongoing' && trade.category !== 'ongoing') {
        return false;
      } else if (activeTab === 'Completed' && trade.category !== 'completed') {
        return false;
      } else if (activeTab === 'Cancelled' && trade.category !== 'cancelled') {
        return false;
      }
      
      // Date filter
      if (dateFilter) {
        const tradeDate = new Date(trade.date);
        if (dateFilter.from && tradeDate < dateFilter.from) return false;
        if (dateFilter.to && tradeDate > dateFilter.to) return false;
      }
      
      return true;
    });
  }, [trades, activeTab, dateFilter]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <ArrowDownRight size={20} className="text-[#1A73E8]" />;
      case 'sell':
        return <ArrowUpRight size={20} className="text-[#1A73E8]" />;
      case 'send_naira':
        return <Wallet size={20} className="text-[#1A73E8]" />;
      default:
        return <DollarSign size={20} className="text-[#1A73E8]" />;
    }
  };

  const getTransactionLabel = (type: string, coin?: string) => {
    switch (type) {
      case 'buy':
        return `Buy ${coin || 'Crypto'}`;
      case 'sell':
        return `Sell ${coin || 'Crypto'}`;
      case 'send_naira':
        return 'Send Naira → USD Cash';
      default:
        return 'Transaction';
    }
  };

  const getStatusBadgeNew = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#22C55E]">
            Completed
          </span>
        );
      case 'ongoing':
      case 'waiting_payment':
      case 'in_progress':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#F59E0B]">
            Ongoing
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#EF4444]">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#F59E0B]">
            Ongoing
          </span>
        );
    }
  };

  const getTransactionDetails = (trade: any) => {
    if (trade.tradeData?.escrow_address) {
      return `Wallet: ${trade.tradeData.escrow_address.slice(0, 8)}... via Bank Transfer`;
    }
    if (trade.tradeData?.pickup_location) {
      return `Pickup: ${trade.tradeData.pickup_location} — Ref: TXN-${trade.id.slice(0, 4)}`;
    }
    return `Transaction ID: TXN-${trade.id.slice(0, 8)}`;
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'completed': return 100;
      case 'cancelled': return 100;
      case 'waiting_payment': return 60;
      case 'in_progress': return 40;
      default: return 20;
    }
  };



  // Show loading state while fetching real data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trades...</p>
        </div>
      </div>
    );
  }

  // Using real trades from database - no more mock data

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting_payment':
        return (
          <div className="flex items-center bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            Waiting for Payment
          </div>
        );
      case 'awaiting_confirmation':
        return (
          <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Awaiting Confirmation
          </div>
        );
      case 'disputed':
        return (
          <div className="flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            Disputed
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle size={14} className="mr-1" />
            Completed
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center bg-foreground/10 text-foreground px-3 py-1 rounded-full text-sm font-medium">
            <XCircle size={14} className="mr-1" />
            Cancelled
          </div>
        );
      default:
        return null;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'waiting_payment':
        return 'bg-orange-500';
      case 'awaiting_confirmation':
        return 'bg-blue-500';
      case 'disputed':
        return 'bg-red-500';
      case 'completed':
        return 'bg-success';
      case 'cancelled':
        return 'bg-foreground';
      default:
        return 'bg-foreground';
    }
  };

  const handleOpenConfirmDialog = (tradeId: number) => {
    setSelectedTradeId(tradeId.toString());
    setShowConfirmDialog(true);
  };

  const handleDeleteTrade = async (tradeId: string) => {
    try {
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) return;

      // Check if user can cancel
      if (!trade.canUserCancel) {
        toast({
          title: "Cannot Cancel",
          description: "This trade cannot be cancelled at this stage.",
          variant: "destructive"
        });
        return;
      }

      // Update trade status to cancelled in Supabase
      const tableName = trade.tradeData ? 'trades' : 'trade_requests';
      const { error } = await supabase
        .from(tableName)
        .update({ status: 'cancelled' })
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: "Trade Cancelled",
        description: "The trade has been successfully cancelled.",
        duration: 3000,
      });

      fetchUserTrades();
    } catch (error) {
      console.error('Error cancelling trade:', error);
      toast({
        title: "Error",
        description: "Failed to cancel trade. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleUploadPaymentProof = async (tradeId: string, proofUrl?: string, paymentHash?: string) => {
    try {
      // Try using RPC function first
      try {
        const { data, error } = await supabase.rpc('upload_payment_proof', {
          trade_id_param: tradeId,
          user_id_param: user?.id,
          proof_url_param: proofUrl,
          payment_hash_param: paymentHash
        });

        if (error) throw error;
      } catch (rpcError) {
        // Fallback to direct update if RPC function doesn't exist
        console.log('Using fallback method for payment proof upload');
        const { error } = await supabase
          .from('trades')
          .update({
            payment_proof_url: proofUrl,
            payment_hash: paymentHash,
            payment_proof_uploaded_at: new Date().toISOString(),
            escrow_status: 'payment_proof_uploaded',
            updated_at: new Date().toISOString()
          })
          .eq('id', tradeId);
          
        if (error) throw error;
      }

      toast({
        title: "Payment Proof Uploaded",
        description: "Waiting for crypto sender to confirm payment received.",
      });

      fetchUserTrades();
    } catch (error: any) {
      console.error('Error uploading payment proof:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload payment proof.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmPayment = async (tradeId: string) => {
    try {
      // Try using RPC function first
      try {
        const { data, error } = await supabase.rpc('confirm_payment_received', {
          trade_id_param: tradeId,
          user_id_param: user?.id
        });

        if (error) throw error;
      } catch (rpcError) {
        // Fallback to direct update if RPC function doesn't exist
        console.log('Using fallback method for payment confirmation');
        const { error } = await supabase
          .from('trades')
          .update({
            status: 'completed',
            escrow_status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', tradeId);
          
        if (error) throw error;
      }

      toast({
        title: "Trade Completed!",
        description: "Crypto has been released to the buyer.",
      });

      fetchUserTrades();
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm payment.",
        variant: "destructive"
      });
    }
  };

  const handleDisputePayment = async (tradeId: string, reason: string) => {
    try {
      // Try using RPC function first
      try {
        const { data, error } = await supabase.rpc('dispute_payment', {
          trade_id_param: tradeId,
          user_id_param: user?.id,
          dispute_reason_param: reason
        });

        if (error) throw error;
      } catch (rpcError) {
        // Fallback to direct update if RPC function doesn't exist
        console.log('Using fallback method for dispute creation');
        const { error } = await supabase
          .from('trades')
          .update({
            status: 'disputed',
            escrow_status: 'disputed',
            dispute_reason: reason,
            disputed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', tradeId);
          
        if (error) throw error;
      }

      toast({
        title: "Dispute Created",
        description: "Support team will review this dispute within 24 hours.",
      });

      fetchUserTrades();
    } catch (error: any) {
      console.error('Error creating dispute:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create dispute.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmationResponse = (received: boolean) => {
    if (received && selectedTradeId) {
      console.log('Payment confirmed for trade:', selectedTradeId);
      // In real app, this would update the trade status
    }
    setShowConfirmDialog(false);
    setSelectedTradeId(null);
  };

  const handleTradeClick = (tradeId: string) => {
    const trade = trades.find(t => t.id === tradeId);

    if (!trade) {
      navigate(`/trade-details/${tradeId}`);
      return;
    }

    // For incomplete trades, navigate to PaymentStatus at the correct step
    if (trade.awaitingUserAction || (trade.status !== 'completed' && trade.status !== 'cancelled')) {
      let step = 1; // Default to step 1 (trade request)

      // Determine the correct step based on trade status and escrow status
      if (trade.tradeData) {
        const tradeData = trade.tradeData;

        if (tradeData.escrow_status === 'pending' && tradeData.buyer_id === user?.id) {
          step = 2; // Upload payment proof step
        } else if (tradeData.escrow_status === 'crypto_received') {
          step = 3; // Waiting for payment confirmation
        } else if (tradeData.escrow_status === 'cash_received') {
          step = 4; // Waiting for final confirmation
        } else if (tradeData.status === 'pending') {
          step = 2; // Payment step
        }
      }

      // Navigate to correct payment step based on trade type and status
      const tradeType = trade.type === 'buy' ? 'buy-crypto' : 'sell-crypto';
      navigate(`/${tradeType}-payment-step${step}`, {
        state: {
          tradeId: trade.id,
          amount: trade.coinAmount.split(' ')[0], // Extract numeric amount
          nairaAmount: trade.nairaAmount,
          selectedMerchant: { name: trade.merchant },
          coinType: trade.coin,
          resumeTrade: true,
          actionRequired: trade.actionRequired,
          tradeData: trade.tradeData
        }
      });
    } else {
      // For completed trades, go to trade details
      navigate(`/trade-details/${tradeId}`);
    }
  };



  return (
    <div className="min-h-screen bg-white font-['Poppins'] pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-white z-10 px-4 py-4 border-b border-[#EAEAEA]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Transactions</h1>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
            </button>
            <button 
              onClick={() => navigate('/messages')}
              className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <MessageCircle size={20} className="text-gray-600" />
            </button>
            <button 
              onClick={() => {
                console.log('Manual refresh triggered');
                fetchUserTrades();
              }}
              className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Refresh trades"
            >
              <span className="text-gray-600 text-xs">↻</span>
            </button>
            <div className="relative date-picker-container">
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors ml-1 ${
                  dateFilter ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <Calendar size={16} className={dateFilter ? 'text-blue-600' : 'text-gray-600'} />
              </button>
              
              {showDatePicker && (
                <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-64">
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Filter by Date</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setDateFilter({ from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) });
                          setShowDatePicker(false);
                        }}
                        className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
                      >
                        Last 7 days
                      </button>
                      <button
                        onClick={() => {
                          setDateFilter({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) });
                          setShowDatePicker(false);
                        }}
                        className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
                      >
                        Last 30 days
                      </button>
                      <button
                        onClick={() => {
                          setDateFilter({ from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) });
                          setShowDatePicker(false);
                        }}
                        className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
                      >
                        Last 3 months
                      </button>
                      <button
                        onClick={() => {
                          const today = new Date();
                          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                          setDateFilter({ from: startOfMonth, to: today });
                          setShowDatePicker(false);
                        }}
                        className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
                      >
                        This month
                      </button>
                    </div>
                    
                    <div className="border-t pt-3">
                      <button
                        onClick={() => {
                          setDateFilter(null);
                          setShowDatePicker(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        Clear Filter
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>





      {/* Date Filter Indicator */}
      {dateFilter && (
        <div className="px-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {dateFilter.from && dateFilter.to 
                ? `${dateFilter.from.toLocaleDateString()} - ${dateFilter.to.toLocaleDateString()}`
                : dateFilter.from 
                ? `From ${dateFilter.from.toLocaleDateString()}`
                : 'Date filtered'}
            </span>
            <button
              onClick={() => setDateFilter(null)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Transaction Filter Tabs */}
      <div className="px-4 mt-6 mb-6">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {['All', 'Ongoing', 'Completed', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#1A73E8] text-white'
                  : 'bg-white border border-[#1A73E8] text-[#1A73E8]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Cards */}
      <div className="px-4 space-y-4 pb-6">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">No transactions found</p>
            <p className="text-gray-400 text-sm">Your transactions will appear here</p>
          </div>
        ) : (
          filteredTrades.map((trade) => (
            <div 
              key={trade.id} 
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer card-hover active:scale-98"
              onClick={() => handleTradeClick(trade.id)}
            >
              {/* Top Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                    {getTransactionIcon(trade.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      {getTransactionLabel(trade.type, trade.coin)}
                    </h3>
                  </div>
                </div>
                {getStatusBadgeNew(trade.status)}
              </div>
              
              {/* Middle Section */}
              <div className="mb-4">
                <div className="mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900 text-lg">{trade.coinAmount}</span>
                    <MoveRight size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-900 text-lg">{trade.amount.replace('₦', '')}</span>
                    <span className="text-sm text-gray-500 font-medium">NGN</span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm truncate">
                  {getTransactionDetails(trade)}
                </p>
                
                {/* Progress Bar - Only for Ongoing */}
                {(trade.status === 'ongoing' || trade.status === 'waiting_payment' || trade.status === 'in_progress') && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[#1A73E8] transition-all duration-300"
                        style={{ width: `${getProgressPercentage(trade.status)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bottom Row */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  {new Date(trade.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })} · {new Date(trade.date).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                <span className="text-[#1A73E8] text-sm font-bold flex items-center">
                  View Details <ArrowRight size={14} className="ml-1" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>



      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default MyTrades;