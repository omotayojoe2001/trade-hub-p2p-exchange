import React, { useState, useMemo } from 'react';
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

const MyTrades = () => {
  const navigate = useNavigate();
  const { isQuickAuthActive } = useQuickAuth();
  const { isPremium } = usePremium();
  const { user } = useAuth();

  // Redirect premium users to premium trades page
  React.useEffect(() => {
    if (user && isPremium) {
      navigate('/premium-trades');
    }
  }, [user, isPremium, navigate]);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);

  const trades = [
    {
      id: 1,
      type: 'buy',
      coin: 'BTC',
      amount: '₦520,000',
      coinAmount: '≈ 0.0045 BTC',
      merchant: 'BlockExchange24',
      rating: 4.8,
      status: 'waiting_payment',
      progress: 50,
      startTime: 'June 28, 10:34 AM',
      date: new Date('2024-06-28'),
      avatar: 'U',
      category: 'ongoing'
    },
    {
      id: 2,
      type: 'sell',
      coin: 'USDT',
      amount: '₦730,500',
      coinAmount: '≈ 500 USDT',
      merchant: 'CryptoQueen',
      rating: 4.9,
      status: 'waiting_confirmation',
      progress: 75,
      startTime: 'June 28, 09:15 AM',
      date: new Date('2024-06-28'),
      avatar: 'CQ',
      awaitingUserAction: true,
      category: 'ongoing'
    },
    {
      id: 3,
      type: 'buy',
      coin: 'BTC',
      amount: '₦1,250,000',
      coinAmount: '≈ 0.0089 BTC',
      merchant: 'BitTrader',
      rating: 4.7,
      status: 'completed',
      progress: 100,
      startTime: 'June 27, 15:22 PM',
      date: new Date('2024-06-27'),
      avatar: 'BT',
      category: 'completed'
    },
    {
      id: 4,
      type: 'sell',
      coin: 'USDT',
      amount: '₦450,000',
      coinAmount: '≈ 300 USDT',
      merchant: 'FastCrypto',
      rating: 4.6,
      status: 'cancelled',
      progress: 0,
      startTime: 'June 26, 14:30 PM',
      date: new Date('2024-06-26'),
      avatar: 'FC',
      category: 'cancelled'
    },
    {
      id: 5,
      type: 'buy',
      coin: 'BTC',
      amount: '₦890,000',
      coinAmount: '≈ 0.0078 BTC',
      merchant: 'CoinMaster',
      rating: 4.9,
      status: 'completed',
      progress: 100,
      startTime: 'June 25, 11:45 AM',
      date: new Date('2024-06-25'),
      avatar: 'CM',
      category: 'completed'
    }
  ];

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

  const handleConfirmationResponse = (received: boolean) => {
    if (received && selectedTradeId) {
      console.log('Payment confirmed for trade:', selectedTradeId);
      // In real app, this would update the trade status
    }
    setShowConfirmDialog(false);
    setSelectedTradeId(null);
  };

  const handleTradeClick = (tradeId: number) => {
    navigate(`/trade-details/${tradeId}`);
  };

  // Filter trades based on active tab, search, type, and date
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Tab filter
      if (activeTab === 'ongoing' && trade.category !== 'ongoing') return false;
      if (activeTab === 'completed' && trade.category !== 'completed') return false;
      if (activeTab === 'cancelled' && trade.category !== 'cancelled') return false;

      // Search filter
      if (searchQuery && !trade.merchant.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !trade.amount.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // Type filter
      if (typeFilter !== 'all' && trade.type !== typeFilter) return false;

      // Date filter
      if (dateFrom && trade.date < dateFrom) return false;
      if (dateTo && trade.date > dateTo) return false;

      return true;
    });
  }, [trades, activeTab, searchQuery, typeFilter, dateFrom, dateTo]);

  const incompleteTradesCount = trades.filter(trade => trade.awaitingUserAction).length;

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
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-28 bg-card rounded-lg border-border shadow-sm text-sm h-9">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown size={14} />
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
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
                      // Mock receipt data
                      const receiptData = {
                        transactionId: `TXN-${trade.id}`,
                        amount: parseFloat(trade.coinAmount.replace(/[^\d.]/g, '')),
                        coin: trade.coin,
                        escrowAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                        receiverBankDetails: {
                          accountNumber: '1234567890',
                          bankName: 'First Bank of Nigeria',
                          accountName: 'John Doe'
                        },
                        completedAt: new Date(),
                        txHash: '0x1234567890abcdef'
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

              {/* Action Button for Waiting Confirmation */}
              {trade.status === 'waiting_confirmation' && trade.awaitingUserAction && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmPayment(trade.id);
                  }}
                  className="w-full bg-success hover:bg-success/90 text-white py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all"
                >
                  Confirm Payment Received
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