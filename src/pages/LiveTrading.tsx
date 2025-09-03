import React, { useState } from 'react';
import { useRealTimeTrading } from '@/hooks/useRealTimeTrading';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowUpDown, Clock, DollarSign, Users, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const LiveTrading = () => {
  const { user } = useAuth();
  const { tradeRequests, userTrades, loading, createTradeRequest, acceptTradeRequest, updateTradeStatus } = useRealTimeTrading();
  
  const [formData, setFormData] = useState({
    trade_type: 'buy' as 'buy' | 'sell',
    coin_type: 'BTC',
    amount: '',
    naira_amount: '',
    rate: '',
    payment_method: 'bank_transfer',
    notes: ''
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate based on amount and rate
      if (field === 'amount' || field === 'rate') {
        const amount = parseFloat(updated.amount) || 0;
        const rate = parseFloat(updated.rate) || 0;
        if (amount && rate) {
          updated.naira_amount = (amount * rate).toString();
        }
      }
      
      return updated;
    });
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      await createTradeRequest({
        trade_type: formData.trade_type,
        coin_type: formData.coin_type,
        amount: parseFloat(formData.amount),
        naira_amount: parseFloat(formData.naira_amount),
        rate: parseFloat(formData.rate),
        payment_method: formData.payment_method,
        notes: formData.notes
      });
      
      // Reset form
      setFormData({
        trade_type: 'buy',
        coin_type: 'BTC',
        amount: '',
        naira_amount: '',
        rate: '',
        payment_method: 'bank_transfer',
        notes: ''
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'matched': return 'bg-yellow-500';
      case 'pending': return 'bg-blue-500';
      case 'payment_sent': return 'bg-orange-500';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getUserType = (userType: string) => {
    return userType === 'premium' ? (
      <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-yellow-600">
        <Zap className="w-3 h-3 mr-1" />
        Premium
      </Badge>
    ) : (
      <Badge variant="secondary">Free</Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading live trading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Live Trading Hub
        </h1>
        <p className="text-muted-foreground">Real-time cryptocurrency trading with instant matching</p>
      </div>

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace">
            <Users className="w-4 h-4 mr-2" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="create">
            <DollarSign className="w-4 h-4 mr-2" />
            Create Request
          </TabsTrigger>
          <TabsTrigger value="trades">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            My Trades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active Trade Requests</h2>
            <Badge variant="outline" className="animate-pulse">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Live
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {tradeRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Requests</h3>
                  <p className="text-muted-foreground">Be the first to create a trade request!</p>
                </CardContent>
              </Card>
            ) : (
              tradeRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={`${request.trade_type === 'buy' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                            {request.trade_type.toUpperCase()}
                          </Badge>
                          <span className="font-semibold text-lg">{request.amount} {request.coin_type}</span>
                          {request.user_type && getUserType(request.user_type)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Trader:</strong> {request.display_name || 'Anonymous'}</p>
                          <p><strong>Rate:</strong> ₦{request.rate.toLocaleString()} per {request.coin_type}</p>
                          <p><strong>Total:</strong> ₦{request.naira_amount.toLocaleString()}</p>
                          <p><strong>Payment:</strong> {request.payment_method.replace('_', ' ')}</p>
                          <p><strong>Posted:</strong> {formatDistanceToNow(new Date(request.created_at))} ago</p>
                        </div>
                        {request.notes && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm">{request.notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        {request.user_id !== user?.id && request.status === 'open' && (
                          <Button 
                            onClick={() => acceptTradeRequest(request.id)}
                            className="w-full"
                          >
                            Accept Trade
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create Trade Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRequest} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trade Type</Label>
                    <Select 
                      value={formData.trade_type} 
                      onValueChange={(value) => handleInputChange('trade_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy Crypto</SelectItem>
                        <SelectItem value="sell">Sell Crypto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cryptocurrency</Label>
                    <Select 
                      value={formData.coin_type} 
                      onValueChange={(value) => handleInputChange('coin_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                        <SelectItem value="USDT">Tether (USDT)</SelectItem>
                        <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount ({formData.coin_type})</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rate (₦ per {formData.coin_type})</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.rate}
                      onChange={(e) => handleInputChange('rate', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Total Amount (₦)</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.naira_amount}
                      onChange={(e) => handleInputChange('naira_amount', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Payment Method</Label>
                    <Select 
                      value={formData.payment_method} 
                      onValueChange={(value) => handleInputChange('payment_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash_delivery">Cash Delivery</SelectItem>
                        <SelectItem value="cash_pickup">Cash Pickup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Additional instructions or requirements..."
                      rows={3}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Trade Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          <h2 className="text-xl font-semibold">My Active Trades</h2>
          
          <div className="grid gap-4">
            {userTrades.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ArrowUpDown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Trades</h3>
                  <p className="text-muted-foreground">Your active trades will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              userTrades.map((trade) => (
                <Card key={trade.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={`${trade.trade_type === 'buy' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                            {trade.trade_type.toUpperCase()}
                          </Badge>
                          <span className="font-semibold text-lg">{trade.amount} {trade.coin_type}</span>
                          <Badge variant="outline" className={getStatusColor(trade.status)}>
                            {trade.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Rate:</strong> ₦{trade.rate.toLocaleString()} per {trade.coin_type}</p>
                          <p><strong>Total:</strong> ₦{trade.naira_amount.toLocaleString()}</p>
                          <p><strong>Payment:</strong> {trade.payment_method.replace('_', ' ')}</p>
                          <p><strong>Role:</strong> {trade.buyer_id === user?.id ? 'Buyer' : 'Seller'}</p>
                          <p><strong>Started:</strong> {formatDistanceToNow(new Date(trade.created_at))} ago</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {trade.status === 'pending' && trade.buyer_id === user?.id && (
                          <Button 
                            onClick={() => updateTradeStatus(trade.id, 'payment_sent')}
                            size="sm"
                          >
                            Mark Payment Sent
                          </Button>
                        )}
                        {trade.status === 'payment_sent' && trade.seller_id === user?.id && (
                          <Button 
                            onClick={() => updateTradeStatus(trade.id, 'payment_confirmed')}
                            size="sm"
                          >
                            Confirm Payment
                          </Button>
                        )}
                        {trade.status === 'payment_confirmed' && trade.seller_id === user?.id && (
                          <Button 
                            onClick={() => updateTradeStatus(trade.id, 'completed')}
                            size="sm"
                          >
                            Release Crypto
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveTrading;