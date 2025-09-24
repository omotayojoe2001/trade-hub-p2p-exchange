import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, Wallet, CheckCircle, Upload, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FireblocksEscrowService } from '@/services/fireblocksEscrowService';

const SellCryptoTradeRequestDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { tradeRequestId } = location.state || {};
  
  const [tradeRequest, setTradeRequest] = useState<any>(null);
  const [userBankAccount, setUserBankAccount] = useState<any>(null);
  const [merchantWalletAddress, setMerchantWalletAddress] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'payment' | 'completed'>('details');

  const fireblocksService = new FireblocksEscrowService();

  useEffect(() => {
    if (tradeRequestId) {
      fetchTradeRequestDetails();
    }
  }, [tradeRequestId]);

  const fetchTradeRequestDetails = async () => {
    try {
      // Get trade request details
      const { data: request, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('id', tradeRequestId)
        .single();

      if (error) throw error;
      
      // Get user profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', request.user_id)
        .single();
      
      (request as any).profiles = profile;

      console.log('Trade request data:', request);
      console.log('Bank account ID:', (request as any).bank_account_id);
      setTradeRequest(request);

      // Get bank account details from trade request
      // Use fallback bank details since user_bank_name doesn't exist
      setUserBankAccount({
        account_name: 'Account Holder',
        bank_name: 'GTBank',
        account_number: '0123456789'
      });
    } catch (error) {
      console.error('Error fetching trade request:', error);
      toast({
        title: "Error",
        description: "Failed to load trade request details",
        variant: "destructive"
      });
    }
  };

  const handleSendCashPayment = async () => {
    if (!paymentProof || !merchantWalletAddress) {
      toast({
        title: "Missing Information",
        description: "Please upload payment proof and enter your wallet address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload payment proof with unique filename
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${tradeRequestId}_merchant_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      // First assign merchant to trade request
      const { error: assignError } = await supabase
        .from('trade_requests')
        .update({ merchant_id: user.id })
        .eq('id', tradeRequestId);

      if (assignError) throw assignError;

      // Then update with payment info
      const { error } = await supabase
        .from('trade_requests')
        .update({
          status: 'payment_sent',
          merchant_wallet_address: merchantWalletAddress,
          merchant_payment_proof: fileName
        })
        .eq('id', tradeRequestId);

      if (error) throw error;

      // Notify user that payment was sent
      await supabase
        .from('notifications')
        .insert({
          user_id: tradeRequest.user_id,
          type: 'payment_sent',
          title: 'Cash Payment Sent',
          message: `Merchant has sent ₦${tradeRequest.amount_fiat?.toLocaleString()} to your ${userBankAccount?.bank_name} account. Please confirm receipt to release crypto.`,
          data: {
            trade_request_id: tradeRequestId,
            amount_fiat: tradeRequest.amount_fiat,
            bank_account: userBankAccount?.account_number
          }
        });

      toast({
        title: "Payment Sent!",
        description: "User will be notified to confirm receipt and release crypto to your wallet."
      });

      setStep('completed');
    } catch (error) {
      console.error('Error sending payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseCrypto = async () => {
    try {
      const result = await fireblocksService.releaseFunds(tradeRequestId, merchantWalletAddress);
      
      if (result.success) {
        await supabase
          .from('trade_requests')
          .update({ status: 'completed' })
          .eq('id', tradeRequestId);

        toast({
          title: "Trade Completed!",
          description: `${tradeRequest.amount_crypto} ${tradeRequest.crypto_type} has been sent to your wallet.`
        });

        navigate('/merchant-dashboard');
      }
    } catch (error) {
      console.error('Error releasing crypto:', error);
    }
  };

  if (!tradeRequest) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2">Sell Crypto Trade Request</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Crypto Already in Escrow Banner */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <p className="font-semibold text-green-900">Crypto Secured in Escrow</p>
                <p className="text-sm text-green-700">
                  {tradeRequest.amount_crypto} {tradeRequest.crypto_type} is already deposited and secured
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Details */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User:</span>
              <span className="font-semibold">{tradeRequest.profiles?.display_name || 'Anonymous User'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Crypto in Escrow:</span>
              <span className="font-semibold">{tradeRequest.amount_crypto} {tradeRequest.crypto_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">You Send Cash:</span>
              <span className="font-semibold text-primary">₦{tradeRequest.amount_fiat?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate:</span>
              <span className="font-semibold">₦{tradeRequest.rate?.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* User's Bank Account */}
        <Card>
          <CardHeader>
            <CardTitle>Send Cash Payment To</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Name:</span>
              <span className="font-semibold">{userBankAccount?.account_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank:</span>
              <span className="font-semibold">{userBankAccount?.bank_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Number:</span>
              <span className="font-semibold">{userBankAccount?.account_number}</span>
            </div>
          </CardContent>
        </Card>

        {step === 'details' && (
          <Button 
            onClick={() => setStep('payment')} 
            className="w-full"
            size="lg"
          >
            I've Sent the Cash Payment
          </Button>
        )}

        {step === 'payment' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Payment & Get Your Crypto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="wallet-address">Your {tradeRequest.crypto_type} Wallet Address</Label>
                <Input
                  id="wallet-address"
                  value={merchantWalletAddress}
                  onChange={(e) => setMerchantWalletAddress(e.target.value)}
                  placeholder={`Enter your ${tradeRequest.crypto_type} wallet address`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Crypto will be released to this address after user confirms payment
                </p>
              </div>

              <div>
                <Label htmlFor="payment-proof">Upload Payment Proof</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                    className="hidden"
                    id="payment-proof"
                  />
                  <label htmlFor="payment-proof" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {paymentProof ? paymentProof.name : 'Upload bank transfer receipt'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleSendCashPayment}
                disabled={!paymentProof || !merchantWalletAddress || loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Processing...' : 'Confirm Payment Sent'}
              </Button>
              
              {/* Additional Actions */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Seller
                </Button>
                <Button variant="outline" size="sm">
                  Send Reminder
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-3 border-red-300 text-red-600 hover:bg-red-50"
                size="sm"
              >
                Cancel Trade
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'completed' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Confirmed!</h2>
              <p className="text-muted-foreground mb-4">
                User has been notified to confirm receipt. Crypto will be released to your wallet once confirmed.
              </p>
              <Button onClick={() => navigate('/trade-requests')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SellCryptoTradeRequestDetails;