import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, CheckCircle, AlertCircle, CreditCard, Upload, Camera } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { creditsService } from '@/services/creditsService';
import { cashOrderService } from '@/services/cashOrderService';
import { exchangeRateService } from '@/services/exchangeRateService';

interface VendorBankInfo {
  account_number: string;
  bank_name: string;
  account_name: string;
  bank_code?: string;
}

const SendNairaPaymentStep = () => {
  const [bankDetails, setBankDetails] = useState<VendorBankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { orderData } = location.state || {};
  
  // Get vendor info from URL params (passed from details step)
  const urlParams = new URLSearchParams(location.search);
  const vendorId = urlParams.get('vendorId');
  const exchangeRate = parseFloat(urlParams.get('exchangeRate') || '1650');

  useEffect(() => {
    // Try to restore state from localStorage first
    const savedState = localStorage.getItem('paymentPageState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.orderData && !orderData) {
          // Use saved orderData if current is missing
          setBankDetails(parsed.bankDetails);
          setPaymentProofUrl(parsed.paymentProofUrl || '');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved state:', e);
        localStorage.removeItem('paymentPageState');
      }
    }
    
    if (!orderData) {
      navigate('/send-naira-get-usd');
      return;
    }
    
    loadBankDetails();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (orderData) {
      const currentState = { orderData, bankDetails, paymentProofUrl };
      localStorage.setItem('paymentPageState', JSON.stringify(currentState));
    }
  }, [orderData, bankDetails, paymentProofUrl]);

  const loadBankDetails = async () => {
    try {
      setLoading(true);
      
      // Get specific vendor's bank details if vendorId provided
      let query = supabase
        .from('vendors')
        .select('bank_name, bank_account, display_name')
        .eq('active', true);
      
      if (vendorId) {
        query = query.eq('id', vendorId);
      } else {
        query = query.limit(1);
      }
      
      const { data: vendors, error } = await query;

      if (error) throw error;
      
      const vendor = vendors?.[0];
      if (!vendor) throw new Error('No active vendors available');

      setBankDetails({
        account_number: vendor.bank_account,
        bank_name: vendor.bank_name,
        account_name: vendor.display_name
      });
    } catch (error: any) {
      setError(error.message || 'Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Please upload only PNG, JPG, or PDF files');
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/payment-proof-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);
        
      setPaymentProofUrl(urlData.publicUrl);
      
      // Update stored state immediately
      const currentState = {
        orderData: orderData || JSON.parse(localStorage.getItem('paymentPageState') || '{}').orderData,
        bankDetails,
        paymentProofUrl: urlData.publicUrl
      };
      localStorage.setItem('paymentPageState', JSON.stringify(currentState));
      
      toast({
        title: "Upload successful",
        description: "Payment proof uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload payment proof",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePaymentConfirmation = async () => {
    if (!user || !orderData || !paymentProofUrl) {
      toast({
        title: "Missing information",
        description: "Please upload payment proof before submitting",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Calculate credits required
      const creditsRequired = Math.ceil(parseFloat(orderData.usdAmount) / 10);
      
      // Check if user has enough credits
      const hasEnoughCredits = await creditsService.hasEnoughCredits(user.id, creditsRequired);
      if (!hasEnoughCredits) {
        toast({
          title: "Insufficient Credits",
          description: `You need ${creditsRequired} credits for this transaction. Please purchase more credits.`,
          variant: "destructive",
        });
        navigate('/credits/purchase');
        return;
      }
      
      // Charge credits first
      const creditsCharged = await creditsService.spendCredits(
        user.id, 
        creditsRequired, 
        `Send Naira Get USD - $${orderData.usdAmount}`
      );
      
      if (!creditsCharged) {
        toast({
          title: "Credit charge failed",
          description: "Unable to charge credits. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Creating cash order with data:', {
        userId: user.id,
        nairaAmount: parseFloat(orderData.nairaAmount),
        usdAmount: parseFloat(orderData.usdAmount),
        serviceFee: orderData.serviceFee,
        orderType: orderData.deliveryMethod === 'pickup' ? 'naira_to_usd_pickup' : 'naira_to_usd_delivery'
      });
      
      // Create cash order with vendor assignment using the service
      const orderId = await cashOrderService.createCashOrder(user.id, {
        nairaAmount: parseFloat(orderData.nairaAmount),
        usdAmount: parseFloat(orderData.usdAmount),
        serviceFee: 0,
        orderType: orderData.deliveryMethod === 'pickup' ? 'naira_to_usd_pickup' : 'naira_to_usd_delivery',
        deliveryDetails: orderData.deliveryMethod === 'pickup' 
          ? { pickup_location: orderData.pickupLocation }
          : orderData.deliveryAddress,
        contactDetails: {
          phoneNumber: orderData.phoneNumber,
          whatsappNumber: orderData.whatsappNumber,
          preferredDate: orderData.preferredDate,
          preferredTime: orderData.preferredTime,
          additionalNotes: orderData.additionalNotes
        },
        exchangeRate: exchangeRate
      }, vendorId || undefined);
      
      console.log('Cash order created successfully, ID:', orderId);
      
      // Update with payment proof using the service
      await cashOrderService.updatePaymentProof(orderId, paymentProofUrl);
      
      console.log('Payment proof updated successfully');
      
      // Get the tracking code
      const { data: orderDetails, error: fetchError } = await supabase
        .from('cash_order_tracking')
        .select('tracking_code')
        .eq('id', orderId)
        .single();
        
      if (fetchError) {
        console.error('Failed to fetch tracking code:', fetchError);
        throw new Error('Failed to retrieve order tracking information');
      }
      
      toast({
        title: "Payment submitted successfully",
        description: `Your order ${orderDetails.tracking_code} has been created. ${creditsRequired} credits charged.`,
      });
      
      // Get the verification code from the cash_trades table
      const { data: cashTradeData, error: cashTradeError } = await supabase
        .from('cash_trades')
        .select('delivery_code')
        .eq('seller_id', user.id)
        .eq('merchant_name', 'Send Naira Customer')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (cashTradeError) {
        console.error('Failed to fetch delivery code:', cashTradeError);
        throw new Error('Failed to retrieve delivery code');
      }
      
      // Navigate to thank you page
      navigate('/cash-order-thank-you', {
        state: {
          orderType: orderData.deliveryMethod === 'pickup' ? 'usd-pickup' : 'usd-delivery',
          code: cashTradeData.delivery_code, // This is the 6-digit code for the vendor
          trackingCode: orderDetails.tracking_code, // This is the tracking code
          amount: orderData.usdAmount,
          currency: 'USD',
          estimatedTime: orderData.deliveryMethod === 'pickup' ? '1-3 hours' : '2-6 hours',
          orderDetails: orderData
        }
      });
      
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to create cash order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate('/send-naira-get-usd')} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Complete Payment</h1>
      </div>

      <div className="p-4">
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Order Summary */}
        {orderData && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-white">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white">Service Type:</span>
                <span className="font-semibold text-white">
                  {orderData.deliveryMethod === 'pickup' ? 'USD Pickup' : 'USD Delivery'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Naira Amount:</span>
                <span className="font-semibold text-white">₦{parseFloat(orderData.nairaAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">USD Amount:</span>
                <span className="font-semibold text-white">${orderData.usdAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Credits Charged:</span>
                <span className="font-semibold text-red-600">{orderData.creditsRequired || Math.ceil(parseFloat(orderData.usdAmount) / 10)} credits</span>
              </div>
              <hr className="border-blue-200" />
              <div className="flex justify-between text-lg">
                <span className="text-white font-medium">Total to Pay:</span>
                <span className="font-bold text-white">₦{parseFloat(orderData.nairaAmount).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-red-900">⚠️ Important Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Transfer to vendor account only!</strong> Do not pay any other account.
              </AlertDescription>
            </Alert>
            <div className="space-y-2 text-sm">
              <p>1. Transfer the exact amount to the vendor account below</p>
              <p>2. Upload your payment receipt/screenshot</p>
              <p>3. Click "I Have Made Payment" to notify the vendor</p>
              <p>4. Wait for vendor confirmation and cash delivery</p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        {bankDetails && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <span>Vendor Payment Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bank Name */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Bank Name</p>
                  <p className="font-semibold text-lg">{bankDetails.bank_name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.bank_name, 'bank')}
                  className="ml-2"
                >
                  {copied === 'bank' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Account Number */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Account Number</p>
                  <p className="font-semibold text-xl text-blue-600">{bankDetails.account_number}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.account_number, 'account')}
                  className="ml-2"
                >
                  {copied === 'account' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Account Name */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Account Name</p>
                  <p className="font-semibold text-lg">{bankDetails.account_name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(bankDetails.account_name, 'name')}
                  className="ml-2"
                >
                  {copied === 'name' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Amount to Pay */}
              {orderData && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div>
                    <p className="text-sm text-green-700">Total Amount to Transfer</p>
                    <p className="font-bold text-2xl text-green-800">
                      ₦{parseFloat(orderData.nairaAmount).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(parseFloat(orderData.nairaAmount).toString(), 'amount')}
                    className="ml-2 border-green-300 text-green-700"
                  >
                    {copied === 'amount' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Proof Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Upload Payment Proof</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPaymentProof(file);
                    handleFileUpload(file);
                  }
                }}
                className="hidden"
                id="payment-proof"
                key={Date.now()}
              />
              <label
                htmlFor="payment-proof"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <p className="text-gray-600">Click to upload payment receipt</p>
                <p className="text-sm text-gray-500">PNG, JPG, PDF up to 10MB</p>
              </label>
            </div>
            
            {uploading && (
              <div className="flex items-center space-x-2 text-blue-600">
                <span>Uploading...</span>
              </div>
            )}
            
            {paymentProofUrl && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Payment proof uploaded successfully</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="space-y-3">
          <Button
            onClick={handlePaymentConfirmation}
            disabled={!paymentProofUrl || submitting}
            className="w-full h-12 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {submitting ? 'Processing...' : 'I Have Made Payment'}
          </Button>
          
          <Button
            onClick={() => navigate('/send-naira-get-usd')}
            variant="outline"
            className="w-full h-12"
          >
            Back to Order Details
          </Button>
        </div>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• Make sure to transfer the exact amount shown above</p>
            <p>• Upload a clear screenshot of your payment confirmation</p>
            <p>• Vendor will verify payment within 10-30 minutes</p>
            <p>• You'll receive updates via phone and notifications</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SendNairaPaymentStep;