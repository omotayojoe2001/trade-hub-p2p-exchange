import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const TestTradeCompletion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const createTestCompletedTrade = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a test trade",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Create a test completed trade
      const { data: trade, error } = await supabase
        .from('trades')
        .insert({
          buyer_id: user.id,
          seller_id: user.id, // Same user for testing
          coin_type: 'USDT',
          amount: 100.0,
          amount_crypto: 100.0,
          amount_fiat: 165000.0,
          naira_amount: 165000.0,
          rate: 1650.0,
          net_amount: 165000.0,
          trade_type: 'sell',
          status: 'completed',
          escrow_status: 'completed',
          completed_at: new Date().toISOString(),
          payment_method: 'bank_transfer'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Test Trade Created!",
        description: `Created completed trade with ID: ${trade.id.slice(0, 8)}...`,
      });

      // Navigate to MyTrades to see the result
      navigate('/mytrades');

    } catch (error: any) {
      console.error('Error creating test trade:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create test trade",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestOngoingTrade = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a test trade",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Create a test ongoing trade
      const { data: trade, error } = await supabase
        .from('trades')
        .insert({
          buyer_id: user.id,
          seller_id: user.id, // Same user for testing
          coin_type: 'BTC',
          amount: 0.001,
          amount_crypto: 0.001,
          amount_fiat: 150000.0,
          naira_amount: 150000.0,
          rate: 150000000.0,
          net_amount: 150000.0,
          trade_type: 'buy',
          status: 'pending',
          escrow_status: 'crypto_received',
          payment_method: 'bank_transfer',
          escrow_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Test Trade Created!",
        description: `Created ongoing trade with ID: ${trade.id.slice(0, 8)}...`,
      });

      // Navigate to MyTrades to see the result
      navigate('/mytrades');

    } catch (error: any) {
      console.error('Error creating test trade:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create test trade",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTradesInDatabase = async () => {
    try {
      setLoading(true);

      // Get all trades for current user
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('All trades for user:', trades);

      const completedCount = trades?.filter(t => t.status === 'completed').length || 0;
      const ongoingCount = trades?.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length || 0;

      toast({
        title: "Database Check Complete",
        description: `Found ${trades?.length || 0} total trades (${completedCount} completed, ${ongoingCount} ongoing)`,
      });

    } catch (error: any) {
      console.error('Error checking trades:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check trades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Trade Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This page helps test trade completion functionality. Use these buttons to create test trades and verify they appear in MyTrades.
          </p>

          <Button
            onClick={createTestCompletedTrade}
            disabled={loading}
            className="w-full"
          >
            Create Test Completed Trade
          </Button>

          <Button
            onClick={createTestOngoingTrade}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Create Test Ongoing Trade
          </Button>

          <Button
            onClick={checkTradesInDatabase}
            disabled={loading}
            variant="secondary"
            className="w-full"
          >
            Check Trades in Database
          </Button>

          <Button
            onClick={() => navigate('/mytrades')}
            variant="outline"
            className="w-full"
          >
            Go to MyTrades
          </Button>

          <Button
            onClick={() => navigate('/buy-sell')}
            variant="ghost"
            className="w-full"
          >
            Back to Trade
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestTradeCompletion;