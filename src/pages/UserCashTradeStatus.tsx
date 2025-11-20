import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, MapPin, Phone, User, AlertTriangle, Copy, DollarSign, Truck, PartyPopper, Lock, MessageCircle, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ReceiptGenerator } from '@/components/ReceiptGenerator';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/my-trades')} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-white">Cash Delivery</h1>
            <p className="text-blue-100 text-sm">${trade.usd_amount.toLocaleString()} USD</p>
          </div>
          <div className="w-10" />
        </div>
        
        {/* Status Badge */}
        <div className="flex justify-center mt-4">
          <Badge className={`px-4 py-2 text-sm font-medium text-white ${
            statusInfo.color === 'green' ? 'bg-green-500' :
            statusInfo.color === 'blue' ? 'bg-blue-500' :
            statusInfo.color === 'purple' ? 'bg-purple-500' :
            statusInfo.color === 'orange' ? 'bg-orange-500' :
            'bg-gray-500'
          }`}>
            <statusInfo.icon className="w-4 h-4 mr-2 text-white" />
            <span className="text-white">{statusInfo.title}</span>
          </Badge>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Progress Timeline - Compact */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4].map((step) => {
                const isCompleted = statusInfo.step >= step;
                const isCurrent = statusInfo.step === step;
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : step}
                    </div>
                    {step < 4 && (
                      <div className={`w-12 h-0.5 mt-4 ${
                        statusInfo.step > step ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-sm text-gray-600 mt-3">{statusInfo.description}</p>
          </CardContent>
        </Card>

        {/* Delivery Info - Enhanced */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 text-lg">
                    {trade.delivery_type === 'delivery' ? 'Home Delivery' : 'Cash Pickup'}
                  </span>
                  <p className="text-sm text-gray-600">Service Type</p>
                </div>
              </div>
              <div className="text-right bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <span className="text-2xl font-bold text-green-700">${trade.usd_amount.toLocaleString()}</span>
                <p className="text-xs text-green-600 font-medium">USD Cash</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-sm text-gray-600 font-medium mb-1">
                {trade.delivery_type === 'delivery' ? 'Delivery Address:' : 'Pickup Location:'}
              </p>
              <p className="text-gray-900 font-semibold">
                {trade.delivery_type === 'delivery' ? trade.delivery_address : trade.pickup_location}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Code - Enhanced */}
        {trade.delivery_code && (
          <Card className="bg-gradient-to-r from-amber-400 to-orange-500 border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">Your Delivery Code</span>
              </div>
              <div className="bg-white rounded-xl p-4 mb-4 shadow-lg">
                <p className="text-3xl font-mono font-bold text-gray-900 tracking-widest">
                  {trade.delivery_code}
                </p>
              </div>
              <p className="text-white/90 text-sm mb-4">Show this code to receive your cash</p>
              <Button onClick={copyDeliveryCode} size="sm" className="bg-white/20 text-white hover:bg-white/30 border-white/30 shadow-md">
                <Copy className="w-4 h-4 mr-2 text-white" />
                <span className="text-white">Copy Code</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Vendor Contact - Enhanced */}
        {trade.status === 'delivery_in_progress' && trade.vendor_phone && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Delivery Vendor</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-md">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{trade.vendor_name || 'Delivery Vendor'}</p>
                    <p className="text-sm text-gray-600 font-medium">{trade.vendor_phone}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => setShowMessage(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => window.open(`tel:${trade.vendor_phone}`)} size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Receipt Actions - For Completed Trades */}
        {trade.status === 'cash_delivered' && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Trade Completed!</h3>
                <p className="text-sm text-gray-600 mb-4">Cash delivered successfully</p>
                <div className="flex space-x-3">
                  <ReceiptGenerator
                    trade={{
                      id: trade.id,
                      amount: trade.usd_amount,
                      currency: 'USD',
                      type: 'cash_delivery',
                      status: 'completed',
                      date: trade.created_at,
                      merchant: { name: trade.merchant_name || 'Merchant', phone: trade.merchant_phone },
                      vendor: { name: trade.vendor_name || 'Vendor', phone: trade.vendor_phone }
                    }}
                    trigger={
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Download className="w-4 h-4 mr-2" />
                        Receipt
                      </Button>
                    }
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Trade Completed',
                        text: `Successfully received $${trade.usd_amount} USD cash delivery`,
                        url: window.location.href
                      });
                    }
                  }}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Safety Tips - Compact */}
        <Card className="bg-blue-50/80 backdrop-blur-sm border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Safety Reminder</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Count cash before giving code</li>
                  <li>• Verify exact amount: ${trade.usd_amount.toLocaleString()}</li>
                  <li>• Contact support if issues arise</li>
                </ul>
              </div>
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