import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, MapPin, Phone, User, DollarSign, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import VendorBottomNavigation from '@/components/vendor/VendorBottomNavigation';
import VendorDeliveryPopup from '@/components/vendor/VendorDeliveryPopup';

interface CashDeliveryRequest {
  id: string;
  trade_id: string;
  seller_id: string;
  buyer_id: string;
  usd_amount: number;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string;
  pickup_location?: string;
  delivery_code: string;
  customer_phone?: string;
  status: string;
  created_at: string;
  seller_name?: string;
  buyer_name?: string;
}

const VendorDashboard = () => {
  const [requests, setRequests] = useState<CashDeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupRequest, setPopupRequest] = useState<CashDeliveryRequest | null>(null);
  const [lastRequestCount, setLastRequestCount] = useState(0);

  useEffect(() => {
    console.log('🚀 VENDOR DEBUG: VendorDashboard component mounted');
    console.log('🚀 VENDOR DEBUG: Initial localStorage check:', {
      vendor_id: localStorage.getItem('vendor_id'),
      vendor_user_id: localStorage.getItem('vendor_user_id')
    });
    
    loadDeliveryRequests();
    
    // Subscribe to real-time updates for cash_trades
    const channel = supabase
      .channel('vendor-cash-trades')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cash_trades'
      }, (payload) => {
        console.log('🔔 VENDOR DEBUG: Cash trade event received:', payload);
        console.log('🔔 Event type:', payload.eventType);
        console.log('🔔 New record:', payload.new);
        console.log('🔔 Old record:', payload.old);
        console.log('🔔 Current vendor ID:', localStorage.getItem('vendor_id'));
        
        if (payload.eventType === 'UPDATE' && payload.new?.status === 'vendor_paid') {
          console.log('🎯 VENDOR DEBUG: New vendor_paid status detected!');
          console.log('🎯 Vendor ID in record:', payload.new.vendor_id);
          console.log('🎯 Current vendor ID:', localStorage.getItem('vendor_id'));
          
          if (payload.new.vendor_id === localStorage.getItem('vendor_id')) {
            console.log('✅ VENDOR DEBUG: This trade is for current vendor!');
          } else {
            console.log('❌ VENDOR DEBUG: This trade is for different vendor');
          }
        }
        
        loadDeliveryRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lastRequestCount]);

  const loadDeliveryRequests = async () => {
    try {
      setLoading(true);
      const vendorId = localStorage.getItem('vendor_id');
      const vendorUserId = localStorage.getItem('vendor_user_id');
      
      console.log('🔍 VENDOR DEBUG: Loading delivery requests...');
      console.log('🔍 VENDOR DEBUG: Vendor ID from localStorage:', vendorId);
      console.log('🔍 VENDOR DEBUG: Vendor User ID from localStorage:', vendorUserId);
      console.log('🔍 VENDOR DEBUG: All localStorage keys:', Object.keys(localStorage));
      
      if (!vendorId) {
        console.log('❌ VENDOR DEBUG: No vendor ID found in localStorage');
        console.log('❌ VENDOR DEBUG: Available localStorage items:', {
          vendor_id: localStorage.getItem('vendor_id'),
          vendor_user_id: localStorage.getItem('vendor_user_id'),
          all_keys: Object.keys(localStorage)
        });
        
        // Try to get vendor ID from vendors table using user ID
        if (vendorUserId) {
          console.log('🔄 VENDOR DEBUG: Trying to get vendor ID from vendors table...');
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', vendorUserId)
            .single();
          
          console.log('🔄 VENDOR DEBUG: Vendor lookup result:', { vendorData, vendorError });
          
          if (vendorData?.id) {
            localStorage.setItem('vendor_id', vendorData.id);
            console.log('✅ VENDOR DEBUG: Found and stored vendor ID:', vendorData.id);
            // Continue with the found vendor ID
          } else {
            console.log('❌ VENDOR DEBUG: No vendor found for user ID:', vendorUserId);
            return;
          }
        } else {
          return;
        }
      }

      // Get cash trades where merchant has paid this vendor
      const { data: cashTrades, error } = await supabase
        .from('cash_trades')
        .select(`
          *,
          profiles!seller_id(phone)
        `)
        .eq('vendor_id', vendorId)
        .eq('status', 'vendor_paid')
        .order('created_at', { ascending: false });

      console.log('🔍 VENDOR DEBUG: Cash trades query result:', { cashTrades, error });
      console.log('🔍 VENDOR DEBUG: Found', cashTrades?.length || 0, 'delivery requests');
      console.log('🔍 VENDOR DEBUG: Raw cash trades data:', cashTrades);
      
      // Also check all cash trades to see what exists
      const { data: allTrades } = await supabase
        .from('cash_trades')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('🔍 VENDOR DEBUG: All cash trades in database:', allTrades);
      console.log('🔍 VENDOR DEBUG: Trades with vendor_paid status:', 
        allTrades?.filter(t => t.status === 'vendor_paid'));

      if (error) {
        console.error('❌ VENDOR DEBUG: Error fetching cash trades:', error);
        throw error;
      }

      // Transform to delivery requests format
      const deliveryRequests: CashDeliveryRequest[] = (cashTrades || []).map(trade => ({
        id: trade.id,
        trade_id: trade.trade_request_id,
        seller_id: trade.seller_id,
        buyer_id: trade.buyer_id,
        usd_amount: trade.usd_amount,
        delivery_type: trade.delivery_type,
        delivery_address: trade.delivery_address,
        pickup_location: trade.pickup_location,
        delivery_code: trade.delivery_code,
        customer_phone: trade.seller_phone || trade.profiles?.phone || 'Not provided',
        status: trade.status,
        created_at: trade.created_at,
        seller_name: 'Customer',
        buyer_name: 'Merchant'
      }));

      setRequests(deliveryRequests);
      
      console.log('📊 VENDOR DEBUG: Processed delivery requests:', deliveryRequests);
      console.log('📊 VENDOR DEBUG: Previous count:', lastRequestCount, 'New count:', deliveryRequests.length);
      
      // Check for new requests and show popup
      if (deliveryRequests.length > lastRequestCount && lastRequestCount > 0) {
        const newRequest = deliveryRequests[0]; // Most recent request
        console.log('🎉 VENDOR DEBUG: New delivery request detected!', newRequest);
        setPopupRequest(newRequest);
        setShowPopup(true);
        
        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => console.log('Could not play notification sound'));
        } catch (e) {
          console.log('Notification sound not available');
        }
      }
      
      setLastRequestCount(deliveryRequests.length);
    } catch (error) {
      console.error('❌ VENDOR DEBUG: Error loading delivery requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDelivery = async (requestId: string) => {
    // Close popup if accepting from popup
    if (showPopup && popupRequest?.id === requestId) {
      setShowPopup(false);
      setPopupRequest(null);
    }
    setProcessingId(requestId);
    
    const request = requests.find(r => r.id === requestId);
    if (!request) {
      alert('Request not found');
      setProcessingId(null);
      return;
    }

    try {
      // Update status to cash delivered
      await supabase
        .from('cash_trades')
        .update({ 
          status: 'cash_delivered',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // Notify seller that cash has been delivered
      await supabase
        .from('notifications')
        .insert({
          user_id: request.seller_id,
          type: 'cash_delivered',
          title: 'Cash Delivered!',
          message: `Your $${request.usd_amount} USD cash has been delivered. Use code ${request.delivery_code} to confirm receipt.`,
          data: {
            trade_id: request.trade_id,
            delivery_code: request.delivery_code,
            amount_usd: request.usd_amount
          }
        });

      alert('✅ Delivery confirmed! Customer has been notified.');
      loadDeliveryRequests();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert(`Failed to confirm delivery: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Cash Deliveries</h1>
            <p className="text-sm text-gray-600">Manage your delivery requests</p>
          </div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {requests.filter(r => r.status === 'vendor_paid').length} Pending
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery requests</h3>
            <p className="text-gray-500">
              You'll see cash delivery requests here when customers need deliveries in your area.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                      ${request.usd_amount.toLocaleString()} USD Delivery
                    </CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'vendor_paid' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {request.status === 'vendor_paid' ? 'Ready for Delivery' : 'Delivered'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{formatDate(request.created_at)}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Delivery Details */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-blue-800 mb-2">Delivery Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-blue-700">
                          {request.delivery_type === 'delivery' 
                            ? `Deliver to: ${request.delivery_address}` 
                            : `Pickup at: ${request.pickup_location || 'Customer location'}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-blue-700">{request.customer_phone}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-blue-700">Customer: {request.seller_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Code */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h4 className="font-medium text-yellow-800 mb-2">Delivery Code</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono font-bold text-yellow-900">
                        {request.delivery_code}
                      </span>
                      <span className="text-xs text-yellow-700">
                        Customer will provide this code
                      </span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-gray-800 mb-2">Instructions</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Contact customer to arrange {request.delivery_type}</li>
                      <li>• Deliver exactly ${request.usd_amount.toLocaleString()} USD in cash</li>
                      <li>• Get delivery code from customer before handing over cash</li>
                      <li>• Confirm delivery in app after successful handover</li>
                    </ul>
                  </div>

                  {/* Action Button */}
                  {request.status === 'vendor_paid' && (
                    <Button
                      onClick={() => handleAcceptDelivery(request.id)}
                      disabled={processingId === request.id}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processingId === request.id ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Confirming Delivery...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm Cash Delivered
                        </div>
                      )}
                    </Button>
                  )}

                  {request.status === 'cash_delivered' && (
                    <div className="flex items-center justify-center py-2 text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Delivery Completed</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <VendorBottomNavigation />
      
      {/* Delivery Request Popup */}
      {showPopup && popupRequest && (
        <VendorDeliveryPopup
          request={popupRequest}
          onAccept={() => handleAcceptDelivery(popupRequest.id)}
          onClose={() => {
            setShowPopup(false);
            setPopupRequest(null);
          }}
        />
      )}
    </div>
  );
};

export default VendorDashboard;