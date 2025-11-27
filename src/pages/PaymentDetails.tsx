import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Eye, Copy, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PaymentDetails = () => {
  const navigate = useNavigate();
  const { tradeRequestId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tradeRequest, setTradeRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedWallet, setCopiedWallet] = useState(false);

  useEffect(() => {
    if (tradeRequestId) {
      fetchPaymentDetails();
    }
  }, [tradeRequestId]);

  const fetchPaymentDetails = async () => {
    try {
      const { data: request, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('id', tradeRequestId)
        .single();

      if (error) throw error;
      
      setTradeRequest(request);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast({
        title: "Error",
        description: "Failed to load payment details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyWalletAddress = async () => {
    if (tradeRequest?.merchant_wallet_address) {
      try {
        await navigator.clipboard.writeText(tradeRequest.merchant_wallet_address);
        setCopiedWallet(true);
        toast({
          title: "Copied!",
          description: "Wallet address copied to clipboard"
        });
        setTimeout(() => setCopiedWallet(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const downloadPaymentProof = () => {
    if (tradeRequest?.merchant_payment_proof) {
      window.open(tradeRequest.merchant_payment_proof, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!tradeRequest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Payment details not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2">Payment Details</h1>
      </div>

      <div className="p-3 space-y-3">
        {/* Trade Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trade ID:</span>
              <span className="font-mono text-sm">{tradeRequest.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Crypto Amount:</span>
              <span className="font-semibold">{tradeRequest.amount_crypto} {tradeRequest.crypto_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Amount:</span>
              <span className="font-semibold text-primary">₦{tradeRequest.amount_fiat?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                tradeRequest.status === 'completed' ? 'bg-green-100 text-green-800' :
                tradeRequest.status === 'payment_sent' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {tradeRequest.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Merchant Wallet Address */}
        {tradeRequest.merchant_wallet_address && (
          <Card>
            <CardHeader>
              <CardTitle>Merchant Wallet Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-mono text-sm break-all mr-2">
                  {tradeRequest.merchant_wallet_address}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyWalletAddress}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  {copiedWallet ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Proof */}
        {tradeRequest.merchant_payment_proof && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Proof</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center">
                  <Eye className="w-5 h-5 text-muted-foreground mr-3" />
                  <div>
                    <p className="font-medium">Payment Receipt</p>
                    <p className="text-sm text-muted-foreground">
                      Uploaded on {new Date(tradeRequest.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadPaymentProof}
                >
                  <Download className="w-4 h-4 mr-2" />
                  View
                </Button>
              </div>
              
              {/* If it's an image, show preview */}
              {tradeRequest.merchant_payment_proof.includes('image') && (
                <div className="border rounded-lg p-2">
                  <img 
                    src={tradeRequest.merchant_payment_proof} 
                    alt="Payment proof" 
                    className="max-w-full h-64 object-contain mx-auto"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium">Trade Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tradeRequest.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {tradeRequest.status !== 'open' && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Payment Sent</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tradeRequest.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              {tradeRequest.status === 'completed' && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Trade Completed</p>
                    <p className="text-sm text-muted-foreground">
                      Crypto released to merchant wallet
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button 
            onClick={() => navigate('/trade-requests')} 
            className="w-full"
          >
            Back to Dashboard
          </Button>
          
          {tradeRequest.status === 'payment_sent' && (
            <Button 
              variant="outline" 
              onClick={() => navigate(`/sell-crypto-trade-request-details`, { 
                state: { tradeRequestId: tradeRequest.id } 
              })} 
              className="w-full"
            >
              Back to Trade Details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;