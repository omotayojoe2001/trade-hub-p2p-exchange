import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, CheckCircle, Copy, Upload, MessageSquare, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumBuyCryptoPaymentStep2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { tradeRequestId, coinType, cryptoAmount, nairaAmount, selectedMerchant, walletAddress } = location.state || {};
  const tradeId = tradeRequestId;
  const cashAmount = nairaAmount;
  
  const [tradeStatus, setTradeStatus] = useState('searching');
  const [merchantBankDetails, setMerchantBankDetails] = useState<any>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes for premium

  useEffect(() => {
    if (tradeId) {
      monitorTradeStatus();
      fetchMessages();
      
      const interval = setInterval(() => {
        if (tradeStatus === 'searching' || tradeStatus === 'accepted') {
          monitorTradeStatus();
        }
      }, 8000); // Faster polling for premium
      
      return () => clearInterval(interval);
    }
  }, [tradeId, tradeStatus]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const monitorTradeStatus = async () => {
    if (!tradeId) return;
    
    try {
      const { data: tradeRequest } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (tradeRequest?.status === 'accepted' && tradeStatus === 'searching') {
        setTradeStatus('accepted');
        toast({
          title: "Premium Merchant Matched!",
          description: "Premium merchant accepted your trade request",
        });
      }
      
      const { data: tradeData } = await supabase
        .from('trades')
        .select('*')
        .eq('trade_request_id', tradeId)
        .maybeSingle();

      if (tradeData?.escrow_status === 'crypto_deposited' && tradeStatus !== 'escrow_funded') {
        setTradeStatus('escrow_funded');
        fetchMerchantBankDetails(tradeData.seller_id, tradeData);
        
        toast({
          title: "Premium Payment Details Available!",
          description: "Premium merchant has funded escrow. Make your payment now.",
        });
      }
    } catch (error) {
      console.error('Error monitoring premium trade:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(*)')
        .eq('trade_id', tradeId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchMerchantBankDetails = async (sellerId: string, trade: any) => {
    try {
      const { data: paymentMethods, error } = await supabase
        .rpc('get_merchant_payment_method', { merchant_id: sellerId });
        
      const paymentMethod = paymentMethods?.[0];

      if (error || !paymentMethod) {
        setMerchantBankDetails({
          bank_name: 'Premium Bank',
          account_number: '0123456789',
          account_name: selectedMerchant?.display_name || 'Premium Merchant',
          reference: `PREMIUM-${trade.id.slice(-8)}`,
          amount_naira: cashAmount
        });
        return;
      }

      setMerchantBankDetails({
        bank_name: paymentMethod.bank_name || 'Premium Bank Account',
        account_number: paymentMethod.account_number || 'Not Available',
        account_name: paymentMethod.account_name || selectedMerchant?.display_name || 'Premium Merchant',
        reference: `PREMIUM-${trade.id.slice(-8)}`,
        amount_naira: cashAmount
      });
    } catch (error) {
      console.error('Error fetching premium merchant bank details:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPaymentProof(event.target.files[0]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          trade_id: tradeId,
          sender_id: user.id,
          receiver_id: selectedMerchant.user_id,
          content: newMessage,
          message_type: 'text'
        });

      if (error) throw error;
      
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!paymentProof) {
      toast({
        title: "Upload Required",
        description: "Please upload proof of payment first",
        variant: "destructive"
      });
      return;
    }

    try {
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${user.id}/premium-payment-proof-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, paymentProof);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .select('*')
        .eq('trade_request_id', tradeId)
        .single();

      if (tradeError || !trade) {
        throw new Error('Premium trade not found');
      }

      const { error: updateError } = await supabase
        .from('trades')
        .update({
          status: 'payment_sent',
          payment_proof_url: urlData.publicUrl
        })
        .eq('id', trade.id);

      if (updateError) throw updateError;

      await supabase
        .from('notifications')
        .insert({
          user_id: selectedMerchant.user_id,
          type: 'premium_payment_proof_uploaded',
          title: 'Premium Payment Proof Uploaded',
          message: `${user.user_metadata?.display_name || user.email || 'Premium user'} has uploaded payment proof for premium trade ${trade.id.slice(-8)}`,
          data: {
            trade_id: trade.id,
            payment_proof_url: urlData.publicUrl,
            is_premium: true
          }
        });

      toast({
        title: "Premium Payment Confirmed!",
        description: "Your premium payment proof has been uploaded. Premium merchants confirm within 5 minutes.",
      });

      navigate('/premium-buy-crypto-payment-step3', {
        state: {
          tradeId: trade.id,
          coinType,
          cryptoAmount,
          cashAmount,
          selectedMerchant,
          walletAddress
        }
      });

    } catch (error) {
      console.error('Error uploading premium payment proof:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload premium payment proof. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusDisplay = () => {
    switch (tradeStatus) {
      case 'searching':
        return {
          title: "Finding Premium Merchant",
          description: "Waiting for premium merchant to accept your trade request...",
          icon: <div className="w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" />
        };
      case 'accepted':
        return {
          title: "Premium Merchant Matched!",
          description: "Waiting for premium merchant to fund escrow...",
          icon: <CheckCircle className="w-8 h-8 text-green-500" />
        };
      case 'escrow_funded':
        return {
          title: "Premium Escrow Funded",
          description: "Premium merchant has deposited crypto. You can now make payment.",
          icon: <CheckCircle className="w-8 h-8 text-yellow-600" />
        };
      default:
        return {
          title: "Processing Premium Trade",
          description: "Please wait...",
          icon: <div className="w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" />
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('/premium-buy-crypto-payment-step1', { state: location.state })}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <Crown size={16} className="text-muted-foreground" />
          <h1 className="text-lg font-semibold">Premium Buy {coinType} - Step 2</h1>
        </div>
        <div className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center">
          <Crown size={10} className="mr-1" />
          Premium
        </div>
      </div>

      {/* Timer */}
      <div className="p-4 bg-muted border-b">
        <div className="flex items-center justify-center">
          <Clock className="w-5 h-5 text-muted-foreground mr-2" />
          <Crown size={14} className="text-muted-foreground mr-2" />
          <span className="font-semibold">
            Premium Time Remaining: {formatTime(countdown)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status Display */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4">{statusInfo.icon}</div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Crown size={18} className="text-yellow-600" />
              <h2 className="text-xl font-semibold text-yellow-900">{statusInfo.title}</h2>
            </div>
            <p className="text-yellow-700">{statusInfo.description}</p>
            
            {tradeStatus === 'searching' && tradeId && (
              <Button 
                onClick={async () => {
                  try {
                    const { error } = await supabase.rpc('simulate_merchant_accept_trade', {
                      request_id: tradeId
                    });
                    if (error) console.error('Error:', error);
                  } catch (err) {
                    console.error('Demo error:', err);
                  }
                }}
                className="mt-4 bg-gradient-to-r from-yellow-600 to-yellow-700"
                size="sm"
              >
                <Crown size={14} className="mr-1" />
                [Demo] Simulate Premium Accept
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Bank Details */}
        {tradeStatus === 'escrow_funded' && merchantBankDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Crown size={16} className="mr-2 text-yellow-600" />
                Make Premium Payment To
              </CardTitle>
              <p className="text-xs text-yellow-700">
                The premium merchant has deposited {cryptoAmount} {coinType} into secure escrow
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Bank Name</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{merchantBankDetails.bank_name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(merchantBankDetails.bank_name, 'Bank name')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{merchantBankDetails.account_number}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(merchantBankDetails.account_number, 'Account number')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Account Name</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{merchantBankDetails.account_name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(merchantBankDetails.account_name, 'Account name')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-semibold text-lg text-primary">₦{cashAmount?.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Reference</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{merchantBankDetails.reference}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(merchantBankDetails.reference, 'Reference')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Proof */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center">
                  <Crown size={14} className="mr-1 text-yellow-600" />
                  Upload Premium Payment Proof
                </label>
                <div className="border-2 border-dashed border-muted rounded-lg p-4 bg-muted/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="payment-proof"
                  />
                  <label htmlFor="payment-proof" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {paymentProof ? paymentProof.name : 'Tap to upload premium payment screenshot'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleMarkAsPaid}
                  disabled={!paymentProof}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Crown size={16} className="mr-2" />
                  I Have Made Premium Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Section */}
        {tradeStatus === 'escrow_funded' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-yellow-600" />
                <Crown size={14} className="text-yellow-600" />
                Premium Chat with {selectedMerchant?.display_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-32 border border-yellow-200 rounded p-3 overflow-y-auto bg-yellow-50/50">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.id} className="mb-2">
                      <p className="text-xs text-yellow-600">
                        {message.sender_id === user.id ? 'You' : selectedMerchant?.display_name}
                      </p>
                      <p className="text-sm text-yellow-900">{message.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-yellow-600 text-center">No premium messages yet</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a premium message..."
                  rows={2}
                  className="border-yellow-200 focus:border-yellow-400"
                />
                <Button onClick={handleSendMessage} size="sm" className="bg-gradient-to-r from-yellow-600 to-yellow-700">
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumBuyCryptoPaymentStep2;