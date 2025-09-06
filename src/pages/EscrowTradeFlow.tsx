import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle, Clock, Wallet, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { escrowTradeService } from '@/services/escrowTradeService';

interface TradeDetails {
  id: string;
  buyer_id: string;
  seller_id: string;
  coin_type: string;
  amount_crypto: number;
  amount_fiat: number;
  status: string;
  escrow_status: string;
  escrow_address?: string;
  buyer: { display_name: string; phone_number?: string };
  seller: { display_name: string; phone_number?: string };
  merchantBankDetails?: any;
}

const EscrowTradeFlow: React.FC = () => {
  const { tradeId } = useParams<{ tradeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [trade, setTrade] = useState<TradeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState('');
  const [paymentProof, setPaymentProof] = useState('');

  useEffect(() => {
    if (!tradeId || !user) return;

    fetchTradeDetails();
    
    // Monitor escrow status changes
    escrowTradeService.monitorEscrowTrade(tradeId, (status) => {
      console.log('Escrow status update:', status);
      if (status.has_received_funds) {
        fetchTradeDetails(); // Refresh trade details
      }
    });
  }, [tradeId, user]);

  const fetchTradeDetails = async () => {
    if (!tradeId) return;

    try {
      setLoading(true);
      const tradeData = await escrowTradeService.getTradeStatus(tradeId);
      setTrade(tradeData);

      // Check if crypto has been deposited and get bank details
      if (tradeData.escrow_status === 'escrow_created') {
        const depositCheck = await escrowTradeService.checkCryptoDeposit(tradeId);
        if (depositCheck.deposited && depositCheck.merchantBankDetails) {
          setTrade(prev => prev ? { ...prev, merchantBankDetails: depositCheck.merchantBankDetails } : null);
        }
      }
    } catch (error) {
      console.error('Error fetching trade details:', error);
      toast({
        title: "Error",
        description: "Failed to load trade details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const handleConfirmPaymentSent = async () => {
    if (!tradeId || !user) return;

    try {
      setActionLoading(true);
      await escrowTradeService.confirmPaymentSent(tradeId, user.id, paymentProof);
      
      toast({
        title: "Payment Confirmed",
        description: "The merchant has been notified. Waiting for their confirmation.",
      });

      fetchTradeDetails();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPaymentReceived = async () => {
    if (!tradeId || !user || !cryptoWalletAddress) return;

    try {
      setActionLoading(true);
      await escrowTradeService.confirmPaymentReceived(tradeId, user.id, cryptoWalletAddress);
      
      toast({
        title: "Trade Completed!",
        description: "Crypto has been released from escrow to the buyer.",
      });

      fetchTradeDetails();
    } catch (error) {
      console.error('Error confirming payment received:', error);
      toast({
        title: "Error",
        description: "Failed to complete trade",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (!trade) return { title: 'Loading...', description: '', step: 0 };

    const isBuyer = trade.buyer_id === user?.id;
    const isSeller = trade.seller_id === user?.id;

    switch (trade.status) {
      case 'accepted':
        if (trade.escrow_status === 'escrow_created') {
          return {
            title: isSeller ? 'Deposit Crypto to Escrow' : 'Waiting for Merchant to Deposit Crypto',
            description: isSeller 
              ? `Please deposit ${trade.amount_crypto} ${trade.coin_type} to the escrow address below`
              : 'The merchant will deposit crypto into escrow. You will be notified when it\'s ready.',
            step: 1
          };
        }
        break;
      case 'crypto_deposited':
        return {
          title: isBuyer ? 'Send Payment to Merchant' : 'Waiting for Payment',
          description: isBuyer
            ? 'Crypto has been deposited in escrow. Send payment to the merchant\'s bank account.'
            : 'Crypto deposited successfully. Waiting for buyer to send payment.',
          step: 2
        };
      case 'payment_sent':
        return {
          title: isSeller ? 'Confirm Payment and Release Crypto' : 'Waiting for Merchant to Confirm',
          description: isSeller
            ? 'Please confirm you received the payment to release crypto from escrow.'
            : 'Payment confirmation sent. Waiting for merchant to verify and release crypto.',
          step: 3
        };
      case 'completed':
        return {
          title: 'Trade Completed Successfully!',
          description: 'Crypto has been released from escrow. Thank you for trading!',
          step: 4
        };
      default:
        return {
          title: 'Trade in Progress',
          description: 'Processing trade request...',
          step: 0
        };
    }
  };

  if (loading || !trade) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trade details...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const isBuyer = trade.buyer_id === user?.id;
  const isSeller = trade.seller_id === user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b p-4 flex items-center justify-between shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-bold">Trade Escrow</h1>
          <p className="text-xs text-muted-foreground">Step {statusInfo.step} of 4</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{statusInfo.title}</CardTitle>
              <Badge variant={trade.status === 'completed' ? 'default' : 'secondary'}>
                {trade.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground">{statusInfo.description}</p>
          </CardHeader>
        </Card>

        {/* Trade Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trade Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-semibold">{trade.amount_crypto} {trade.coin_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Value</p>
                <p className="font-semibold">₦{trade.amount_fiat.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Buyer</p>
                <p className="font-semibold">{trade.buyer.display_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seller</p>
                <p className="font-semibold">{trade.seller.display_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Escrow Address (for merchant to deposit) */}
        {trade.escrow_address && trade.escrow_status === 'escrow_created' && isSeller && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Escrow Deposit Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Deposit {trade.amount_crypto} {trade.coin_type} to this address:</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input 
                    value={trade.escrow_address} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => handleCopyToClipboard(trade.escrow_address!)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ Only send {trade.coin_type} to this address. Sending other cryptocurrencies may result in permanent loss.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Bank Details (for buyer to send payment) */}
        {trade.merchantBankDetails && trade.status === 'crypto_deposited' && isBuyer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Send Payment to Merchant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label>Account Number</Label>
                  <div className="flex items-center gap-2">
                    <Input value={trade.merchantBankDetails.account_number} readOnly />
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => handleCopyToClipboard(trade.merchantBankDetails.account_number)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Bank Name</Label>
                  <Input value={trade.merchantBankDetails.bank_name} readOnly />
                </div>
                <div>
                  <Label>Account Name</Label>
                  <Input value={trade.merchantBankDetails.account_name} readOnly />
                </div>
                <div>
                  <Label>Amount to Send</Label>
                  <Input value={`₦${trade.merchantBankDetails.amount_naira?.toLocaleString()}`} readOnly />
                </div>
                <div>
                  <Label>Reference</Label>
                  <Input value={trade.merchantBankDetails.trade_reference} readOnly />
                </div>
              </div>

              <div>
                <Label>Payment Proof (Optional)</Label>
                <Input 
                  placeholder="Receipt URL or transaction reference"
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleConfirmPaymentSent}
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? 'Confirming...' : 'I Have Sent The Payment'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirm Payment Received (for merchant) */}
        {trade.status === 'payment_sent' && isSeller && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Confirm Payment & Release Crypto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Buyer's Wallet Address</Label>
                <Input 
                  placeholder={`Enter buyer's ${trade.coin_type} wallet address`}
                  value={cryptoWalletAddress}
                  onChange={(e) => setCryptoWalletAddress(e.target.value)}
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✅ Only confirm after you have received the payment. This will release crypto from escrow.
                </p>
              </div>

              <Button 
                onClick={handleConfirmPaymentReceived}
                disabled={actionLoading || !cryptoWalletAddress}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? 'Processing...' : 'I Have Received Payment - Release Crypto'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Completed Status */}
        {trade.status === 'completed' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Trade Completed Successfully!</h3>
                <p className="text-muted-foreground mb-4">
                  {isBuyer 
                    ? `You have received ${trade.amount_crypto} ${trade.coin_type} in your wallet.`
                    : `Crypto has been released to the buyer. You received ₦${trade.amount_fiat.toLocaleString()}.`
                  }
                </p>
                <Button onClick={() => navigate('/my-trades')}>
                  View All Trades
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EscrowTradeFlow;