import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowDown, ArrowUp, CheckCircle, XCircle, Calendar, ArrowUpDown, Bell, Star, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import PaymentConfirmationDialog from "@/components/PaymentConfirmationDialog";
import BottomNavigation from '@/components/BottomNavigation';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/hooks/useAuth';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TradeCountdown from '@/components/TradeCountdown';

const MyTrades = () => {
  const navigate = useNavigate();
  const { isQuickAuthActive } = useQuickAuth();
  const { isPremium } = usePremium();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real trades from database
  useEffect(() => {
    if (user) {
      fetchUserTrades();
    }
  }, [user]);

  // Set up real-time subscriptions for trade updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to trades table changes
    const tradesChannel = supabase
      .channel('trades-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trades',
        filter: `buyer_id=eq.${user.id},seller_id=eq.${user.id}`
      }, () => {
        // Refresh trades when any change occurs
        fetchUserTrades();
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

      // Also fetch trade requests where user is the requester
      const { data: tradeRequestsData, error: requestsError } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('user_id', user.id)
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

          return {
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
            date: new Date(trade.created_at),
            avatar: 'T',
            category: trade.status === 'completed' ? 'completed' : trade.status === 'cancelled' ? 'cancelled' : 'ongoing',
            awaitingUserAction: awaitingAction,
            actionRequired: getActionRequired(trade, user.id),
            tradeData: trade
          };
        }),
        // Format pending trade requests
        ...(tradeRequestsData || []).map(request => ({
          id: request.id,
          type: request.trade_type,
          coin: request.coin_type,
          amount: `₦${request.naira_amount?.toLocaleString() || '0'}`,
          coinAmount: `≈ ${request.amount || 0} ${request.coin_type}`,
          nairaAmount: request.naira_amount || 0,
          merchant: request.status === 'cancelled' ? 'Cancelled' : 'Waiting for merchant...',
          rating: 0,
          status: request.status === 'cancelled' ? 'cancelled' : 'waiting_merchant',
          progress: request.status === 'cancelled' ? 0 : 10,
          startTime: new Date(request.created_at).toLocaleDateString(),
          date: new Date(request.created_at),
          avatar: request.status === 'cancelled' ? 'X' : 'W',
          category: request.status === 'cancelled' ? 'cancelled' : 'ongoing',
          isTradeRequest: true,
          awaitingUserAction: false,
          tradeData: request
        }))
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
    if (escrowStatus === 'crypto_received') return 'waiting_payment';
    if (escrowStatus === 'cash_received') return 'confirming';
    return 'in_progress';
  };

  const getTradeProgress = (status: string, escrowStatus?: string) => {
    if (status === 'completed') return 100;
    if (status === 'cancelled') return 0;
    if (escrowStatus === 'crypto_received') return 50;
    if (escrowStatus === 'cash_received') return 80;
    return 25;
  };

  const needsUserAction = (trade: any, userId: string) => {
    if (trade.status === 'completed' || trade.status === 'cancelled') return false;

    // Check if user needs to upload payment proof
    if (trade.buyer_id === userId && trade.escrow_status === 'pending') return true;

    // Check if user needs to confirm receipt
    if (trade.seller_id === userId && trade.escrow_status === 'cash_received') return true;

    return false;
  };

  const getActionRequired = (trade: any, userId: string) => {
    if (trade.status === 'completed' || trade.status === 'cancelled') return null;

    if (trade.buyer_id === userId && trade.escrow_status === 'pending') {
      return 'Upload Payment Proof';
    }

    if (trade.seller_id === userId && trade.escrow_status === 'cash_received') {
      return 'Confirm Receipt';
    }

    return null;
  };

  // Filter trades based on active tab, search, type, and date
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Tab filter
      if (activeTab === 'ongoing' && trade.category !== 'ongoing') return false;
      if (activeTab === 'completed' && trade.category !== 'completed') return false;
      if (activeTab === 'cancelled' && trade.category !== 'cancelled') return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!trade.merchant.toLowerCase().includes(query) &&
            !trade.coin.toLowerCase().includes(query) &&
            !trade.amount.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && trade.type !== typeFilter) return false;

      // Date filter
      if (dateFrom && trade.date < dateFrom) return false;
      if (dateTo && trade.date > dateTo) return false;

      return true;
    });
  }, [trades, activeTab, searchQuery, typeFilter, dateFrom, dateTo]);

  const incompleteTradesCount = trades.filter(trade => trade.awaitingUserAction).length;

  // Redirect premium users to premium trades page
  React.useEffect(() => {
    if (user && isPremium) {
      navigate('/premium-trades');
    }
  }, [user, isPremium, navigate]);

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
      case 'waiting_confirmation':
        return (
          <div className="flex items-center bg-brand/10 text-brand px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-brand rounded-full mr-2"></div>
            {status === 'waiting_payment' ? 'Waiting for Payment' : 'Waiting for Confirmation'}
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
      case 'waiting_confirmation':
        return 'bg-brand';
      case 'completed':
        return 'bg-success';
      case 'cancelled':
        return 'bg-foreground';
      default:
        return 'bg-foreground';
    }
  };

  const handleConfirmPayment = (tradeId: number) => {
    setSelectedTradeId(tradeId);
    setShowConfirmDialog(true);
  };

  const handleDeleteTrade = async (tradeId: string) => {
    try {
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) return;

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

      // Refresh trades data to reflect the change
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

      // Navigate to PaymentStatus with complete trade data
      navigate('/payment-status', {
        state: {
          tradeId: trade.id,
          amount: trade.coinAmount.split(' ')[0], // Extract numeric amount
          nairaAmount: trade.nairaAmount,
          mode: trade.type,
          selectedMerchant: { name: trade.merchant },
          coinType: trade.coin,
          activeStep: step,
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-foreground">My Trades</h1>
          </div>
          <button 
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 bg-secondary rounded-full flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <Bell size={18} className="text-foreground/70" />
            {incompleteTradesCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{incompleteTradesCount}</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {incompleteTradesCount > 0 && (
        <div className="mx-4 mt-4 bg-secondary border border-brand/20 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-brand rounded-full"></div>
            <div>
              <p className="text-foreground font-medium text-sm">
                {incompleteTradesCount} trade{incompleteTradesCount > 1 ? 's' : ''} awaiting confirmation
              </p>
              <p className="text-foreground/70 text-xs">Please confirm payment received</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search merchant or amount"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent shadow-sm text-sm"
          />
        </div>
        
        {/* Filters Row */}
        <div className="flex gap-3 overflow-x-auto pb-1 items-center">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 bg-card rounded-lg border-border shadow-sm text-sm h-9 flex-shrink-0">
              <div className="flex items-center gap-2 justify-center">
                <ArrowUpDown size={14} className="text-muted-foreground" />
                <SelectValue placeholder="All Types" />
              </div>
            </SelectTrigger>
            <SelectContent className="min-w-32">
              <SelectItem value="all" className="text-sm">All Types</SelectItem>
              <SelectItem value="buy" className="text-sm">Buy</SelectItem>
              <SelectItem value="sell" className="text-sm">Sell</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-32 justify-start text-left font-normal bg-card rounded-lg border-border shadow-sm text-sm h-9",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <Calendar size={14} className="mr-1.5" />
                {dateFrom ? format(dateFrom, "MMM dd") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-32 justify-start text-left font-normal bg-card rounded-lg border-border shadow-sm text-sm h-9",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <Calendar size={14} className="mr-1.5" />
                {dateTo ? format(dateTo, "MMM dd") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo || typeFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={() => {
                setDateFrom(undefined);
                setDateTo(undefined);
                setTypeFilter('all');
              }}
              className="px-2 text-foreground/60 hover:text-foreground text-sm h-9"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="bg-card rounded-lg p-1 shadow-sm border border-border">
          <div className="flex">
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'ongoing'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              Ongoing
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'completed'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'cancelled'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Trades List */}
      <div className="px-4 space-y-4 pb-4">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={20} className="text-foreground/50" />
            </div>
            <p className="text-foreground/70 font-medium">No trades found</p>
            <p className="text-foreground/50 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          filteredTrades.map((trade) => (
            <div 
              key={trade.id} 
              className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTradeClick(trade.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-secondary`}>
                    {trade.type === 'buy' ? (
                      <ArrowDown size={14} className="text-brand" />
                    ) : (
                      <ArrowUp size={14} className="text-success" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground capitalize text-sm">
                      {trade.type}ing {trade.coin}
                    </h3>
                    <p className="text-lg font-bold text-foreground">{trade.amount}</p>
                    <p className="text-xs text-muted-foreground">{trade.coinAmount}</p>
                  </div>
                </div>
                {getStatusBadge(trade.status)}
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mr-3">
                    <User size={14} className="text-foreground/60" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{trade.merchant}</p>
                    <div className="flex items-center">
                      <Star size={12} className="text-brand mr-1" />
                      <span className="text-xs text-muted-foreground">{trade.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{trade.startTime}</p>
                  {/* Show countdown for incomplete trades */}
                  {trade.awaitingUserAction && trade.status === 'waiting_confirmation' && (
                    <TradeCountdown
                      startTime={new Date(trade.date)}
                      duration={30}
                      className="mt-1"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 mr-3">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(trade.status)}`}
                      style={{ width: `${trade.progress}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{trade.progress}%</span>
              </div>

              {/* Action Buttons for Completed Trades */}
              {trade.status === 'completed' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Real receipt data from trade
                      const receiptData = {
                        transactionId: trade.id,
                        amount: trade.tradeData?.amount || parseFloat(trade.coinAmount.replace(/[^\d.]/g, '')),
                        coin: trade.coin,
                        nairaAmount: trade.nairaAmount,
                        rate: trade.tradeData?.rate || 0,
                        escrowAddress: trade.tradeData?.escrow_address || 'N/A',
                        receiverBankDetails: trade.tradeData?.bank_account_details || {
                          accountNumber: 'N/A',
                          bankName: 'N/A',
                          accountName: 'N/A'
                        },
                        completedAt: trade.tradeData?.completed_at ? new Date(trade.tradeData.completed_at) : new Date(),
                        txHash: trade.tradeData?.transaction_hash || 'N/A',
                        tradeType: trade.type,
                        merchant: trade.merchant,
                        status: trade.status
                      };

                      navigate('/receipt', {
                        state: { receiptData }
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Download Receipt
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      const shareText = `Trade completed! ${trade.amount} ${trade.coin} with ${trade.merchant}. Transaction ID: TXN-${trade.id}`;
                      const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                      window.open(shareUrl, '_blank');
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Share
                  </Button>
                </div>
              )}

              {/* Action Buttons for Incomplete Trades */}
              {trade.awaitingUserAction && trade.actionRequired && (
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTradeClick(trade.id);
                    }}
                    className="flex-1 bg-brand hover:bg-brand/90 text-white py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    {trade.actionRequired}
                  </Button>
                </div>
              )}

              {/* Action Button for Waiting Confirmation */}
              {trade.status === 'waiting_confirmation' && trade.awaitingUserAction && (
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmPayment(trade.id);
                    }}
                    className="flex-1 bg-success hover:bg-success/90 text-white py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    Confirm Payment Received
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrade(trade.id);
                    }}
                    variant="destructive"
                    size="sm"
                    className="px-3"
                  >
                    Delete
                  </Button>
                </div>
              )}

              {/* Delete Button for Ongoing Trades */}
              {(trade.status === 'waiting_payment' || trade.status === 'pending') && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTrade(trade.id);
                  }}
                  variant="destructive"
                  size="sm"
                  className="w-full mt-3"
                >
                  Cancel Trade
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Confirmation Dialog */}
      <PaymentConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmationResponse}
      />

      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default MyTrades;