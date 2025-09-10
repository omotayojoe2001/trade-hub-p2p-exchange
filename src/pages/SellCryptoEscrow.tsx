import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Copy, Clock, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/BottomNavigation';

const SellCryptoEscrow: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [escrowAddress, setEscrowAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [cryptoDeposited, setCryptoDeposited] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [trade, setTrade] = useState<any>(null);

  // Get sell crypto data from location state
  const sellData = location.state || {};
  const { amount, nairaAmount, cryptoType = 'USDT', tradeRequestId, merchantId, merchantName } = sellData;

  useEffect(() => {
    if (!user || !tradeRequestId) {
      navigate('/buy-sell');
      return;
    }

    createEscrowTrade();
  }, [user, tradeRequestId]);

  const createEscrowTrade = async () => {
    try {
      setLoading(true);

      // Wait for merchant to accept the trade request
      // For now, we'll simulate escrow creation
      const escrowAddr = generateEscrowAddress(cryptoType);
      setEscrowAddress(escrowAddr);

      // Create the trade record
      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .insert({
          trade_request_id: tradeRequestId,
          seller_id: user!.id, // User is selling crypto
          buyer_id: merchantId, // Merchant is buying crypto
          coin_type: cryptoType,
          amount: parseFloat(amount),
          amount_crypto: parseFloat(amount),
          amount_fiat: parseFloat(nairaAmount.replace(/[^0-9.-]+/g, "")),
          naira_amount: parseFloat(nairaAmount.replace(/[^0-9.-]+/g, "")),
          rate: parseFloat(nairaAmount.replace(/[^0-9.-]+/g, "")) / parseFloat(amount),
          status: 'pending_crypto_deposit',
          trade_type: 'sell',
          payment_method: 'bank_transfer',
          escrow_address: escrowAddr,
          escrow_status: 'created'
        })
        .select()
        .single();

      if (tradeError) throw tradeError;
      setTrade(tradeData);

      // Update trade request status
      await supabase
        .from('trade_requests')
        .update({ status: 'matched' })
        .eq('id', tradeRequestId);

    } catch (error) {
      console.error('Error creating escrow trade:', error);
      toast({
        title: "Error",
        description: "Failed to create escrow. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateEscrowAddress = (crypto: string): string => {
    // Generate a realistic-looking escrow address based on crypto type
    const prefixes = {
      BTC: '3',
      ETH: '0x',
      USDT: '0x', // USDT on Ethereum
    };
    
    const prefix = prefixes[crypto as keyof typeof prefixes] || '0x';
    const randomHex = Array.from({length: crypto === 'BTC' ? 32 : 38}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    return prefix + randomHex;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Escrow address copied to clipboard",
    });
  };

  const handleCryptoDeposited = async () => {
    try {
      setConfirming(true);

      // Update trade status to indicate crypto has been deposited
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'crypto_deposited',
          crypto_deposited_at: new Date().toISOString(),
          escrow_status: 'funded'
        })
        .eq('id', trade.id);

      if (error) throw error;

      setCryptoDeposited(true);

      // Notify the merchant that crypto has been deposited
      await supabase
        .from('notifications')
        .insert({
          user_id: merchantId,
          type: 'trade_update',
          title: 'Crypto Deposited in Escrow',
          message: `${amount} ${cryptoType} has been deposited. Please send cash payment.`,
          data: {
            trade_id: trade.id,
            amount_crypto: amount,
            crypto_type: cryptoType,
            amount_fiat: nairaAmount
          }
        });

      toast({
        title: "Deposit Confirmed!",
        description: "The merchant has been notified to send your cash payment.",
      });

      // Navigate to waiting for payment page
      navigate('/sell-crypto-waiting', {
        state: {
          ...sellData,
          tradeId: trade.id
        }
      });

    } catch (error) {
      console.error('Error confirming deposit:', error);
      toast({
        title: "Error",
        description: "Failed to confirm deposit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up escrow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Escrow Deposit</h1>
              <p className="text-sm text-gray-500">Step 1: Deposit your crypto to escrow</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Shield size={14} className="mr-1" />
            Secure
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Trade Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Shield className="mr-2 text-blue-600" size={20} />
              Trade Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Merchant:</span>
              <span className="font-semibold">{merchantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">You're selling:</span>
              <span className="font-semibold">{amount} {cryptoType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">You'll receive:</span>
              <span className="font-semibold text-green-600">{nairaAmount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Escrow Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">How Escrow Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-blue-800">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
              <p className="text-sm">You deposit {amount} {cryptoType} to the secure escrow address below</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
              <p className="text-sm">The merchant sends {nairaAmount} to your bank account</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
              <p className="text-sm">Once you confirm receipt, the crypto is released to the merchant</p>
            </div>
          </CardContent>
        </Card>

        {/* Escrow Address */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center">
              <Shield className="mr-2" size={20} />
              Escrow Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Send exactly {amount} {cryptoType} to:</p>
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono bg-white p-2 rounded border flex-1 mr-2 break-all">
                  {escrowAddress}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(escrowAddress)}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="text-yellow-600 mr-2 mt-0.5" size={16} />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Important!</p>
                  <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                    <li>• Send exactly {amount} {cryptoType} - no more, no less</li>
                    <li>• Double-check the address before sending</li>
                    <li>• The transaction is irreversible once sent</li>
                    <li>• Only send {cryptoType} to this address</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <Clock className="text-orange-600 mr-2" size={20} />
              <div className="text-center">
                <p className="text-sm text-gray-600">Time to complete deposit</p>
                <p className="text-lg font-semibold text-orange-600">29:45</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleCryptoDeposited}
            disabled={confirming || cryptoDeposited}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
          >
            {confirming ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Confirming...
              </div>
            ) : cryptoDeposited ? (
              <div className="flex items-center">
                <CheckCircle2 className="mr-2" size={16} />
                Deposit Confirmed
              </div>
            ) : (
              "I have deposited the crypto"
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              window.open(`https://etherscan.io/address/${escrowAddress}`, '_blank');
            }}
            className="w-full"
          >
            <ExternalLink className="mr-2" size={16} />
            View on Blockchain Explorer
          </Button>
        </div>

        {/* Support */}
        <Card className="bg-gray-50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">
              Having issues? Contact our support team for assistance.
            </p>
            <Button variant="link" className="mt-2">
              Get Help
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default SellCryptoEscrow;