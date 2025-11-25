import React, { useState, useEffect } from 'react';
import { ChevronRight, AlertCircle, Clock, Calendar, ChevronDown, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { exchangeRateService } from '@/services/exchangeRateService';

import BottomNavigation from '@/components/BottomNavigation';
import StickyHeader from '@/components/StickyHeader';
import CryptoIcon from '@/components/CryptoIcon';
import { toast } from '@/hooks/use-toast';
import MessageThread from '@/components/MessageThread';
import MobileLayout from '@/components/MobileLayout';

import { SwipeToDelete } from '@/components/ui/swipe-to-delete';
import { NativeButton } from '@/components/ui/native-button';
import { LoadingList } from '@/components/ui/native-loading';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface Trade {
  id: string;
  amount: number;
  crypto_type: string;
  status: string;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  coin_type: string;
  trade_type: string;
  rate: number;
  naira_amount: number;
  amount_crypto: number;
  payment_proof_url?: string;
  completed_at?: string;
}

const MyTrades = () => {
  const { user } = useAuth();
  const { impact, notification } = useHapticFeedback();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<{
    otherUserId: string;
    otherUserName: string;
    tradeId?: string;
    cashTradeId?: string;
    contextType: 'crypto_trade' | 'cash_delivery';
  } | null>(null);
  const [usdToNgnRate, setUsdToNgnRate] = useState(1650);

  const fetchTrades = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch regular trades
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      // Fetch cash orders
      const { data: cashOrders, error: cashError } = await supabase
        .from('cash_trades')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch credit purchase transactions
      const { data: creditPurchases, error: creditError } = await supabase
        .from('credit_purchase_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tradesError) {
        console.error('Error fetching trades:', tradesError);
      }
      
      if (cashError) {
        console.error('Error fetching cash orders:', cashError);
      }

      if (creditError) {
        console.error('Error fetching credit purchases:', creditError);
      }

      // Combine and format data
      const allTrades = [
        ...(tradesData || []),
        ...(cashOrders || []).map(order => {
          const tradeRate = order.exchange_rate || usdToNgnRate;
          return {
            ...order,
            trade_type: 'cash_order',
            crypto_type: 'USD',
            coin_type: 'USD',
            amount: order.usd_amount,
            amount_crypto: order.usd_amount,
            naira_amount: order.usd_amount * tradeRate,
            rate: tradeRate
          };
        }),
        ...(creditPurchases || []).map(purchase => {
          const usdAmount = purchase.credits_amount * 0.01; // 1 credit = $0.01
          return {
            ...purchase,
            trade_type: 'credit_purchase',
            crypto_type: 'CREDITS',
            coin_type: 'CREDITS',
            amount: purchase.credits_amount,
            amount_crypto: purchase.credits_amount,
            naira_amount: purchase.price_paid_naira || (usdAmount * usdToNgnRate),
            rate: (purchase.price_paid_naira || (usdAmount * usdToNgnRate)) / purchase.credits_amount,
            buyer_id: user.id,
            seller_id: 'system'
          };
        })
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('Fetched all trades:', allTrades);
      setTrades(allTrades);
    } catch (error) {
      console.error('Error in fetchTrades:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExchangeRate = async () => {
    try {
      const rate = await exchangeRateService.getUSDToNGNRate();
      setUsdToNgnRate(Math.round(rate));
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadExchangeRate();
      fetchTrades();
    }
  }, [user]);

  const getTradeStatus = (trade: Trade) => {
    if (!trade) return { text: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    
    switch (trade.status) {
      case 'pending':
        return { 
          text: 'Pending', 
          color: 'text-yellow-700', 
          bgColor: 'bg-yellow-100' 
        };
      case 'paid':
        return { 
          text: 'Paid', 
          color: 'text-blue-700', 
          bgColor: 'bg-blue-100' 
        };
      case 'completed':
        return { 
          text: 'Completed', 
          color: 'text-green-700', 
          bgColor: 'bg-green-100' 
        };
      case 'cancelled':
        return { 
          text: 'Cancelled', 
          color: 'text-red-700', 
          bgColor: 'bg-red-100' 
        };
      default:
        return { 
          text: trade.status || 'Unknown', 
          color: 'text-gray-700', 
          bgColor: 'bg-gray-100' 
        };
    }
  };

  const handleCompleteTrade = async (tradeId: string) => {
    try {
      await impact('medium');
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) throw error;

      await notification('success');
      toast({
        title: "Success!",
        description: "Trade marked as completed",
      });

      fetchTrades();
    } catch (error) {
      console.error('Error completing trade:', error);
      await notification('error');
      toast({
        title: "Error",
        description: "Failed to complete trade",
        variant: "destructive"
      });
    }
  };

  const handleCancelAllTrades = async () => {
    if (!confirm('Are you sure you want to cancel all ongoing trades? This action cannot be undone.')) {
      return;
    }

    try {
      const ongoingStatuses = ['pending', 'in_progress', 'payment_proof_uploaded', 'vendor_paid', 'payment_confirmed', 'delivery_in_progress'];
      const ongoingTrades = trades.filter(trade => ongoingStatuses.includes(trade.status));
      
      // Cancel regular trades
      const regularTrades = ongoingTrades.filter(trade => trade.trade_type !== 'cash_order');
      if (regularTrades.length > 0) {
        const { error: tradesError } = await supabase
          .from('trades')
          .update({ status: 'cancelled' })
          .in('id', regularTrades.map(t => t.id));
        
        if (tradesError) throw tradesError;
      }
      
      // Cancel cash trades
      const cashTrades = ongoingTrades.filter(trade => trade.trade_type === 'cash_order');
      if (cashTrades.length > 0) {
        const { error: cashError } = await supabase
          .from('cash_trades')
          .update({ status: 'cancelled' })
          .in('id', cashTrades.map(t => t.id));
        
        if (cashError) throw cashError;
      }

      toast({
        title: "Success!",
        description: `Cancelled ${ongoingTrades.length} ongoing trades`,
      });

      fetchTrades();
      
      // Trigger BottomNavigation and Home page refresh
      window.dispatchEvent(new CustomEvent('tradesUpdated'));
      
      // Force immediate refresh of home page data
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tradesUpdated'));
      }, 500);
    } catch (error) {
      console.error('Error cancelling trades:', error);
      toast({
        title: "Error",
        description: "Failed to cancel trades",
        variant: "destructive"
      });
    }
  };

  const filterTradesByDate = (trades: Trade[]) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (dateFilter) {
      case 'Today':
        return trades.filter(trade => new Date(trade.created_at) >= startOfToday);
      case 'This Week':
        return trades.filter(trade => new Date(trade.created_at) >= startOfWeek);
      case 'This Month':
        return trades.filter(trade => new Date(trade.created_at) >= startOfMonth);
      case 'All Time':
      default:
        return trades;
    }
  };

  const filterTrades = (trades: Trade[]) => {
    if (activeTab === 'All') return trades;
    
    const statusMap = {
      'Ongoing': ['pending', 'in_progress', 'payment_proof_uploaded', 'vendor_paid', 'payment_confirmed', 'delivery_in_progress', 'paid'],
      'Completed': ['completed', 'cash_delivered'],
      'Cancelled': ['cancelled'],
      'Disputes': ['disputed', 'under_review']
    };
    
    return trades.filter(trade => {
      const statuses = statusMap[activeTab as keyof typeof statusMap] || [];
      return statuses.includes(trade.status);
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return `NGN ${amount.toLocaleString()}`;
    }
    return `${amount} ${currency}`;
  };



  const filteredTrades = filterTradesByDate(filterTrades(trades));

  const handleRefresh = async () => {
    await fetchTrades();
    await loadExchangeRate();
  };

  const handleDeleteTrade = async (tradeId: string) => {
    try {
      await impact('heavy');
      // Add delete logic here
      await notification('warning');
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  return (
    <MobileLayout 
      statusBarStyle="dark"
      className="font-['Poppins']"
    >
      <StickyHeader 
        title="My Trades" 
        rightElement={
          <div className="flex items-center space-x-3">
            {/* Cancel All Button - only show for Ongoing tab */}
            {activeTab === 'Ongoing' && filteredTrades.length > 0 && (
              <button
                onClick={handleCancelAllTrades}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Cancel All
              </button>
            )}
            
            {/* Date Filter Dropdown */}
            <div className="relative">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Calendar size={16} />
              <span>{dateFilter}</span>
              <ChevronDown size={16} className={`transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
            </button>
            
            {showDateFilter && (
              <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-10">
                {['All Time', 'Today', 'This Week', 'This Month'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setDateFilter(filter);
                      setShowDateFilter(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors ${
                      dateFilter === filter ? 'bg-accent text-accent-foreground' : 'text-foreground'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>
        }
      />
      <div className="px-4 pt-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">My Trades</h1>
          
          <div className="flex items-center space-x-3">
            {/* Cancel All Button - only show for Ongoing tab */}
            {activeTab === 'Ongoing' && filteredTrades.length > 0 && (
              <button
                onClick={handleCancelAllTrades}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Cancel All
              </button>
            )}
            
            {/* Date Filter Dropdown */}
            <div className="relative">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Calendar size={16} />
              <span>{dateFilter}</span>
              <ChevronDown size={16} className={`transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
            </button>
            
            {showDateFilter && (
              <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-10">
                {['All Time', 'Today', 'This Week', 'This Month'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setDateFilter(filter);
                      setShowDateFilter(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors ${
                      dateFilter === filter ? 'bg-accent text-accent-foreground' : 'text-foreground'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-4">
          {['All', 'Ongoing', 'Completed', 'Cancelled', 'Disputes'].map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`py-1.5 px-3 text-xs font-medium rounded-full transition-all duration-200 ${
                activeTab === status
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingList count={6} />
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trades found</h3>
            <p className="text-gray-500">
              {activeTab === 'All' 
                ? "You haven't made any trades yet." 
                : `No ${activeTab.toLowerCase()} trades found.`
              }
            </p>
            <Link 
              to="/buy-sell" 
              className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Trading
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrades.map((trade) => {
              const status = getTradeStatus(trade);
              const userRole = (trade as any).buyer_id === user?.id ? 'buyer' : 'seller';
              const shouldShowComplete = trade.status === 'pending' && (trade as any).payment_proof_url;

              return (
                <SwipeToDelete
                  key={trade.id}
                  onDelete={() => handleDeleteTrade(trade.id)}
                  deleteText="Cancel"
                >
                  <div className="native-card native-list-item p-4 hover:shadow-md smooth-animation">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <CryptoIcon 
                        symbol={(trade.crypto_type || trade.coin_type || 'BTC').toUpperCase()} 
                        size={32} 
                      />
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-sm text-foreground">
                            {trade.trade_type === 'credit_purchase' 
                              ? 'Credit Purchase' 
                              : `${userRole === 'buyer' ? 'Buy' : 'Sell'} ${trade.crypto_type || trade.coin_type}`
                            }
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(trade.created_at)}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Amount</div>
                      <div className="font-medium text-xs text-foreground">
                        {trade.trade_type === 'credit_purchase' 
                          ? `${trade.amount} Credits`
                          : `${(trade as any).amount_crypto || trade.amount} ${trade.crypto_type || trade.coin_type}`
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Value</div>
                      <div className="font-medium text-xs text-foreground">
                        {formatAmount((trade as any).naira_amount || trade.amount, 'NGN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Rate</div>
                      <div className="font-medium text-xs text-foreground">
                        {trade.trade_type === 'credit_purchase' 
                          ? 'NGN 0.01/Credit'
                          : `NGN ${(trade as any).rate?.toLocaleString() || 'N/A'}`
                        }
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link
                      to={
                        trade.trade_type === 'cash_order' 
                          ? `/cash-trade-status/${trade.id}` 
                          : trade.trade_type === 'credit_purchase'
                          ? `/credits-history`
                          : `/trade-details/${trade.id}`
                      }
                      className="flex-1"
                    >
                      <NativeButton 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        hapticFeedback="light"
                      >
                        {trade.trade_type === 'credit_purchase' ? 'View Receipt' : 'View Details'}
                      </NativeButton>
                    </Link>
                    
                    {trade.trade_type !== 'credit_purchase' && (
                      <NativeButton
                        variant="ghost"
                        size="sm"
                        className="px-3 text-xs"
                        hapticFeedback="light"
                        onClick={() => {
                          const otherUserId = userRole === 'buyer' ? trade.seller_id : trade.buyer_id;
                          if (otherUserId && otherUserId !== 'other-user') {
                            setSelectedMessage({
                              otherUserId,
                              otherUserName: userRole === 'buyer' ? 'Seller' : 'Buyer',
                              tradeId: trade.trade_type === 'cash_order' ? undefined : trade.id,
                              cashTradeId: trade.trade_type === 'cash_order' ? trade.id : undefined,
                              contextType: trade.trade_type === 'cash_order' ? 'cash_delivery' : 'crypto_trade'
                            });
                          } else {
                            alert('Other user not found for this trade');
                          }
                        }}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Message
                      </NativeButton>
                    )}
                    
                    {shouldShowComplete && (
                      <NativeButton
                        variant="default"
                        size="sm"
                        className="px-3 text-xs bg-green-600 hover:bg-green-700"
                        hapticFeedback="medium"
                        onClick={() => handleCompleteTrade(trade.id)}
                      >
                        Complete
                      </NativeButton>
                    )}
                  </div>
                  </div>
                </SwipeToDelete>
              );
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
      
      {/* Message Thread */}
      {selectedMessage && (
        <MessageThread
          otherUserId={selectedMessage.otherUserId}
          otherUserName={selectedMessage.otherUserName}
          tradeId={selectedMessage.tradeId}
          cashTradeId={selectedMessage.cashTradeId}
          contextType={selectedMessage.contextType}
          isOpen={true}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </MobileLayout>
  );
};

export default MyTrades;