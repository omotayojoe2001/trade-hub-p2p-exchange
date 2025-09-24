import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const TestCredits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credits, setCredits] = useState('100');
  const [loading, setLoading] = useState(false);

  const addTestCredits = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const creditsAmount = parseInt(credits);
      
      // Add credits to existing balance
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('user_id', user.id)
        .single();

      const currentCredits = currentProfile?.credits_balance || 0;
      const newTotal = currentCredits + creditsAmount;

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          credits_balance: newTotal
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('credit_purchase_transactions')
        .insert({
          user_id: user.id,
          credits_amount: creditsAmount,
          price_paid_naira: 0,
          status: 'paid',
          payment_reference: `TEST_${Date.now()}`
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
      }

      toast({
        title: "Credits Added",
        description: `${creditsAmount} credits added. Total: ${newTotal} credits`,
      });

    } catch (error) {
      console.error('Error adding credits:', error);
      toast({
        title: "Error",
        description: "Failed to add credits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUserCredits = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits_balance, user_id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
        toast({
          title: "Error",
          description: `Database error: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Current Credits",
        description: `You have ${data?.credits_balance || 0} credits`,
      });

    } catch (error) {
      console.error('Error checking credits:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Credits System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Credits to Add</label>
              <Input
                type="number"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                placeholder="Enter credits amount"
              />
            </div>
            
            <Button 
              onClick={addTestCredits} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Adding...' : 'Add Test Credits'}
            </Button>
            
            <Button 
              onClick={checkUserCredits}
              variant="outline"
              className="w-full"
            >
              Check Current Credits
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>User ID: {user?.id}</p>
              <p>This will add credits directly to your profile</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestCredits;