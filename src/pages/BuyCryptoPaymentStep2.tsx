import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, CheckCircle, Copy, Upload, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const BuyCryptoPaymentStep2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { tradeId, coinType, cryptoAmount, cashAmount, selectedMerchant, walletAddress } = location.state || {};
  
  const [tradeStatus, setTradeStatus] = useState('searching');
  const [merchantBankDetails, setMerchantBankDetails] = useState<any>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes

  useEffect(() => {
    if (tradeId) {
      monitorTradeStatus();
      fetchMessages();
    }
  }, [tradeId]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const monitorTradeStatus = async () => {
    try {
      // Check trade status
      const { data: trade, error } = await supabase
        .from('trades')
        .select('*, seller:profiles!seller_id(*)')
        .eq('id', tradeId)
        .single();

      if (error) throw error;

      if (trade.status === 'pending_merchant_accept') {
        setTradeStatus('searching');
        // Continue polling
        setTimeout(monitorTradeStatus, 3000);
      } else if (trade.status === 'merchant_accepted') {
        setTradeStatus('accepted');
        // Wait for escrow funding
        setTimeout(() => {
          setTradeStatus('escrow_funded');
          setMerchantBankDetails({
            bank_name: 'First Bank',
            account_number: '1234567890',
            account_name: selectedMerchant.display_name,
            reference: `PAY-${tradeId.slice(-8)}`
          });
        }, 3000);
      } else if (trade.status === 'cancelled') {
        toast({
          title: "Trade Cancelled",
          description: "The merchant declined your trade request",
          variant: "destructive"
        });
        navigate('/buy-crypto');
      }
    } catch (error) {
      console.error('Error monitoring trade:', error);
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
    try {
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'payment_sent',
          payment_proof_url: paymentProof ? 'uploaded' : null 
        })
        .eq('id', tradeId);

      if (error) throw error;

      navigate('/buy-crypto-payment-step3', {
        state: { tradeId, coinType, cryptoAmount, walletAddress }
      });
    } catch (error) {
      console.error('Error updating trade:', error);
    }
  };

  const getStatusDisplay = () => {
    switch (tradeStatus) {
      case 'searching':
        return {
          title: "Searching for Merchant",
          description: "Waiting for merchant to accept your trade request...",
          icon: <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        };
      case 'accepted':
        return {
          title: "Merchant Accepted!",
          description: "Merchant is funding escrow with your crypto...",
          icon: <CheckCircle className="w-8 h-8 text-green-500" />
        };
      case 'escrow_funded':
        return {
          title: "Escrow Funded",
          description: "Merchant has deposited crypto. You can now make payment.",
          icon: <CheckCircle className="w-8 h-8 text-blue-500" />
        };
      default:
        return {
          title: "Processing",
          description: "Please wait...",
          icon: <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Buy {coinType} - Step 2</h1>
        <div className="w-10" />
      </div>

      {/* Timer */}
      <div className="p-4 bg-orange-50 border-b border-orange-200">
        <div className="flex items-center justify-center">
          <Clock className="w-5 h-5 text-orange-600 mr-2" />
          <span className="text-orange-800 font-semibold">
            Time Remaining: {formatTime(countdown)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status Display */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4">{statusInfo.icon}</div>
            <h2 className="text-xl font-semibold mb-2">{statusInfo.title}</h2>
            <p className="text-muted-foreground">{statusInfo.description}</p>
          </CardContent>
        </Card>

        {/* Bank Details (shown when escrow is funded) */}
        {tradeStatus === 'escrow_funded' && merchantBankDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Make Payment To</CardTitle>
              <p className="text-xs text-muted-foreground">
                The merchant has deposited {cryptoAmount} {coinType} into escrow
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
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
                <label className="text-sm font-medium mb-2 block">Upload Payment Proof</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
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
                        {paymentProof ? paymentProof.name : 'Tap to upload payment screenshot'}
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
                  className="w-full"
                  size="lg"
                >
                  I Have Paid
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm">
                    Send Reminder
                  </Button>
                  <Button variant="outline" size="sm">
                    Cancel Trade
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Section */}
        {tradeStatus === 'escrow_funded' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat with {selectedMerchant?.display_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-32 border rounded p-3 overflow-y-auto bg-muted/50">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.id} className="mb-2">
                      <p className="text-xs text-muted-foreground">
                        {message.sender_id === user.id ? 'You' : selectedMerchant?.display_name}
                      </p>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">No messages yet</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows={2}
                />
                <Button onClick={handleSendMessage} size="sm">
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BuyCryptoPaymentStep2;