import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, Phone, MapPin, User, DollarSign, Key, FileText, MessageCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { isPdfFile, isImageFile, downloadFile } from '@/utils/fileUtils';
import MessageThread from '@/components/MessageThread';

interface CashOrderDetails {
  id: string;
  user_id: string;
  tracking_code: string;
  order_type: string;
  naira_amount: number;
  usd_amount: number;
  service_fee: number;
  status: string;
  payment_proof_url?: string;
  delivery_details: any;
  contact_details: any;
  created_at: string;
  vendor_job_id: string;
  vendor_job: {
    verification_code: string;
    customer_phone?: string;
  };
}

const VendorCashOrderDetails = () => {
  const [orderDetails, setOrderDetails] = useState<CashOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cash_order_tracking')
        .select(`
          *,
          vendor_job:vendor_job_id (
            verification_code,
            customer_phone,
            vendor:vendor_id (
              display_name,
              phone
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrderDetails(data);
      
    } catch (error: any) {
      setError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderDetails) return;
    
    try {
      setSubmitting(true);
      
      // Update vendor job status
      const { error: jobError } = await supabase
        .from('vendor_jobs')
        .update({ 
          status: 'payment_confirmed',
          payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', orderDetails.vendor_job_id);

      if (jobError) throw jobError;

      // Update cash order status
      const { error: orderError } = await supabase
        .from('cash_order_tracking')
        .update({ status: 'payment_confirmed' })
        .eq('id', orderDetails.id);

      if (orderError) throw orderError;

      // Notify premium user
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: orderDetails.user_id,
          type: 'cash_order_update',
          title: 'Payment Confirmed',
          message: 'Vendor has confirmed payment. Your cash will be delivered soon.',
          data: {
            tracking_code: orderDetails.tracking_code,
            cash_order_id: orderDetails.id
          }
        });

      if (notifError) throw notifError;
      
      toast({
        title: "Payment confirmed",
        description: "Payment has been confirmed. Customer has been notified.",
      });
      
      await loadOrderDetails();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm payment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!orderDetails || !verificationCode.trim()) return;
    
    try {
      setSubmitting(true);
      
      // Verify the code matches
      if (verificationCode.trim() !== orderDetails.vendor_job.verification_code) {
        throw new Error('Invalid verification code');
      }

      // Update vendor job status
      const { error: jobError } = await supabase
        .from('vendor_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderDetails.vendor_job_id);

      if (jobError) throw jobError;

      // Update cash order status
      const { error: orderError } = await supabase
        .from('cash_order_tracking')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderDetails.id);

      if (orderError) throw orderError;

      // Notify premium user
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: orderDetails.user_id,
          type: 'cash_order_completed',
          title: 'Order Completed',
          message: 'Your cash order has been completed successfully!',
          data: {
            tracking_code: orderDetails.tracking_code,
            cash_order_id: orderDetails.id
          }
        });

      if (notifError) throw notifError;
      
      toast({
        title: "Order completed",
        description: "Order has been successfully completed.",
      });
      
      await loadOrderDetails();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete order",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payment_pending':
      case 'payment_submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <button onClick={() => navigate('/vendor/dashboard')} className="mr-3">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Cash Order Details</h1>
      </div>

      <div className="p-4">
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {orderDetails && (
          <>
            {/* Order Status */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Order Status</CardTitle>
                  <Badge className={getStatusColor(orderDetails.status)}>
                    {orderDetails.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tracking Code:</span>
                    <span className="font-semibold">{orderDetails.tracking_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Type:</span>
                    <span className="font-semibold">
                      {orderDetails.order_type === 'naira_to_usd_pickup' ? 'USD Pickup' : 'USD Delivery'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-semibold">
                      {new Date(orderDetails.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amount Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span>Amount Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Naira Amount:</span>
                  <span className="font-semibold">₦{orderDetails.naira_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">USD Amount:</span>
                  <span className="font-semibold">${orderDetails.usd_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee:</span>
                  <span className="font-semibold">₦{orderDetails.service_fee.toLocaleString()}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Total Received:</span>
                  <span className="font-bold text-green-600">
                    ₦{(orderDetails.naira_amount + orderDetails.service_fee).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Customer Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <a 
                    href={`tel:${orderDetails.contact_details.phoneNumber}`}
                    className="text-blue-600 font-semibold"
                  >
                    {orderDetails.contact_details.phoneNumber}
                  </a>
                </div>
                {orderDetails.contact_details.whatsappNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WhatsApp:</span>
                    <a 
                      href={`https://wa.me/${orderDetails.contact_details.whatsappNumber.replace(/\D/g, '')}`}
                      className="text-green-600 font-semibold"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {orderDetails.contact_details.whatsappNumber}
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preferred Date:</span>
                  <span className="font-semibold">{orderDetails.contact_details.preferredDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preferred Time:</span>
                  <span className="font-semibold">{orderDetails.contact_details.preferredTime}</span>
                </div>
                {orderDetails.contact_details.additionalNotes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1 text-sm bg-muted p-2 rounded">
                      {orderDetails.contact_details.additionalNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Details */}
            {orderDetails.delivery_details && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <span>
                      {orderDetails.order_type === 'naira_to_usd_pickup' ? 'Pickup' : 'Delivery'} Details
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orderDetails.order_type === 'naira_to_usd_pickup' ? (
                    <p className="font-semibold">{orderDetails.delivery_details.pickup_location}</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-semibold">{orderDetails.delivery_details.street}</p>
                      <p className="text-muted-foreground">
                        {orderDetails.delivery_details.city}, {orderDetails.delivery_details.state}
                      </p>
                      {orderDetails.delivery_details.landmark && (
                        <p className="text-sm text-muted-foreground">
                          Landmark: {orderDetails.delivery_details.landmark}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Proof */}
            {orderDetails.payment_proof_url && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Payment Proof</span>
                    {isPdfFile(orderDetails.payment_proof_url) && (
                      <Button
                        onClick={() => downloadFile(orderDetails.payment_proof_url, `payment-proof-${orderDetails.tracking_code}.pdf`)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isImageFile(orderDetails.payment_proof_url) ? (
                  <img 
                    src={orderDetails.payment_proof_url} 
                    alt="Payment proof"
                    className="w-full max-w-md mx-auto rounded-lg border"
                  />
                  ) : isPdfFile(orderDetails.payment_proof_url) ? (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <FileText className="w-12 h-12 text-red-500 mx-auto mb-2" />
                        <p className="text-sm text-red-700 mb-3">
                          This payment proof is a PDF document. Click the download button above to view it.
                        </p>
                        <Button
                          onClick={() => downloadFile(orderDetails.payment_proof_url, `payment-proof-${orderDetails.tracking_code}.pdf`)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                      <div className="w-full max-w-2xl mx-auto">
                        <iframe
                          src={orderDetails.payment_proof_url}
                          className="w-full h-96 border rounded-lg"
                          title="PDF Preview"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg border">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">
                        This file type is not supported for preview. Click the button below to download it.
                      </p>
                      <Button
                        onClick={() => downloadFile(orderDetails.payment_proof_url)}
                        size="sm"
                        variant="outline"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Customer's Verification Code (when ready for completion) */}
            {orderDetails.status === 'payment_confirmed' && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Key className="w-5 h-5 text-blue-600" />
                    <span>Customer's Verification Code</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-blue-600 mb-2">Customer will provide this code for completion:</p>
                    <p className="font-mono font-bold text-2xl text-blue-800">
                      {orderDetails.vendor_job.verification_code}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {orderDetails.status === 'payment_submitted' && (
                <>
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={submitting}
                    className="w-full h-12"
                    size="lg"
                  >
                    {submitting ? 'Confirming...' : 'Confirm Payment Received'}
                  </Button>
                  
                  <Button
                    onClick={() => setShowMessage(true)}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message Customer
                  </Button>
                </>
              )}

              {orderDetails.status === 'payment_confirmed' && (
                <>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium">
                      Enter customer's verification code:
                    </label>
                    <Input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={handleCompleteOrder}
                    disabled={submitting || !verificationCode.trim()}
                    className="w-full h-12"
                    size="lg"
                  >
                    {submitting ? 'Completing...' : 'Complete Order'}
                  </Button>
                </>
              )}

              {orderDetails.status === 'completed' && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-semibold">Order Completed Successfully</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Message Thread */}
      {showMessage && orderDetails && (
        <MessageThread
          otherUserId={orderDetails.user_id}
          otherUserName="Customer"
          cashTradeId={orderDetails.id}
          contextType="cash_delivery"
          isOpen={showMessage}
          onClose={() => setShowMessage(false)}
        />
      )}
    </div>
  );
};

export default VendorCashOrderDetails;