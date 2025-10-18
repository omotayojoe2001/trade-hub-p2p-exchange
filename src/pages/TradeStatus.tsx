import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { tradeRequestService } from '@/services/tradeRequestService';
import { escrowService } from '@/services/escrowService';

interface TradeStatusState {
  tradeRequest: any;
  selectedMerchant: any;
  mode: 'buy' | 'sell';
  step: 'waiting_for_merchant' | 'merchant_accepted' | 'escrow_pending' | 'escrow_received' | 'cash_pending' | 'completed';
}

const TradeStatus = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const state = location.state as TradeStatusState;
  const [currentStep, setCurrentStep] = useState(state?.step || 'waiting_for_merchant');
  const [tradeData, setTradeData] = useState(state?.tradeRequest);
  const [merchantData, setMerchantData] = useState(state?.selectedMerchant);
  const [escrowInstructions, setEscrowInstructions] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state || !tradeData) {
      navigate('/');
      return;
    }

    // Set up real-time subscription for trade updates
    const channel = supabase
      .channel(`trade-${tradeData.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trade_requests',
        filter: `id=eq.${tradeData.id}`
      }, (payload) => {
        console.log('Trade request update:', payload);
        if (payload.new && 'status' in payload.new) {
          setTradeData(payload.new);
          updateStepFromStatus((payload.new as any).status || 'open');
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trades',
        filter: `trade_request_id=eq.${tradeData.id}`
      }, (payload) => {
        console.log('Trade update:', payload);
        if (payload.new && 'status' in payload.new) {
          updateStepFromTradeStatus((payload.new as any).status || 'pending', (payload.new as any).escrow_status || 'pending');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tradeData?.id]);

  const updateStepFromStatus = (status: string) => {
    switch (status) {
      case 'open':
        setCurrentStep('waiting_for_merchant');
        break;
      case 'accepted':
        setCurrentStep('merchant_accepted');
        break;
      case 'cancelled':
        // Handle rejection - could redirect to next merchant
        toast({
          title: "Trade request declined",
          description: "Looking for another merchant...",
          variant: "destructive"
        });
        break;
    }
  };

  const updateStepFromTradeStatus = (tradeStatus: string, escrowStatus: string) => {
    if (tradeStatus === 'pending' && escrowStatus === 'pending') {
      setCurrentStep('escrow_pending');
    } else if (escrowStatus === 'crypto_received') {
      setCurrentStep('escrow_received');
    } else if (escrowStatus === 'cash_received') {
      setCurrentStep('cash_pending');
    } else if (tradeStatus === 'completed') {
      setCurrentStep('completed');
    }
  };

  const getEscrowInstructions = async () => {
    if (!tradeData) return;
    
    try {
      setLoading(true);
      const instructions = await escrowService.getEscrowInstructions(tradeData.id);
      setEscrowInstructions(instructions);
    } catch (error) {
      console.error('Error getting escrow instructions:', error);
      toast({
        title: "Error",
        description: "Failed to get payment instructions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const getStepStatus = (step: string) => {
    const steps = ['waiting_for_merchant', 'merchant_accepted', 'escrow_pending', 'escrow_received', 'cash_pending', 'completed'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-300" />;
    }
  };

  if (!tradeData || !merchantData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid trade data</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-3"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Trade Status</h1>
              <p className="text-sm text-gray-600">
                Trading with {merchantData.display_name}
              </p>
            </div>
          </div>
          <Badge variant={currentStep === 'completed' ? 'default' : 'secondary'}>
            {currentStep.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Trade Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trade Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold">{tradeData.amount} {tradeData.coin_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-semibold">₦{tradeData.naira_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rate</p>
                <p className="font-semibold">₦{tradeData.rate.toLocaleString()}/{tradeData.coin_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-semibold">{tradeData.payment_method.replace('_', ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trade Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { key: 'waiting_for_merchant', label: 'Waiting for merchant response' },
                { key: 'merchant_accepted', label: 'Merchant accepted trade' },
                { key: 'escrow_pending', label: 'Send crypto to escrow' },
                { key: 'escrow_received', label: 'Crypto received in escrow' },
                { key: 'cash_pending', label: 'Cash payment processing' },
                { key: 'completed', label: 'Trade completed' }
              ].map((step) => (
                <div key={step.key} className="flex items-center space-x-3">
                  {getStepIcon(getStepStatus(step.key))}
                  <span className={`text-sm ${
                    getStepStatus(step.key) === 'completed' ? 'text-green-600' :
                    getStepStatus(step.key) === 'current' ? 'text-blue-600 font-medium' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Instructions */}
        {currentStep === 'waiting_for_merchant' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Waiting for {merchantData.display_name}</h3>
                <p className="text-gray-600 mb-4">
                  Your trade request has been sent. The merchant will respond shortly.
                </p>
                <p className="text-sm text-gray-500">
                  Average response time: {merchantData.avg_response_time_minutes || 10} minutes
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'merchant_accepted' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trade Accepted!</h3>
                <p className="text-gray-600 mb-4">
                  {merchantData.display_name} has accepted your trade request.
                </p>
                <Button onClick={getEscrowInstructions} disabled={loading}>
                  {loading ? 'Loading...' : 'Get Payment Instructions'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'escrow_pending' && escrowInstructions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send Crypto to Escrow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  Send your crypto to our secure escrow wallet:
                </p>
                <div className="flex items-center justify-between bg-white p-3 rounded border">
                  <code className="text-sm font-mono">
                    {escrowInstructions.crypto_instructions.send_to_address}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(escrowInstructions.crypto_instructions.send_to_address)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Amount: {escrowInstructions.crypto_instructions.amount} {escrowInstructions.crypto_instructions.crypto_type}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'escrow_received' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Crypto Received in Escrow</h3>
                <p className="text-gray-600 mb-4">
                  Your crypto is now safely held in escrow. The merchant has been notified to send cash payment.
                </p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Your crypto is secure and will be released to the merchant once cash payment is confirmed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TradeStatus;
