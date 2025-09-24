import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

const AdminCredits = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPurchases();
  }, []);

  const fetchPendingPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_purchases')
        .select(`
          *,
          profiles!inner(display_name, user_id)
        `)
        .in('status', ['pending', 'paid'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmPurchase = async (purchaseId: string, userId: string, creditsAmount: number) => {
    try {
      // Add credits to user
      const { error: addError } = await supabase.rpc('add_user_credits', {
        user_id_param: userId,
        credits_amount: creditsAmount,
        description_text: `Credit purchase confirmed - ${creditsAmount} credits ($${(creditsAmount * 0.01).toFixed(2)})`
      });

      if (addError) throw addError;

      // Update purchase status
      const { error: updateError } = await supabase
        .from('credit_purchases')
        .update({
          status: 'completed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', purchaseId);

      if (updateError) throw updateError;

      toast({
        title: "Purchase Confirmed",
        description: `${creditsAmount} credits added to user account`,
      });

      fetchPendingPurchases();
    } catch (error) {
      console.error('Error confirming purchase:', error);
      toast({
        title: "Error",
        description: "Failed to confirm purchase",
        variant: "destructive"
      });
    }
  };

  const rejectPurchase = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('credit_purchases')
        .update({ status: 'failed' })
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: "Purchase Rejected",
        description: "Purchase has been marked as failed",
      });

      fetchPendingPurchases();
    } catch (error) {
      console.error('Error rejecting purchase:', error);
      toast({
        title: "Error",
        description: "Failed to reject purchase",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin - Credit Purchases</h1>
        
        {purchases.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">No pending purchases</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{purchase.credits_amount} Credits Purchase</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                      purchase.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                      purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {purchase.status}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>User:</strong> {purchase.profiles?.display_name || 'Unknown'}
                    </div>
                    <div>
                      <strong>Amount:</strong> {purchase.crypto_amount} {purchase.crypto_type}
                    </div>
                    <div>
                      <strong>USD Value:</strong> ${(purchase.credits_amount * 0.01).toFixed(2)}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(purchase.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600 mb-1">Payment Address:</div>
                    <div className="font-mono text-sm break-all">{purchase.payment_address}</div>
                  </div>

                  {purchase.transaction_hash && (
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600 mb-1">Transaction Hash:</div>
                      <div className="font-mono text-sm break-all">{purchase.transaction_hash}</div>
                    </div>
                  )}

                  {purchase.payment_proof_url && (
                    <div>
                      <div className="text-xs text-gray-600 mb-2">Payment Proof:</div>
                      <img 
                        src={purchase.payment_proof_url} 
                        alt="Payment proof" 
                        className="max-w-xs rounded border"
                      />
                    </div>
                  )}

                  {(purchase.status === 'pending' || purchase.status === 'paid') && (
                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={() => confirmPurchase(purchase.id, purchase.user_id, purchase.credits_amount)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Confirm & Add Credits
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => rejectPurchase(purchase.id)}
                      >
                        <XCircle size={16} className="mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCredits;