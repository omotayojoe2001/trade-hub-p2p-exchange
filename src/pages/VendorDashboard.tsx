import React, { useState, useEffect } from 'react';
import { DollarSign, Package, TrendingUp, Clock, CheckCircle, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import VendorBottomNavigation from '@/components/vendor/VendorBottomNavigation';
import { cashOrderService } from '@/services/cashOrderService';
import { exchangeRateService } from '@/services/exchangeRateService';




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
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CashDeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    todayDeliveries: 0
  });
  const [usdToNgnRate, setUsdToNgnRate] = useState(1650);

  useEffect(() => {
    const storedVendorId = localStorage.getItem('vendor_id');
    if (storedVendorId) {
      setVendorId(storedVendorId);
    }
    loadExchangeRate();
    loadDeliveryRequests();
  }, []);

  const loadExchangeRate = async () => {
    try {
      const rate = await exchangeRateService.getUSDToNGNRate();
      setUsdToNgnRate(Math.round(rate));
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    }
  };

  const loadDeliveryRequests = async () => {
    try {
      setLoading(true);
      const vendorId = localStorage.getItem('vendor_id');
      
      console.log('Loading requests for vendor:', vendorId);
      console.log('Only showing requests with status: vendor_paid, payment_confirmed, delivery_in_progress, cash_delivered');
      
      if (!vendorId) {
        console.log('No vendor ID found');
        return;
      }

      const { data: cashTrades, error } = await supabase
        .from('cash_trades')
        .select('*')
        .eq('vendor_id', vendorId)
        .in('status', ['vendor_paid', 'payment_confirmed', 'delivery_in_progress', 'cash_delivered'])
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('Cash trades result:', { cashTrades, error });

      if (error) throw error;

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
        customer_phone: trade.seller_phone || 'Not provided',
        status: trade.status,
        created_at: trade.created_at,
        seller_name: trade.merchant_name === 'Send Naira Customer' ? 'Send Naira Customer' : 'Customer',
        buyer_name: trade.merchant_name || 'Merchant'
      }));

      console.log('Processed requests:', deliveryRequests);
      setRequests(deliveryRequests);
      
      // Calculate stats
      const completed = deliveryRequests.filter(r => r.status === 'cash_delivered').length;
      const pending = deliveryRequests.filter(r => ['vendor_paid', 'payment_confirmed', 'delivery_in_progress'].includes(r.status)).length;
      const today = deliveryRequests.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;
      const earnings = deliveryRequests
        .filter(r => r.status === 'cash_delivered')
        .reduce((sum, r) => sum + (r.usd_amount * 50), 0); // Assume 50 NGN per USD delivery fee
      
      setStats({
        totalEarnings: earnings,
        completedDeliveries: completed,
        pendingDeliveries: pending,
        todayDeliveries: today
      });
    } catch (error) {
      console.error('Error loading delivery requests:', error);
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-white flex items-center justify-center pb-20">
        <div className="text-center">
          <p className="text-black">Loading delivery requests...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-black text-white p-6">
        <h1 className="text-2xl font-bold mb-2 text-white">Vendor Dashboard</h1>
        <p className="text-gray-300">Manage your cash delivery operations</p>
      </div>
      
      {/* Stats Cards */}
      <div className="p-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Earnings</p>
                  <p className="text-lg font-bold text-black">NGN {stats.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-black" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-lg font-bold text-black">{stats.completedDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-lg font-bold text-black">{stats.pendingDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-lg font-bold text-black">{stats.todayDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Delivery Requests Section */}
      <div className="px-4">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-black">
              <Package className="w-5 h-5 mr-2 text-black" />
              Recent Delivery Requests
            </CardTitle>
          </CardHeader>
            <CardContent>

            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">No delivery requests</h3>
                <p className="text-gray-500">
                  You'll see cash delivery requests here when customers need deliveries in your area.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 10).map((request) => {
                  const getCardBgColor = (status: string) => {
                    switch (status) {
                      case 'vendor_paid':
                        return 'bg-orange-50 border-l-4 border-l-orange-400';
                      case 'payment_confirmed':
                        return 'bg-gray-50 border-l-4 border-l-gray-400';
                      case 'delivery_in_progress':
                        return 'bg-purple-50 border-l-4 border-l-purple-400';
                      case 'cash_delivered':
                        return 'bg-green-50 border-l-4 border-l-green-400';
                      default:
                        return 'bg-gray-50 border-l-4 border-l-gray-400';
                    }
                  };
                  
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'vendor_paid':
                        return 'bg-orange-100 text-orange-800';
                      case 'payment_confirmed':
                        return 'bg-gray-100 text-gray-800';
                      case 'delivery_in_progress':
                        return 'bg-purple-100 text-purple-800';
                      case 'cash_delivered':
                        return 'bg-green-100 text-green-800';
                      default:
                        return 'bg-gray-100 text-gray-800';
                    }
                  };
                  
                  return (
                    <div key={request.id} className={`${getCardBgColor(request.status)} p-4 rounded-lg cursor-pointer transition-shadow`} onClick={() => window.location.href = `/vendor/payment-confirmation/${request.id}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="p-2 bg-white rounded-lg mr-3">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-lg text-black">NGN {(request.usd_amount * usdToNgnRate).toLocaleString()}</p>
                            <p className="text-sm text-gray-600">From: {request.buyer_name || 'Merchant'}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{formatDate(request.created_at)}</span>
                        <span className="text-black font-medium">View Details →</span>
                      </div>
                    </div>
                  );
                })}
                
                {requests.length > 10 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-500 mb-2">Showing 10 of {requests.length} requests</p>
                    <Button
                      onClick={() => navigate('/vendor/transactions')}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        border: 'none',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#000000'}
                    >
                      View All Transactions
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <VendorBottomNavigation />
      </div>
  );
};

export default VendorDashboard;