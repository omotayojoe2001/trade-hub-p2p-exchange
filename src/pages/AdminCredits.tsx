import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreditPurchase {
  id: string;
  user_id: string;
  credits_amount: number;
  price_paid_naira: number;
  status: string;
  payment_proof_url?: string;
  created_at: string;
  profiles: {
    display_name: string;
    email: string;
  };
}

const AdminCredits = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadPurchases();
  }, [user, profile]);

  const loadPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_purchase_transactions')
        .select(`
          *,
          profiles:user_id (
            display_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const approvePurchase = async (purchaseId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-credit-purchase', {
        body: { purchaseId }
      });

      if (error) throw error;

      toast({
        title: "Purchase Approved",
        description: "Credits have been added to user account",
      });

      loadPurchases();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve purchase",
        variant: "destructive"
      });
    }
  };

  const rejectPurchase = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('credit_purchase_transactions')
        .update({ status: 'rejected' })
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: "Purchase Rejected",
        description: "Purchase has been rejected",
      });

      loadPurchases();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject purchase",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="mr-4">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold">Credit Purchase Management</h1>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading purchases...</div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold">
                          {purchase.profiles?.display_name || 'Unknown User'}
                        </h3>
                        <Badge className={getStatusColor(purchase.status)}>
                          {purchase.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Email: {purchase.profiles?.email}</p>
                        <p>Credits: {purchase.credits_amount}</p>
                        <p>Amount: ₦{purchase.price_paid_naira?.toLocaleString()}</p>
                        <p>Date: {new Date(purchase.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {purchase.payment_proof_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(purchase.payment_proof_url, '_blank')}
                        >
                          <Eye size={16} className="mr-1" />
                          View Proof
                        </Button>
                      )}
                      
                      {purchase.status === 'paid' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approvePurchase(purchase.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check size={16} className="mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => rejectPurchase(purchase.id)}
                          >
                            <X size={16} className="mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
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