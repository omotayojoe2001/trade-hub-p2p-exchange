import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, CheckCircle, Clock, AlertCircle, MapPin, Phone, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import VendorNotificationService from '@/services/vendorNotificationService';

const CashTradeFlow = () => {
  const [step, setStep] = useState(1);
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { tradeId, request, trade } = location.state || {};
  
  // Get cash-specific data from localStorage or request
  const getCashData = () => {
    try {
      const stored = localStorage.getItem(`cash_trade_${request?.id}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };
  
  const cashData = getCashData();
  const usdAmount = request?.usd_amount || cashData.usd_amount || 1000;
  const deliveryType = cashData.delivery_type || 'pickup';
  const deliveryAddress = cashData.delivery_address;

  // Load vendor information
  useEffect(() => {
    const loadVendor = async () => {
      try {
        const vendorId = request?.vendor_id;
        
        if (!vendorId) {
          console.error('No vendor ID provided in request');
          alert('Vendor information missing. Please try again.');
          navigate(-1);
          return;
        }

        // Get specific vendor by ID
        const { data: vendorData, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .single();
        
        if (error) throw error;
        
        if (vendorData) {
          setVendor({
            ...vendorData,
            profiles: {
              display_name: vendorData.display_name,
              phone_number: vendorData.phone_number
            }
          });
        } else {
          console.error('Vendor not found');
          alert('Delivery agent not found. Please try again.');
          navigate(-1);
          return;
        }
      } catch (error) {
        console.error('Error loading vendor:', error);
        alert('Unable to load delivery agent. Please try again.');
        navigate(-1);
        return;
      }
    };

    if (request?.vendor_id) {
      loadVendor();
    }
  }, [request, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

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

  const handleConfirmPayment = async () => {
    if (!paymentProof) {
      alert('Please upload payment proof first');
      return;
    }

    setLoading(true);
    try {
      // Generate delivery code
      const deliveryCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Update trade status and notify vendor
      await supabase
        .from('trades')
        .update({
          status: 'payment_sent',
          buyer_payment_proof: paymentProof.url,
          vendor_id: vendor.id,
          delivery_code: deliveryCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      // Create or update cash trade record with proper vendor notification
      const { data: cashTradeData, error: cashTradeError } = await supabase
        .from('cash_trades')
        .upsert({
          trade_request_id: request.id,
          seller_id: request.user_id,
          buyer_id: user.id,
          vendor_id: vendor.id,
          usd_amount: usdAmount,
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
          pickup_location: deliveryType === 'pickup' ? vendor.location : null,
          vendor_payment_proof_url: paymentProof.url,
          delivery_code: deliveryCode,
          seller_phone: request.user_phone || 'Not provided',
          status: 'vendor_paid',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'trade_request_id'
        })
        .select()
        .single();

      if (cashTradeError) {
        console.error('❌ MERCHANT DEBUG: Error creating cash trade:', cashTradeError);
        throw cashTradeError;
      }

      console.log('✅ MERCHANT DEBUG: Cash trade created/updated:', cashTradeData);

      // Create delivery code record
      await supabase
        .from('delivery_codes')
        .insert({
          cash_trade_id: cashTradeData.id,
          code: deliveryCode,
          seller_phone: user.phone || 'Not provided',
          vendor_id: vendor.id
        });

      console.log('🔔 MERCHANT DEBUG: Starting vendor notification process...');
      
      // Use the vendor notification service to send payment notification
      const notificationSuccess = await VendorNotificationService.notifyVendorPaymentReceived({
        vendorId: vendor.id,
        cashTradeId: cashTradeData.id,
        usdAmount: usdAmount,
        deliveryType: deliveryType,
        deliveryAddress: deliveryAddress,
        pickupLocation: deliveryType === 'pickup' ? vendor.location : undefined,
        deliveryCode: deliveryCode,
        sellerPhone: request.user_phone || 'Not provided',
        customerName: 'Customer',
        tradeRequestId: request.id
      });
      
      if (notificationSuccess) {
        console.log('✅ MERCHANT DEBUG: Vendor notification sent successfully!');
      } else {
        console.error('❌ MERCHANT DEBUG: Failed to send vendor notification');
      }

      // Show success message with debugging info
      console.log('🎉 MERCHANT DEBUG: Payment process completed successfully!');
      console.log('🎯 MERCHANT DEBUG: Summary:');
      console.log('  - Vendor ID:', vendor.id);
      console.log('  - Cash Trade ID:', cashTradeData?.id);
      console.log('  - Status set to: vendor_paid');
      console.log('  - Delivery Code:', deliveryCode);
      console.log('  - Vendor notification sent:', notificationSuccess);
      console.log('  - Vendor should now see BIG POPUP notification with payment details');
      
      alert(`✅ Payment confirmed! Vendor has been notified and will deliver $${usdAmount} USD cash to seller.\n\nDelivery Code: ${deliveryCode}`);
      setStep(2);
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!vendor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor information...</p>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft size={24} className="text-gray-700 mr-4" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Pay Vendor</h1>
          </div>
          <div className="flex items-center text-orange-600">
            <Clock size={16} className="mr-1" />
            <span className="text-sm font-medium">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Trade Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Trade Summary</h3>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex justify-between">
                <span>Buying:</span>
                <span>{request.amount_crypto} {request.crypto_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Seller gets:</span>
                <span>${usdAmount?.toLocaleString()} USD cash</span>
              </div>
              <div className="flex justify-between">
                <span>You pay vendor:</span>
                <span>₦{(usdAmount * 1650)?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Vendor Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Cash Vendor Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <User size={16} className="text-gray-400 mr-2" />
                <span className="text-gray-900 font-medium">{vendor.profiles?.display_name}</span>
              </div>
              
              <div className="flex items-center">
                <Phone size={16} className="text-gray-400 mr-2" />
                <span className="text-gray-900">{vendor.profiles?.phone_number}</span>
              </div>
              
              <div className="flex items-center">
                <MapPin size={16} className="text-gray-400 mr-2" />
                <span className="text-gray-900">{vendor.location} - {vendor.address}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-3">Pay This Vendor</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-700">Bank Name:</span>
                <span className="font-medium text-green-900">{vendor.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Account Number:</span>
                <span className="font-medium text-green-900">{vendor.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Account Name:</span>
                <span className="font-medium text-green-900">{vendor.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Amount:</span>
                <span className="font-bold text-green-900 text-lg">₦{(usdAmount * 1650)?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="text-yellow-600 mr-2 mt-0.5" size={16} />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Payment Instructions:</p>
                <ul className="space-y-1">
                  <li>• Send exactly ₦{(usdAmount * 1650)?.toLocaleString()} to the vendor account above</li>
                  <li>• Use "{request.crypto_type} Trade #{tradeId}" as transfer description</li>
                  <li>• Take screenshot of successful transfer</li>
                  <li>• Upload proof below to notify vendor</li>
                  <li>• Vendor will deliver ${usdAmount?.toLocaleString()} USD cash to seller</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Upload Payment Proof */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Upload Payment Proof</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
              {paymentProof ? (
                <div className="space-y-2">
                  <CheckCircle className="mx-auto text-green-500" size={48} />
                  <p className="text-sm font-medium text-green-600">Payment proof uploaded</p>
                  <p className="text-xs text-gray-500">{paymentProof.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto text-gray-400" size={48} />
                  <p className="text-sm text-gray-600">Upload transfer screenshot</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
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
              onClick={handleConfirmPayment}
              disabled={!paymentProof || loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 disabled:bg-gray-400"
            >
              {loading ? 'Confirming Payment...' : 'Confirm Payment to Vendor'}
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
          <h1 className="text-lg font-semibold text-gray-900">Payment Confirmed</h1>
        </div>

        <div className="p-4 space-y-6">
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto text-green-500" size={64} />
            <h2 className="text-xl font-semibold text-gray-900">Payment Sent to Vendor!</h2>
            <p className="text-gray-600">
              Your payment has been confirmed. The vendor will now deliver ${usdAmount?.toLocaleString()} USD cash to the seller.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">What happens next:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Vendor receives your payment notification</li>
              <li>• Vendor delivers ${usdAmount?.toLocaleString()} USD cash to seller</li>
              <li>• Seller confirms cash receipt with delivery code</li>
              <li>• {request.amount_crypto} {request.crypto_type} is released to your wallet</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Track Your Trade:</h3>
            <p className="text-sm text-blue-700">
              You can track the delivery status and get updates in the "My Trades" section.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Vendor Contact:</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Name:</strong> {vendor.profiles?.display_name}</p>
              <p><strong>Phone:</strong> {vendor.profiles?.phone_number}</p>
              <p><strong>Location:</strong> {vendor.location}</p>
            </div>
          </div>

          <Button
            onClick={() => navigate('/my-trades')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4"
          >
            View Trade Status
          </Button>
        </div>
      </div>
    );
  }
};

export default CashTradeFlow;