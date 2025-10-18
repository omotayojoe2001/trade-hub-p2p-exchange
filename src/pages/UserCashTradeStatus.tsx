import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, MapPin, Phone, User, AlertTriangle, Copy, DollarSign, Truck, PartyPopper, Lock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import MessageThread from '@/components/MessageThread';

interface CashTradeStatus {
  id: string;
  usd_amount: number;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string;
  pickup_location?: string;
  delivery_code: string;
  status: string;
  created_at: string;
  merchant_name?: string;
  merchant_phone?: string;
  vendor_name?: string;
  vendor_phone?: string;
  payment_confirmed_by_vendor?: boolean;
  crypto_released_to_merchant?: boolean;
}

const UserCashTradeStatus = () => {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trade, setTrade] = useState<CashTradeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeliveryCode, setShowDeliveryCode] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    loadTradeStatus();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`user-trade-${tradeId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'cash_trades',
        filter: `id=eq.${tradeId}`
      }, () => {
        loadTradeStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tradeId]);

  const loadTradeStatus = async () => {
    try {
      // Try to find by cash trade ID first, then by trade_request_id
      let { data, error } = await supabase
        .from('cash_trades')
        .select('*')
        .eq('id', tradeId)
        .eq('seller_id', user?.id)
        .single();
      
      // If not found by cash trade ID, try by trade_request_id
      if (error && error.code === 'PGRST116') {
        const { data: tradeData, error: tradeError } = await supabase
          .from('cash_trades')
          .select('*')
          .eq('trade_request_id', tradeId)
          .eq('seller_id', user?.id)
          .single();
        
        data = tradeData;
        error = tradeError;
      }

      if (error) throw error;
      setTrade(data);
    } catch (error) {
      console.error('Error loading trade status:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyDeliveryCode = () => {
    navigator.clipboard.writeText(trade?.delivery_code || '');
    alert('Delivery code copied!');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'vendor_paid':
        return {
          title: 'Merchant Paid Vendor',
          description: 'Merchant has sent payment to vendor. Waiting for vendor to confirm receipt.',
          color: 'orange',
          step: 1,
          icon: DollarSign
        };
      case 'payment_confirmed':
        return {
          title: 'Payment Confirmed',
          description: 'Vendor confirmed payment. Your crypto has been released to merchant. Vendor is preparing for delivery.',
          color: 'blue',
          step: 2,
          icon: CheckCircle
        };
      case 'delivery_in_progress':
        return {
          title: 'Delivery in Progress',
          description: 'Vendor is on the way to deliver your cash. Get ready with your delivery code!',
          color: 'purple',
          step: 3,
          icon: Truck
        };
      case 'cash_delivered':
        return {
          title: 'Cash Delivered',
          description: 'Cash has been successfully delivered. Trade completed!',
          color: 'green',
          step: 4,
          icon: PartyPopper
        };
      default:
        return {
          title: 'Waiting for Merchant',
          description: 'Waiting for a merchant to accept your trade and pay the vendor.',
          color: 'gray',
          step: 0,
          icon: Clock
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Trade Not Found</h2>
          <Button onClick={() => navigate('/my-trades')}>Back to My Trades</Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(trade.status);

  return (
      <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/my-trades')}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Cash Delivery Status</h1>
            <p className="text-sm text-gray-600">${trade.usd_amount.toLocaleString()} USD Cash</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Status */}
        <Card className={`border-l-4 border-l-${statusInfo.color}-500`}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <statusInfo.icon className={`w-5 h-5 mr-3 text-${statusInfo.color}-600`} />
              {statusInfo.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{statusInfo.description}</p>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Merchant Pays Vendor', status: 'vendor_paid' },
                { step: 2, title: 'Vendor Confirms Payment', status: 'payment_confirmed' },
                { step: 3, title: 'Delivery Started', status: 'delivery_in_progress' },
                { step: 4, title: 'Cash Delivered', status: 'cash_delivered' }
              ].map((item) => {
                const isCompleted = statusInfo.step >= item.step;
                const isCurrent = statusInfo.step === item.step;
                
                return (
                  <div key={item.step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : item.step}
                    </div>
                    <span className={`${isCompleted ? 'text-green-700 font-medium' : isCurrent ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 w-20">Type:</span>
              <span className="font-medium">
                {trade.delivery_type === 'delivery' ? 'Home Delivery' : 'Pickup'}
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-sm text-gray-600 w-20">Location:</span>
              <span className="font-medium">
                {trade.delivery_type === 'delivery' 
                  ? trade.delivery_address 
                  : trade.pickup_location
                }
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 w-20">Amount:</span>
              <span className="font-medium text-green-600">${trade.usd_amount.toLocaleString()} USD</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Code - Always show if exists */}
        {trade.delivery_code && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Your Delivery Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-yellow-700 mb-3">
                  Show this code to the vendor when they arrive with your cash. Only give the code AFTER receiving the full amount.
                </p>
                <div className="bg-white border-2 border-yellow-300 rounded-lg p-4 mb-3">
                  <p className="text-3xl font-mono font-bold text-yellow-900 tracking-wider">
                    {trade.delivery_code}
                  </p>
                </div>
                <Button
                  onClick={copyDeliveryCode}
                  variant="secondary"
                  size="sm"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vendor Contact - Only show when delivery started */}
        {trade.status === 'delivery_in_progress' && trade.vendor_phone && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Vendor Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{trade.vendor_name || 'Delivery Vendor'}</p>
                  <p className="text-sm text-gray-600">{trade.vendor_phone}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowMessage(true)}
                    size="sm"
                    variant="outline"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                  <Button
                    onClick={() => window.open(`tel:${trade.vendor_phone}`)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Call Vendor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Important Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Important Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-700">
              <p>• Only give your delivery code AFTER receiving the full cash amount</p>
              <p>• Count the money carefully before providing the code</p>
              <p>• The vendor must provide exactly ${trade.usd_amount.toLocaleString()} USD</p>
              <p>• If there are any issues, contact support immediately</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Message Thread */}
      {showMessage && trade && (
        <MessageThread
          otherUserId={trade.vendor_name || 'vendor'}
          otherUserName={trade.vendor_name || 'Vendor'}
          cashTradeId={trade.id}
          contextType="cash_delivery"
          isOpen={showMessage}
          onClose={() => setShowMessage(false)}
        />
      )}
      </div>
  );
};

export default UserCashTradeStatus;