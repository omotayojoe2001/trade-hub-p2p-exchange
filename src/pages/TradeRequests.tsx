import React, { useState } from 'react';
import { ArrowLeft, Search, Filter, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradeRequestCard } from '@/components/TradeRequestCard';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuickAuth } from '@/hooks/useQuickAuth';

const TradeRequests = () => {
  const navigate = useNavigate();
  const { isQuickAuthActive } = useQuickAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [coinFilter, setCoinFilter] = useState('all');

  const tradeRequests = [
    {
      id: '1',
      merchant: 'CryptoMaster',
      rating: 4.9,
      coin: 'BTC',
      amount: '0.005',
      rate: '₦1,180/USD',
      timeLeft: '5 min',
      paymentMethods: ['Bank Transfer', 'PayPal']
    },
    {
      id: '2',
      merchant: 'FastTrader',
      rating: 4.7,
      coin: 'USDT',
      amount: '300',
      rate: '₦1,175/USD',
      timeLeft: '12 min',
      paymentMethods: ['Bank Transfer']
    }
  ];

  const handleAcceptTrade = (requestId: string) => {
    navigate(`/buy-crypto-flow?request=${requestId}`);
  };

  const filteredRequests = tradeRequests.filter(request => {
    const matchesSearch = request.merchant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCoin = coinFilter === 'all' || request.coin === coinFilter;
    return matchesSearch && matchesCoin;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2 p-2">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Trade Requests</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search merchant" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="px-4 space-y-4">
        {filteredRequests.map(request => (
          <TradeRequestCard key={request.id} request={request} onAccept={handleAcceptTrade} />
        ))}
      </div>

      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default TradeRequests;