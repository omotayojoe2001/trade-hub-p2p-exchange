import React, { useState } from 'react';
import { ArrowLeft, Crown, MapPin, Clock, CheckCircle, Truck, Phone, Copy, Search, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { deliveryTrackingService } from '@/services/supabaseService';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const DeliveryTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // No mock data - only real tracking codes from database

  const handleTrackOrder = async () => {
    if (!trackingCode) return;

    try {
      setLoading(true);

      // Try to get real tracking data from Supabase
      const result = await deliveryTrackingService.getTrackingByCode(trackingCode);

      // Transform the data for display
      const transformedResult = {
        code: result.tracking_code,
        type: result.delivery_type === 'cash_delivery' ? 'Cash Delivery' : 'Cash Pickup',
        amount: `${result.currency === 'NGN' ? '₦' : '$'}${result.amount.toLocaleString()}`,
        crypto: result.crypto_type,
        status: result.status,
        agentName: result.agent_name || 'Agent Pending',
        agentPhone: result.agent_phone || 'N/A',
        estimatedArrival: 'TBD',
        currentLocation: result.current_location || 'Processing',
        timeline: result.timeline || []
      };

      setTrackingResult(transformedResult);

    } catch (error) {
      console.error('Error fetching tracking data:', error);
      toast({
        title: "Code Not Found",
        description: "Please check your tracking code and try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: "Tracking code copied to clipboard",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'ready':
        return 'blue';
      case 'in_transit':
        return 'purple';
      case 'delivered':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Processing';
      case 'ready':
        return 'Ready for Pickup';
      case 'in_transit':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-notifications" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Truck size={24} className="mr-2 text-yellow-600" />
                Delivery Tracking
              </h1>
              <p className="text-gray-600 text-sm">Track your cash delivery or pickup</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Tracking Input */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Enter Tracking Code</h3>
          <div className="flex space-x-3">
            <Input
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              placeholder="TD-2024-XXXX or TP-2024-XXXX"
              className="border-yellow-200 focus:border-yellow-400"
            />
            <Button
              onClick={handleTrackOrder}
              disabled={loading || !trackingCode}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Search size={16} className="mr-2" />
              )}
              {loading ? 'Tracking...' : 'Track'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Enter your delivery (TD-) or pickup (TP-) tracking code to see real-time status
          </p>
        </Card>

        {/* Sample Codes for Demo */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Demo Tracking Codes</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">TD-2024-5678 (Delivery)</span>
              <Button
                onClick={() => setTrackingCode('TD-2024-5678')}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700"
              >
                Use Code
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">TP-2024-9012 (Pickup)</span>
              <Button
                onClick={() => setTrackingCode('TP-2024-9012')}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700"
              >
                Use Code
              </Button>
            </div>
          </div>
        </Card>

        {/* Tracking Results */}
        {trackingResult && (
          <>
            {/* Status Overview */}
            <Card className={`p-4 bg-gradient-to-r from-${getStatusColor(trackingResult.status)}-100 to-${getStatusColor(trackingResult.status)}-200 border-${getStatusColor(trackingResult.status)}-300`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{getStatusText(trackingResult.status)}</h3>
                  <p className="text-gray-700">{trackingResult.type}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{trackingResult.amount}</div>
                  <div className="text-sm text-gray-600">{trackingResult.crypto}</div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tracking Code:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold">{trackingResult.code}</span>
                    <Button
                      onClick={() => copyCode(trackingResult.code)}
                      variant="ghost"
                      size="sm"
                      className="p-1"
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Agent Information */}
            <Card className="p-4 bg-white border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Agent Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Agent Name:</span>
                  <span className="font-medium">{trackingResult.agentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Contact:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{trackingResult.agentPhone}</span>
                    <Button variant="ghost" size="sm" className="p-1">
                      <Phone size={14} className="text-green-600" />
                    </Button>
                  </div>
                </div>
                {trackingResult.estimatedArrival && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Estimated Arrival:</span>
                    <span className="font-medium text-green-600">{trackingResult.estimatedArrival}</span>
                  </div>
                )}
                {trackingResult.currentLocation && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Current Location:</span>
                    <span className="font-medium">{trackingResult.currentLocation}</span>
                  </div>
                )}
                {trackingResult.pickupLocation && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pickup Location:</span>
                    <span className="font-medium">{trackingResult.pickupLocation}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-4 bg-white border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Order Timeline</h3>
              <div className="space-y-4">
                {trackingResult.timeline.map((step: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      step.completed 
                        ? step.current 
                          ? 'bg-blue-500 animate-pulse' 
                          : 'bg-green-500'
                        : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        step.current ? 'text-blue-900' : step.completed ? 'text-green-900' : 'text-gray-500'
                      }`}>
                        {step.step}
                      </div>
                      <div className="text-sm text-gray-600">{step.time}</div>
                    </div>
                    {step.current && (
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Current
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/premium-support')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <Phone size={16} className="mr-2" />
                Contact Agent
              </Button>
              
              <Button
                onClick={() => navigate('/premium-trades')}
                variant="outline"
                className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                View All Trades
              </Button>
            </div>
          </>
        )}
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default DeliveryTracking;
