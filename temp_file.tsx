import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, Phone, MapPin, User, DollarSign, Key, Mail, Building, Calendar, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { vendorPaymentService, CashOrderWithUserDetails } from '@/services/vendorPaymentService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { isPdfFile, isImageFile, downloadFile } from '@/utils/fileUtils';

// Using interfaces from the service

const VendorPaymentConfirmation = () => {
  const [orderDetails, setOrderDetails] = useState<CashOrderWithUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [quoteCode, setQuoteCode] = useState('');
  const [completing, setCompleting] = useState(false);
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  
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
      
      const orderData = await vendorPaymentService.getCashOrderWithUserDetails(orderId!);
      setOrderDetails(orderData);
      
    } catch (error: any) {
      setError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderDetails || !amountReceived.trim()) {
      toast({
        title: "Error",
        description: "Please enter the amount you received",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await vendorPaymentService.confirmPaymentReceived({
        orderId: orderDetails.id,
        amountReceived: parseFloat(amountReceived),
        transactionReference: transactionReference.trim() || undefined
      });

      toast({
        title: "Payment Confirmed",
        description: "Payment has been confirmed successfully. You can now proceed to complete the delivery.",
      });

      // Reload order details to show updated status
      await loadOrderDetails();
      setShowCompletionForm(true);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to confirm payment',
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!orderDetails || !quoteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter the quote code from the customer",
        variant: "destructive"
      });
      return;
    }

    try {
      setCompleting(true);
      
      const result = await vendorPaymentService.completeDelivery({
        orderId: orderDetails.id,
        quoteCode: quoteCode.trim()
      });

      if (result.success) {
        toast({
          title: "Delivery Completed",
          description: result.message,
        });
        // Reload order details to show completed status
        await loadOrderDetails();
        
        // Redirect to vendor dashboard after 2 seconds
        setTimeout(() => {
          navigate('/vendor/dashboard');
        }, 2000);
      } else {
        toast({
          title: "Invalid Quote Code",
          description: result.message,
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to complete delivery',
        variant: "destructive"
      });
    } finally {
      setCompleting(false);
    }
  };

  const getOrderTypeDisplay = (orderType: string) => {
    switch (orderType) {
      case 'naira_to_usd_pickup':
        return 'Cash Pickup';
      case 'naira_to_usd_delivery':
        return 'Cash Delivery';
      default:
        return orderType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payment_pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_submitted':
        return 'bg-blue-100 text-blue-800';
      case 'payment_confirmed':
        return 'bg-green-100 text-green-800';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <Button onClick={() => navigate('/vendor/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vendor/dashboard')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Payment Confirmation
                </h1>
                <p className="text-sm text-gray-600">
                  Order #{orderDetails.tracking_code}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(orderDetails.status)}>
              {orderDetails.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Customer Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderDetails.user_profile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">{orderDetails.user_profile.display_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium">{orderDetails.user_profile.phone_number}</p>
                    </div>
                  </div>

                  {orderDetails.user_profile.whatsapp_number && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">WhatsApp Number</p>
                        <p className="font-medium">{orderDetails.user_profile.whatsapp_number}</p>
                      </div>
                    </div>
                  )}

                  {orderDetails.user_profile.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Email Address</p>
                        <p className="font-medium">{orderDetails.user_profile.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {orderDetails.user_profile.bank_account && (
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Bank Account</p>
                        <p className="font-medium">{orderDetails.user_profile.bank_account}</p>
                        {orderDetails.user_profile.bank_name && (
                          <p className="text-sm text-gray-500">{orderDetails.user_profile.bank_name}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Account Created</p>
                      <p className="font-medium">
                        {new Date(orderDetails.user_profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Customer profile information not available. Please contact support if you need additional details.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Order Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Delivery Method</p>
                    <p className="font-medium">{getOrderTypeDisplay(orderDetails.order_type)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Amount to Send</p>
                    <p className="font-medium">₦{orderDetails.naira_amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">USD Amount</p>
                    <p className="font-medium">${orderDetails.usd_amount}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Order Created</p>
                    <p className="font-medium">
                      {new Date(orderDetails.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Service Fee</p>
                    <p className="font-medium">₦{orderDetails.service_fee.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Tracking Code</p>
                    <p className="font-medium font-mono">{orderDetails.tracking_code}</p>
                  </div>
                </div>

                {orderDetails.payment_proof_url && (
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Payment Proof</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPaymentProof(true)}
                        className="mt-1"
                      >
                        View Payment Proof
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Details */}
            {orderDetails.delivery_details && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  Delivery Information
                </h4>
                <div className="space-y-2">
                  {orderDetails.delivery_details.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium text-gray-900">{orderDetails.delivery_details.address}</p>
                      </div>
                    </div>
                  )}
                  {orderDetails.delivery_details.landmark && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Landmark</p>
                        <p className="font-medium text-gray-900">{orderDetails.delivery_details.landmark}</p>
                      </div>
                    </div>
                  )}
                  {orderDetails.delivery_details.city && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">City</p>
                        <p className="font-medium text-gray-900">{orderDetails.delivery_details.city}</p>
                      </div>
                    </div>
                  )}
                  {orderDetails.delivery_details.state && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">State</p>
                        <p className="font-medium text-gray-900">{orderDetails.delivery_details.state}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Details */}
            {orderDetails.contact_details && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  Contact Information
                </h4>
                <div className="space-y-2">
                  {orderDetails.contact_details.phoneNumber && (
                    <div className="flex items-start space-x-2">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-medium text-gray-900">{orderDetails.contact_details.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                  {orderDetails.contact_details.whatsappNumber && (
                    <div className="flex items-start space-x-2">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">WhatsApp Number</p>
                        <p className="font-medium text-gray-900">{orderDetails.contact_details.whatsappNumber}</p>
                      </div>
                    </div>
                  )}
                  {orderDetails.contact_details.preferredDate && (
                    <div className="flex items-start space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Preferred Date</p>
                        <p className="font-medium text-gray-900">{orderDetails.contact_details.preferredDate}</p>
                      </div>
                    </div>
                  )}
                  {orderDetails.contact_details.preferredTime && (
                    <div className="flex items-start space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Preferred Time</p>
                        <p className="font-medium text-gray-900">{orderDetails.contact_details.preferredTime}</p>
                      </div>
                    </div>
                  )}
                  {orderDetails.contact_details.additionalNotes && (
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Additional Notes</p>
                        <p className="font-medium text-gray-900">{orderDetails.contact_details.additionalNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Confirmation Form */}
        {orderDetails.status === 'payment_submitted' && !showCompletionForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Confirm Payment Received</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amountReceived">Amount Actually Received (₦)</Label>
                  <Input
                    id="amountReceived"
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="Enter the amount you received"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="transactionReference">Transaction Reference (Optional)</Label>
                  <Input
                    id="transactionReference"
                    type="text"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder="Bank transaction reference or receipt number"
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                onClick={handleConfirmPayment}
                disabled={submitting || !amountReceived.trim()}
                className="w-full h-12"
                size="lg"
              >
                {submitting ? 'Confirming...' : 'I Have Received Payment'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Delivery Completion Form */}
        {(orderDetails.status === 'payment_confirmed' || showCompletionForm) && orderDetails.status !== 'completed' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Complete Delivery</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ask the customer for their Quote Code to complete the delivery. 
                  The Quote Code is a 6-digit number that was provided to them when they created this order.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="quoteCode">Quote Code from Customer</Label>
                <Input
                  id="quoteCode"
                  type="text"
                  value={quoteCode}
                  onChange={(e) => setQuoteCode(e.target.value)}
                  placeholder="Enter 6-digit quote code"
                  className="mt-1"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleCompleteDelivery}
                disabled={completing || !quoteCode.trim()}
                className="w-full h-12"
                size="lg"
              >
                {completing ? 'Completing...' : 'Complete Delivery'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Completed Status */}
        {orderDetails.status === 'completed' && (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Delivery Completed Successfully
              </h3>
              <p className="text-gray-600">
                This order has been completed. The customer has received their cash.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Payment Proof Dialog */}
        <Dialog open={showPaymentProof} onOpenChange={setShowPaymentProof}>
          <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>Payment Proof</DialogTitle>
              <p className="text-sm text-gray-600">View the payment proof uploaded by the customer</p>
            </DialogHeader>
            {orderDetails?.payment_proof_url && (
              <div className="flex-1 overflow-hidden">
                <div className="h-full flex items-center justify-center p-6">
                  {isImageFile(orderDetails.payment_proof_url) ? (
                  <img 
                    src={orderDetails.payment_proof_url} 
                    alt="Payment proof"
                    className="max-w-full max-h-full object-contain rounded-lg border shadow-lg"
                    style={{ maxHeight: 'calc(90vh - 120px)' }}
                  />
                  ) : isPdfFile(orderDetails.payment_proof_url) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">PDF Payment Receipt</h3>
                        <p className="text-gray-600 mb-4">
                          This payment proof is a PDF document. Click the button below to download and view it.
                        </p>
                        <Button
                          onClick={() => downloadFile(orderDetails.payment_proof_url, `payment-proof-${orderDetails.tracking_code}.pdf`)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                      <div className="w-full max-w-2xl">
                        <iframe
                          src={orderDetails.payment_proof_url}
                          className="w-full h-96 border rounded-lg"
                          title="PDF Preview"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Proof</h3>
                      <p className="text-gray-600 mb-4">
                        This file type is not supported for preview. Click the button below to download it.
                      </p>
                      <Button
                        onClick={() => downloadFile(orderDetails.payment_proof_url)}
                        variant="outline"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  )}
                </div>
                <div className="p-6 pt-0 text-center border-t">
                  <Button
                    onClick={() => setShowPaymentProof(false)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VendorPaymentConfirmation;
