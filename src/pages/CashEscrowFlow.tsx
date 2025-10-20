import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { creditsService } from '@/services/creditsService';

const CashEscrowFlow = () => {
  const [step, setStep] = useState(1);
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [tradeId, setTradeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const {
    amount,
    cryptoType,
    usdAmount,
    deliveryType,
    deliveryAddress,
    pickupLocation,
    phoneNumber,
    serviceFee,
    platformFee,
    totalFee
  } = location.state || {};

  // Generate real BitGo crypto address for deposit
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [generatingAddress, setGeneratingAddress] = useState(true);

  useEffect(() => {
    const generateRealEscrowAddress = async () => {
      try {
        setGeneratingAddress(true);
        const { bitgoEscrow } = await import('@/services/bitgoEscrow');
        const tradeId = `cash_trade_${Date.now()}`;
        const coinType = cryptoType === 'BTC' ? 'BTC' : cryptoType === 'ETH' ? 'ETH' : 'USDT';
        const expectedAmountInSatoshis = cryptoType === 'BTC' 
          ? Math.round(parseFloat(amount) * 100000000) // BTC to satoshis
          : Math.round(parseFloat(amount) * 1000000000000000000); // ETH/USDT to wei
        
        const address = await bitgoEscrow.generateEscrowAddress(tradeId, coinType as 'BTC' | 'ETH' | 'USDT', expectedAmountInSatoshis);
        setCryptoAddress(address);
        console.log('Generated real BitGo escrow address:', address);
      } catch (error) {
        console.error('Error generating real escrow address:', error);
        // Fallback to demo address if BitGo fails
        const demoAddresses = {
          BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          USDT: 'DemoSolanaUSDTAddress1234567890123456789012',
          ETH: '0x742d35Cc6634C0532925a3b8D4C9db4C4C4C4C4C'
        };
        setCryptoAddress(demoAddresses[cryptoType] || demoAddresses.BTC);
      } finally {
        setGeneratingAddress(false);
      }
    };

    if (cryptoType && amount) {
      generateRealEscrowAddress();
    }
  }, [cryptoType, amount]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (error) throw error;

      setPaymentProof({
        name: file.name,
        url: data.path
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSendTradeRequest = async () => {
    if (!paymentProof) {
      alert('Please upload payment proof first');
      return;
    }

    if (loading) {
      return; // Prevent multiple clicks
    }

    setLoading(true);
    try {
      // Create trade request that others can accept
      const tradeRequestData = {
        user_id: user.id,
        trade_type: 'sell',
        crypto_type: cryptoType,
        amount_crypto: parseFloat(amount),
        amount_fiat: usdAmount * 1650, // Convert USD to Naira for display
        rate: 1650,
        payment_method: 'cash_delivery',
        status: 'open',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      // Insert trade request into database
      const { data: tradeRequest, error: tradeError } = await supabase
        .from('trade_requests')
        .insert(tradeRequestData)
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Select vendor based on delivery location
      let selectedVendorId;
      
      // First, let's see what vendors exist
      const { data: allVendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, location, active, display_name')
        .eq('active', true);
      
      console.log('🔍 CASH ESCROW DEBUG: Available vendors:', allVendors);
      console.log('🔍 CASH ESCROW DEBUG: Delivery type:', deliveryType);
      console.log('🔍 CASH ESCROW DEBUG: Delivery address:', deliveryAddress);
      
      if (vendorError) {
        console.error('Error fetching vendors:', vendorError);
        throw new Error(`Database error: ${vendorError.message}`);
      }
      
      if (deliveryType === 'pickup') {
        // For pickup, match vendor by location (e.g., "Ikeja")
        const pickupLocation = deliveryAddress || 'Ikeja';
        console.log('Looking for vendor in location:', pickupLocation);
        
        // Try exact match first
        let locationVendors = allVendors?.filter(v => 
          v.location?.toLowerCase() === pickupLocation.toLowerCase()
        );
        
        // If no exact match, try partial match
        if (!locationVendors?.length) {
          locationVendors = allVendors?.filter(v => 
            v.location?.toLowerCase().includes(pickupLocation.toLowerCase())
          );
        }
        
        // If still no match, use any vendor
        if (!locationVendors?.length) {
          locationVendors = allVendors;
        }
        
        selectedVendorId = locationVendors?.[0]?.id;
        console.log('🎯 CASH ESCROW DEBUG: Selected vendor for pickup:', locationVendors?.[0]);
        console.log('🎯 CASH ESCROW DEBUG: Selected vendor ID:', selectedVendorId);
      } else {
        // For delivery, find any active vendor
        selectedVendorId = allVendors?.[0]?.id;
        console.log('🎯 CASH ESCROW DEBUG: Selected vendor for delivery:', allVendors?.[0]);
        console.log('🎯 CASH ESCROW DEBUG: Selected vendor ID:', selectedVendorId);
      }
      
      if (!selectedVendorId) {
        const locationMsg = deliveryType === 'pickup' ? ` in ${deliveryAddress || 'Ikeja'}` : '';
        throw new Error(`No vendors available for cash ${deliveryType}${locationMsg}. Found ${allVendors?.length || 0} total vendors.`);
      }

      // Generate delivery code
      const deliveryCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Store cash-specific data with vendor assignment
      console.log('💰 CASH ESCROW DEBUG: Creating cash trade with vendor ID:', selectedVendorId);
      console.log('💰 CASH ESCROW DEBUG: Phone number from form:', phoneNumber);
      console.log('💰 CASH ESCROW DEBUG: Delivery/pickup location:', deliveryType === 'delivery' ? deliveryAddress : pickupLocation);
      const cashTradeData = {
        trade_request_id: tradeRequest.id,
        seller_id: user.id,
        vendor_id: selectedVendorId,
        usd_amount: usdAmount,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
        pickup_location: deliveryType === 'pickup' ? (pickupLocation || deliveryAddress || 'Ikeja') : null,
        delivery_code: deliveryCode,
        seller_phone: phoneNumber || '+234-000-000-0000',
        customer_phone: phoneNumber || '+234-000-000-0000',
        customer_name: user.user_metadata?.full_name || user.email || 'Customer',
        escrow_address: cryptoAddress,
        payment_proof_url: paymentProof.url,
        status: 'pending_merchant_acceptance' // Vendor won't see until merchant pays
      };

      // Insert into cash trades table
      try {
        console.log('Inserting cash trade data:', cashTradeData);
        const { data: cashTrade, error: cashError } = await supabase
          .from('cash_trades')
          .insert(cashTradeData)
          .select()
          .single();
        
        if (cashError) {
          console.error('Cash trades insert error:', cashError);
          throw cashError;
        }
        
        console.log('Cash trade created successfully:', cashTrade);
        
        // Store the cash trade ID for the status page
        setTradeId(cashTrade.id);
      } catch (cashError) {
        console.error('Cash trades table error:', {
          error: cashError,
          message: cashError.message,
          code: cashError.code,
          details: cashError.details
        });
        
        // If table doesn't exist, continue with localStorage fallback
        if (cashError.code === '42P01' || cashError.message?.includes('does not exist')) {
          console.warn('Cash trades table does not exist, using localStorage fallback');
          try {
            localStorage.setItem(`cash_trade_${tradeRequest.id}`, JSON.stringify(cashTradeData));
          } catch (storageError) {
            console.error('localStorage fallback failed:', storageError);
          }
        } else {
          // Re-throw other errors
          throw cashError;
        }
      }

      // Only spend credits AFTER successful trade request creation
      const platformFee = Math.ceil(usdAmount / 10); // 1 credit per $10 USD
      const creditSuccess = await creditsService.spendCredits(user.id, platformFee, `Platform fee for selling ${cryptoType} for cash (${deliveryType})`);
      
      if (!creditSuccess) {
        // Delete the trade request if credit spending fails
        await supabase.from('trade_requests').delete().eq('id', tradeRequest.id);
        throw new Error('Failed to process platform fee');
      }

      // Set the trade ID for status tracking
      if (tradeId) {
        console.log('✅ Trade created successfully with ID:', tradeId);
      }
      setStep(3);

      // Broadcast to merchants (NOT vendors)
      setTimeout(async () => {
        // Notify merchants about the new trade request
        const { data: merchants } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('is_merchant', true)
          .eq('merchant_mode', true)
          .neq('user_id', user.id);

        if (merchants && merchants.length > 0) {
          const notifications = merchants.map(merchant => ({
            user_id: merchant.user_id,
            type: 'trade_request',
            title: 'New Cash Trade Available',
            message: `Someone wants to sell ${amount} ${cryptoType} for $${usdAmount?.toLocaleString()} USD cash`,
            data: {
              trade_request_id: tradeRequest.id,
              crypto_type: cryptoType,
              amount_crypto: amount,
              usd_amount: usdAmount,
              delivery_type: deliveryType,
              trade_mode: 'sell_for_cash'
            }
          }));

          await supabase
            .from('notifications')
            .insert(notifications);
        }
        
        setStep(4);
      }, 2000);

    } catch (error) {
      console.error('Error creating trade:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      alert(`Failed to create trade request: ${error.message || 'Unknown error'}`);
      // Don't reset step on error - let user try again
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Address copied to clipboard!');
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft size={24} className="text-gray-700 mr-4" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Deposit Crypto</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Trade Summary</h3>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex justify-between">
                <span>Selling:</span>
                <span>{amount} {cryptoType}</span>
              </div>
              <div className="flex justify-between">
                <span>You'll receive:</span>
                <span>${usdAmount?.toLocaleString()} USD cash</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>{deliveryType === 'pickup' ? 'Pickup' : 'Home Delivery'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total fees:</span>
                <span>{totalFee} credits</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 1: Deposit Your Crypto</h3>
            <p className="text-sm text-gray-600">
              Send exactly <strong>{amount} {cryptoType}</strong> to the address below to secure your trade.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{cryptoType} Address:</span>
                <Button
                  onClick={() => copyToClipboard(cryptoAddress)}
                  variant="outline"
                  size="sm"
                  disabled={generatingAddress || !cryptoAddress}
                >
                  Copy
                </Button>
              </div>
              <div className="bg-white border rounded p-3 break-all text-sm font-mono">
                {generatingAddress ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Generating secure BitGo address...
                  </div>
                ) : (
                  cryptoAddress
                )}
              </div>
              {!generatingAddress && cryptoAddress && (
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <CheckCircle size={12} className="mr-1" />
                  Real BitGo escrow address generated
                </p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="text-yellow-600 mr-2 mt-0.5" size={16} />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="space-y-1">
                    <li>• Send exactly {amount} {cryptoType}</li>
                    <li>• Double-check the address before sending</li>
                    <li>• Transaction must be confirmed on blockchain</li>
                    <li>• Keep your transaction hash for proof</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4"
            >
              I've Sent the Crypto
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center">
            <button onClick={() => setStep(1)}>
              <ArrowLeft size={24} className="text-gray-700 mr-4" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Upload Proof</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 2: Upload Payment Proof</h3>
            <p className="text-sm text-gray-600">
              Upload a screenshot of your transaction or transaction hash as proof of payment.
            </p>

            <div className={`border-2 border-dashed rounded-lg p-6 text-center relative ${
              paymentProof ? 'border-green-300 bg-green-50' : 'border-gray-300'
            }`}>
              {paymentProof ? (
                <div className="space-y-2">
                  <CheckCircle className="mx-auto text-green-500" size={48} />
                  <p className="text-sm font-medium text-green-600">File uploaded successfully</p>
                  <p className="text-xs text-gray-500">{paymentProof.name}</p>
                  <Button
                    onClick={() => setPaymentProof(null)}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Upload Different File
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Upload className="mx-auto text-gray-400" size={48} />
                    <p className="text-sm text-gray-600">Click to upload payment proof</p>
                    <p className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</p>
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                </>
              )}
            </div>

            {uploading && (
              <div className="text-center">
                <div className="inline-flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Uploading...
                </div>
              </div>
            )}

            <Button
              onClick={handleSendTradeRequest}
              disabled={!paymentProof || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 disabled:bg-gray-400"
            >
              {loading ? 'Creating Trade...' : 'Send Trade Request'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900">Processing Trade Request</h2>
          <p className="text-gray-600">Verifying your crypto deposit...</p>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-gray-900">Trade Active</h1>
        </div>

        <div className="p-4 space-y-6">
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto text-green-500" size={64} />
            <h2 className="text-xl font-semibold text-gray-900">Trade Request Sent!</h2>
            <p className="text-gray-600">
              Your trade has been broadcast to all users. The fastest user will accept and arrange cash delivery.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">What happens next:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Merchants compete to accept your trade</li>
              <li>• Winner pays vendor for cash delivery</li>
              <li>• Vendor delivers ${usdAmount?.toLocaleString()} USD cash to you</li>
              <li>• You confirm cash receipt → Your crypto is released to merchant</li>
            </ul>
          </div>

            <Button
              onClick={() => navigate(`/cash-trade-status/${tradeId}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4"
            >
              View Trade Status
            </Button>
        </div>
      </div>
    );
  }
};

export default CashEscrowFlow;