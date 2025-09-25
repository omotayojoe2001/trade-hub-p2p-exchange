import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, DollarSign, User, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ConfirmCashReceipt = () => {
  const [deliveryCode, setDeliveryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [tradeData, setTradeData] = useState<any>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { tradeId, notificationData } = location.state || {};

  useEffect(() => {
    if (notificationData) {
      setTradeData({
        trade_id: notificationData.trade_id,
        delivery_code: notificationData.delivery_code,
        amount_usd: notificationData.amount_usd
      });
    } else if (tradeId) {
      loadTradeData();
    }
  }, [tradeId, notificationData]);

  const loadTradeData = async () => {
    try {
      // Get trade details
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (tradeError) throw tradeError;

      // Get cash trade details
      const { data: cashTrade, error: cashError } = await supabase
        .from('cash_trades')
        .select('*')
        .eq('trade_request_id', trade.trade_request_id)
        .single();

      if (cashError) throw cashError;

      setTradeData({
        trade_id: tradeId,
        delivery_code: cashTrade.delivery_code,
        amount_usd: cashTrade.usd_amount,
        delivery_type: cashTrade.delivery_type,
        delivery_address: cashTrade.delivery_address,
        vendor_name: 'Cash Agent'
      });
    } catch (error) {
      console.error('Error loading trade data:', error);
      setError('Failed to load trade details');
    }
  };

  const handleConfirmReceipt = async () => {
    if (!deliveryCode.trim()) {
      setError('Please enter the delivery code');
      return;
    }

    if (!tradeData) {
      setError('Trade data not found');
      return;
    }

    // Verify delivery code matches
    if (deliveryCode.toUpperCase() !== tradeData.delivery_code.toUpperCase()) {
      setError('Invalid delivery code. Please check and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update trade status to completed
      await supabase
        .from('trades')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', tradeData.trade_id);

      // Update cash trade status
      await supabase
        .from('cash_trades')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('trade_request_id', tradeData.trade_id);

      // Mark delivery code as used
      await supabase
        .from('delivery_codes')
        .update({
          is_used: true,
          used_at: new Date().toISOString()
        })
        .eq('code', deliveryCode.toUpperCase());

      // Get trade details for crypto release
      const { data: trade } = await supabase
        .from('trades')
        .select('buyer_id, amount_crypto, coin_type')
        .eq('id', tradeData.trade_id)
        .single();

      if (trade) {
        // Notify buyer that crypto is being released
        await supabase
          .from('notifications')
          .insert({
            user_id: trade.buyer_id,
            type: 'crypto_released',
            title: 'Crypto Released!',
            message: `Cash delivery confirmed! Your ${trade.amount_crypto} ${trade.coin_type} is being released to your wallet.`,
            data: {
              trade_id: tradeData.trade_id,
              amount_crypto: trade.amount_crypto,
              coin_type: trade.coin_type
            }
          });
      }

      // Show success and redirect
      alert('✅ Cash receipt confirmed! Your crypto trade is now complete.');
      navigate('/my-trades');

    } catch (error) {
      console.error('Error confirming receipt:', error);
      setError('Failed to confirm receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tradeData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trade details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Confirm Cash Receipt</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Trade Summary */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Cash Delivery Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex justify-between">
                <span>Amount Received:</span>
                <span className="font-bold">${tradeData.amount_usd?.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Method:</span>
                <span>{tradeData.delivery_type === 'delivery' ? 'Home Delivery' : 'Pickup'}</span>
              </div>
              {tradeData.delivery_address && (
                <div className="flex items-start justify-between">
                  <span>Address:</span>
                  <span className="text-right max-w-48">{tradeData.delivery_address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Code Input */}
        <Card>
          <CardHeader>
            <CardTitle>Enter Delivery Code</CardTitle>
            <p className="text-sm text-gray-600">
              The vendor should have provided you with a 6-character delivery code. Enter it below to confirm you received the cash.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Code
              </label>
              <Input
                type="text"
                value={deliveryCode}
                onChange={(e) => {
                  setDeliveryCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Enter 6-character code"
                className="text-center text-lg font-mono tracking-wider"
                maxLength={6}
              />
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-800 mb-2">Important:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Only confirm if you received the exact amount: ${tradeData.amount_usd?.toLocaleString()} USD</li>
                <li>• The delivery code should be exactly 6 characters</li>
                <li>• Once confirmed, your crypto will be released to the buyer</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>

            <Button
              onClick={handleConfirmReceipt}
              disabled={loading || deliveryCode.length !== 6}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 disabled:bg-gray-400"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Confirming Receipt...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Cash Received
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Clock className="text-yellow-600 mr-2 mt-0.5" size={16} />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Security Notice:</p>
                <p>
                  Only confirm receipt if you have physically received the cash from the vendor. 
                  If there are any issues with the delivery, contact support before confirming.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfirmCashReceipt;