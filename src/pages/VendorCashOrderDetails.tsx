import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, Phone, MapPin, User, DollarSign, Clock, Key } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cashOrderService } from '@/services/cashOrderService';

const VendorCashOrderDetails = () => {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    if (jobId) {
      loadOrderDetails();
    }
  }, [jobId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await cashOrderService.getCashOrder(jobId!);
      setOrderDetails(data);
    } catch (error: any) {
      setError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!jobId) return;
    
    try {
      setSubmitting(true);
      const vendorUserId = localStorage.getItem('vendor_user_id');
      if (!vendorUserId) throw new Error('Vendor user ID not found');
      
      await cashOrderService.confirmPaymentReceived(orderDetails.vendor_job_id, vendorUserId);
      
      toast({
        title: "Payment confirmed",
        description: "Payment has been confirmed. Customer has been notified.",
      });
      
      await loadOrderDetails(); // Refresh data
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
    if (!jobId || !verificationCode.trim()) return;
    
    try {
      setSubmitting(true);
      const vendorUserId = localStorage.getItem('vendor_user_id');
      if (!vendorUserId) throw new Error('Vendor user ID not found');
      
      await cashOrderService.completeOrder(orderDetails.vendor_job_id, verificationCode.trim(), vendorUserId);
      
      toast({
        title: "Order completed",
        description: "Order has been successfully completed.",
      });
      
      await loadOrderDetails(); // Refresh data
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate('/vendor/dashboard')} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Cash Order Details</h1>
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
                    <span className="text-gray-600">Tracking Code:</span>
                    <span className="font-semibold">{orderDetails.tracking_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Type:</span>
                    <span className="font-semibold">
                      {orderDetails.order_type === 'naira_to_usd_pickup' ? 'USD Pickup' : 'USD Delivery'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
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
                  <span className="text-gray-600">Naira Amount:</span>
                  <span className="font-semibold">₦{orderDetails.naira_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">USD Amount:</span>
                  <span className="font-semibold">${orderDetails.usd_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee:</span>
                  <span className="font-semibold">₦{orderDetails.service_fee.toLocaleString()}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg">
                  <span className="text-gray-800 font-medium">Total Received:</span>
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
                  <span className="text-gray-600">Phone:</span>
                  <a 
                    href={`tel:${orderDetails.contact_details.phoneNumber}`}
                    className="text-blue-600 font-semibold"
                  >
                    {orderDetails.contact_details.phoneNumber}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">WhatsApp:</span>
                  <a 
                    href={`https://wa.me/${orderDetails.contact_details.whatsappNumber.replace(/\D/g, '')}`}
                    className="text-green-600 font-semibold"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {orderDetails.contact_details.whatsappNumber}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Preferred Date:</span>
                  <span className="font-semibold">{orderDetails.contact_details.preferredDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Preferred Time:</span>
                  <span className="font-semibold">{orderDetails.contact_details.preferredTime}</span>
                </div>
                {orderDetails.contact_details.additionalNotes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
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
                      <p className="text-gray-600">
                        {orderDetails.delivery_details.city}, {orderDetails.delivery_details.state}
                      </p>
                      {orderDetails.delivery_details.landmark && (
                        <p className="text-sm text-gray-500">
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
                  <CardTitle className="text-lg">Payment Proof</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={orderDetails.payment_proof_url} 
                    alt="Payment proof"
                    className="w-full max-w-md mx-auto rounded-lg border"
                  />
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {orderDetails.status === 'payment_submitted' && (
                <Button
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="w-full h-12 bg-green-600 hover:bg-green-700"
                >
                  {submitting ? 'Confirming...' : 'Confirm Payment Received'}
                </Button>
              )}

              {orderDetails.status === 'payment_confirmed' && (
                <>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
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
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700"
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
    </div>
  );
};

export default VendorCashOrderDetails;