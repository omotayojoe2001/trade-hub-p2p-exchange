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

  useEffect(() => {
    if (!orderData) {
      navigate('/send-naira-get-usd');
      return;
    }
    loadBankDetails();
  }, []);

  const loadBankDetails = async () => {
    try {
      setLoading(true);
      // Get the first available vendor's bank details
      const { data: vendor, error } = await supabase
        .from('vendors')
        .select('bank_name, bank_account, display_name')
        .eq('active', true)
        .limit(1)
        .single();

      if (error) throw error;

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
    if (!user) return;
    
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/payment-proof-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, file);
        
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);
        
      setPaymentProofUrl(urlData.publicUrl);
      
      toast({
        title: "Upload successful",
        description: "Payment proof uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
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
    if (!user || !orderData || !paymentProofUrl) return;
    
    try {
      setSubmitting(true);
      
      // Create cash order with vendor assignment
      const orderId = await supabase.rpc('create_cash_order_with_vendor', {
        p_user_id: user.id,
        p_naira_amount: parseFloat(orderData.nairaAmount),
        p_usd_amount: parseFloat(orderData.usdAmount),
        p_service_fee: orderData.serviceFee,
        p_order_type: orderData.deliveryMethod === 'pickup' ? 'naira_to_usd_pickup' : 'naira_to_usd_delivery',
        p_delivery_details: orderData.deliveryMethod === 'pickup' 
          ? { pickup_location: orderData.pickupLocation }
          : orderData.deliveryAddress,
        p_contact_details: {
          phone_number: orderData.phoneNumber,
          whatsapp_number: orderData.whatsappNumber,
          preferred_date: orderData.preferredDate,
          preferred_time: orderData.preferredTime,
          additional_notes: orderData.additionalNotes
        }
      });
      
      if (!orderId.data) throw new Error('Failed to create cash order');
      
      // Update with payment proof using the service
      await cashOrderService.updatePaymentProof(orderId.data, paymentProofUrl);
      
      // Get the tracking code
      const { data: orderDetails, error: fetchError } = await supabase
        .from('cash_order_tracking')
        .select('tracking_code')
        .eq('id', orderId.data)
        .single();
        
      if (fetchError) throw fetchError;
      
      toast({
        title: "Payment submitted",
        description: "Your payment has been submitted for verification",
      });
      
      // Navigate to thank you page
      navigate('/cash-order-thank-you', {
        state: {
          orderType: orderData.deliveryMethod === 'pickup' ? 'usd-pickup' : 'usd-delivery',
          code: orderDetails.tracking_code,
          amount: orderData.usdAmount,
          currency: 'USD',
          estimatedTime: orderData.deliveryMethod === 'pickup' ? '1-3 hours' : '2-6 hours',
          orderDetails: orderData
        }
      });
      
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit payment confirmation",
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
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="mr-3">
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
              <CardTitle className="text-lg text-blue-900">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-blue-800">Service Type:</span>
                <span className="font-semibold text-blue-900">
                  {orderData.deliveryMethod === 'pickup' ? 'USD Pickup' : 'USD Delivery'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Naira Amount:</span>
                <span className="font-semibold text-blue-900">₦{parseFloat(orderData.nairaAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">USD Amount:</span>
                <span className="font-semibold text-blue-900">${orderData.usdAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800">Service Fee:</span>
                <span className="font-semibold text-blue-900">₦{orderData.serviceFee.toLocaleString()}</span>
              </div>
              <hr className="border-blue-200" />
              <div className="flex justify-between text-lg">
                <span className="text-blue-800 font-medium">Total to Pay:</span>
                <span className="font-bold text-blue-900">₦{(parseFloat(orderData.nairaAmount) + orderData.serviceFee).toLocaleString()}</span>
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
                      ₦{(parseFloat(orderData.nairaAmount) + orderData.serviceFee).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard((parseFloat(orderData.nairaAmount) + orderData.serviceFee).toString(), 'amount')}
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
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
            {submitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'I Have Made Payment'
            )}
          </Button>
          
          <Button
            onClick={() => navigate(-1)}
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