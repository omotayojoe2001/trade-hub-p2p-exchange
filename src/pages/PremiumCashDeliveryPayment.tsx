import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Shield, Clock, MapPin, Phone, Calendar, DollarSign, Copy, CheckCircle, Upload, QrCode } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { premiumCashService } from '@/services/premiumCashService';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumCashDeliveryPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [cryptoType, setCryptoType] = useState('BTC');
  const [escrowAddress, setEscrowAddress] = useState('');
  const [vaultId, setVaultId] = useState('');
  const [isGeneratingEscrow, setIsGeneratingEscrow] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [depositProof, setDepositProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Get data from previous page
  const orderData = location.state || {};
  const { selectedAreas, deliveryAddress, selectedContact, selectedDate, selectedTime } = orderData;

  useEffect(() => {
    if (!selectedAreas || !deliveryAddress) {
      navigate('/premium-cash-delivery');
      return;
    }
    generateEscrowAddress();
  }, []);

  const generateEscrowAddress = async () => {
    setIsGeneratingEscrow(true);
    try {
      const { bitgoEscrow } = await import('@/services/bitgoEscrow');
      const tradeId = `premium_cash_${Date.now()}`;
      const address = await bitgoEscrow.generateEscrowAddress(tradeId, cryptoType as 'BTC' | 'ETH' | 'USDT');
      
      setEscrowAddress(address);
      setVaultId(tradeId);
      
      toast({
        title: "Escrow Ready",
        description: "Secure BitGo escrow address generated",
      });
    } catch (error) {
      console.error('Error creating escrow:', error);
      toast({
        title: "Error",
        description: "Failed to generate escrow address",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEscrow(false);
    }
  };

  const calculateUSDAmount = () => {
    if (!cryptoAmount) return 0;
    const btcToUSD = 42000; // 1 BTC = $42k USD (example rate)
    const ethToUSD = 2500; // 1 ETH = $2.5k USD
    const usdtToUSD = 1; // 1 USDT = $1 USD
    
    const rates = { BTC: btcToUSD, ETH: ethToUSD, USDT: usdtToUSD };
    return parseFloat(cryptoAmount) * (rates[cryptoType] || btcToUSD);
  };

  const calculatePoints = () => {
    const usdAmount = calculateUSDAmount();
    return Math.ceil(usdAmount / 100 * 10); // 10 points per $100
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const handleCreateOrder = async () => {
    if (!cryptoAmount || !escrowAddress) {
      toast({
        title: "Error",
        description: "Please enter crypto amount and wait for escrow address",
        variant: "destructive",
      });
      return;
    }

    try {
      const order = await premiumCashService.createOrder({
        user_id: user?.id || '',
        crypto_type: cryptoType,
        crypto_amount: parseFloat(cryptoAmount),
        naira_amount: calculateUSDAmount(), // Store as USD amount
        delivery_type: 'delivery',
        delivery_address: deliveryAddress,
        phone_number: selectedContact?.phone_number || '',
        whatsapp_number: selectedContact?.whatsapp_number || '',
        preferred_date: selectedDate,
        preferred_time: selectedTime,
        selected_areas: selectedAreas,
        escrow_address: escrowAddress,
        vault_id: vaultId
      });

      setCurrentOrder(order);
      setOrderCreated(true);

      toast({
        title: "Order Created!",
        description: "Your premium cash delivery order has been created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDepositProof(event.target.files[0]);
    }
  };

  const handleConfirmDeposit = async () => {
    if (!depositProof) {
      toast({
        title: "Upload Required",
        description: "Please upload proof of crypto deposit",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload proof to storage
      const fileExt = depositProof.name.split('.').pop();
      const fileName = `${Date.now()}_premium_deposit_proof.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, depositProof);

      if (uploadError) throw uploadError;

      // Update order with payment proof
      const { error: updateError } = await supabase
        .from('premium_cash_orders')
        .update({ 
          payment_proof_url: fileName,
          status: 'awaiting_merchant'
        })
        .eq('id', currentOrder?.id);

      if (updateError) throw updateError;

      // Create trade request entry for merchants to see
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      const { data: tradeRequest, error: tradeError } = await supabase
        .from('trade_requests')
        .insert({
          user_id: user.id,
          trade_type: 'sell',
          crypto_type: cryptoType,
          amount_crypto: parseFloat(cryptoAmount),
          amount_fiat: calculateUSDAmount(),
          rate: calculateUSDAmount() / parseFloat(cryptoAmount),
          payment_method: 'premium_cash_delivery',
          status: 'open',
          escrow_address: escrowAddress,
          vault_id: vaultId,
          payment_proof_url: fileName,
          expires_at: expiresAt.toISOString(),
          premium_cash_order_id: currentOrder?.id,
          delivery_areas: selectedAreas,
          delivery_address: deliveryAddress
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Broadcast to all merchants
      const { data: merchants } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('is_merchant', true)
        .neq('user_id', user.id);

      if (merchants && merchants.length > 0) {
        const notifications = merchants.map(merchant => ({
          user_id: merchant.user_id,
          type: 'trade_request',
          title: 'Premium Cash Delivery Request',
          message: `Premium user wants ${cryptoAmount} ${cryptoType} delivered as USD cash for $${calculateUSDAmount().toLocaleString()}. Crypto secured in escrow.`,
          data: {
            trade_request_id: tradeRequest?.id,
            order_id: currentOrder?.id,
            crypto_amount: parseFloat(cryptoAmount),
            usd_amount: calculateUSDAmount(),
            crypto_type: cryptoType,
            delivery_areas: selectedAreas,
            priority: 'high',
            order_type: 'premium_cash_delivery'
          },
          read: false
        }));

        const { error: notifError } = await supabase.from('notifications').insert(notifications);
        if (notifError) {
          console.error('Error sending notifications:', notifError);
        }
      }

      toast({
        title: "Payment Confirmed!",
        description: "Crypto secured in escrow. Merchants have been notified."
      });

      navigate('/premium-cash-delivery-waiting', {
        state: { orderId: currentOrder?.id }
      });
    } catch (error) {
      console.error('Error confirming deposit:', error);
      toast({
        title: "Error",
        description: "Failed to confirm deposit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedAreas || !deliveryAddress) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-cash-delivery" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Shield size={24} className="mr-2 text-gray-600" />
                Premium Cash Delivery
              </h1>
              <p className="text-gray-600 text-sm">Secure escrow payment</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Order Summary */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Areas:</span>
              <span className="font-medium">{selectedAreas.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-medium text-right max-w-48 truncate">{deliveryAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium">{selectedDate} - {selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Contact:</span>
              <span className="font-medium">{selectedContact?.phone_number}</span>
            </div>
          </div>
        </Card>

        {/* Crypto Amount Input */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Crypto Amount to Sell</h3>
          <div className="space-y-4">
            <div className="flex space-x-3">
              <select 
                value={cryptoType}
                onChange={(e) => setCryptoType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="USDT">USDT</option>
              </select>
              <Input
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
                className="flex-1"
              />
            </div>
            {cryptoAmount && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">You'll receive (USD cash):</span>
                  <span className="font-bold text-green-900">${calculateUSDAmount().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-green-600">Points to deduct:</span>
                  <span className="font-medium text-green-800">{calculatePoints()} points</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Escrow Address */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Shield size={20} className="mr-2 text-gray-600" />
            Escrow Payment Address
          </h3>
          
          {isGeneratingEscrow ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Generating secure BitGo escrow...</span>
            </div>
          ) : escrowAddress ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Send exactly {cryptoAmount} {cryptoType} to:</p>
                    <div className="p-3 bg-white rounded border">
                      <p className="font-mono text-sm break-all">{escrowAddress}</p>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(escrowAddress)}
                      size="sm"
                      variant="outline"
                      className="mt-2"
                    >
                      <Copy size={14} className="mr-1" />
                      Copy Address
                    </Button>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">QR Code</p>
                    <div className="flex justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${escrowAddress}`}
                        alt="QR Code"
                        className="w-32 h-32 border rounded"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      <strong>Important:</strong> Send exactly {cryptoAmount} {cryptoType}. 
                      Any other amount will cause delays.
                    </p>
                  </div>
                </div>
              </div>

              {orderCreated && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Upload Deposit Proof</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="deposit-proof"
                      />
                      <label htmlFor="deposit-proof" className="cursor-pointer">
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {depositProof ? depositProof.name : 'Upload transaction screenshot'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield size={16} className="text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Secure BitGo Escrow Protection</p>
                    <p>Your crypto is held safely until cash delivery is confirmed</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Action Buttons */}
        {!orderCreated ? (
          <Button
            onClick={handleCreateOrder}
            disabled={!cryptoAmount || !escrowAddress || isGeneratingEscrow}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create Order & Generate Escrow Address
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={20} className="text-green-600 mr-2" />
              <span className="text-green-800 font-medium">Order created! Send crypto to escrow address above</span>
            </div>
            
            <Button
              onClick={handleConfirmDeposit}
              disabled={!depositProof || loading}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Processing...' : 'Confirm Crypto Deposit & Notify Merchants'}
            </Button>
          </div>
        )}

        {/* How it Works */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">How Premium Cash Delivery Works</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">1</div>
              <div>
                <p className="font-medium">Send crypto to BitGo escrow</p>
                <p className="text-gray-600">Your crypto is held securely until delivery</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">2</div>
              <div>
                <p className="font-medium">Merchant accepts trade</p>
                <p className="text-gray-600">A merchant will accept and send Naira to our vendor</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">3</div>
              <div>
                <p className="font-medium">Vendor delivers cash</p>
                <p className="text-gray-600">Our vendor brings cash to your address</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">4</div>
              <div>
                <p className="font-medium">Crypto released</p>
                <p className="text-gray-600">Merchant receives crypto from escrow</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumCashDeliveryPayment;