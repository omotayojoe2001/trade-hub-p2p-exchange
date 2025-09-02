import React from 'react';
import { ArrowLeft, Crown, MapPin, Clock, CheckCircle, Truck, Phone, Copy } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const DeliveryStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const {
    tradeId,
    type,
    code,
    expectedDate,
    status,
    amount,
    crypto
  } = location.state || {};

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: "Tracking code copied to clipboard",
    });
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return { text: 'Order Received', color: 'yellow', icon: Clock };
      case 'agent_assigned':
        return { text: 'Agent Assigned', color: 'blue', icon: Truck };
      case 'in_transit':
        return { text: 'On The Way', color: 'purple', icon: MapPin };
      case 'delivered':
        return { text: 'Delivered', color: 'green', icon: CheckCircle };
      default:
        return { text: 'Processing', color: 'gray', icon: Clock };
    }
  };

  const statusInfo = getStatusDisplay();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-trades" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Truck size={24} className="mr-2 text-yellow-600" />
                {type === 'cash_delivery' ? 'Cash Delivery' : 'Cash Pickup'} Status
              </h1>
              <p className="text-gray-600 text-sm">Track your order progress</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Status */}
        <Card className="p-6 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full bg-${statusInfo.color}-500 flex items-center justify-center`}>
              <StatusIcon size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{statusInfo.text}</h2>
              <p className="text-gray-700">
                {type === 'cash_delivery' ? 'Your cash is being delivered' : 'Your cash is ready for pickup'}
              </p>
            </div>
          </div>
        </Card>

        {/* Tracking Code */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Tracking Code</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900 tracking-wider">{code}</div>
                <div className="text-sm text-gray-600">Show this code to collect your cash</div>
              </div>
              <Button
                onClick={copyCode}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <Copy size={16} className="mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </Card>

        {/* Order Details */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Trade ID:</span>
              <span className="font-medium">{tradeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cryptocurrency:</span>
              <span className="font-medium">{crypto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cash Amount:</span>
              <span className="font-medium">{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expected {type === 'cash_delivery' ? 'Delivery' : 'Pickup'}:</span>
              <span className="font-medium">
                {new Date(expectedDate).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Progress Timeline */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Progress Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-gray-900">Order Received</div>
                <div className="text-sm text-gray-600">Your order has been confirmed</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                ['agent_assigned', 'in_transit', 'delivered'].includes(status) 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}></div>
              <div>
                <div className="font-medium text-gray-900">Agent Assigned</div>
                <div className="text-sm text-gray-600">Premium agent assigned to your order</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                ['in_transit', 'delivered'].includes(status) 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}></div>
              <div>
                <div className="font-medium text-gray-900">
                  {type === 'cash_delivery' ? 'Out for Delivery' : 'Ready for Pickup'}
                </div>
                <div className="text-sm text-gray-600">
                  {type === 'cash_delivery' 
                    ? 'Agent is on the way to your location' 
                    : 'Your cash is ready at the pickup location'
                  }
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div>
                <div className="font-medium text-gray-900">
                  {type === 'cash_delivery' ? 'Delivered' : 'Collected'}
                </div>
                <div className="text-sm text-gray-600">Cash successfully transferred</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Support */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Phone size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Need Help?</h4>
              <p className="text-sm text-blue-700 mt-1">
                Contact our premium support team if you have any questions about your order.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/premium-trades')}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Crown size={16} className="mr-2" />
            Back to My Trades
          </Button>
          
          {status === 'delivered' && (
            <Button
              onClick={() => navigate('/receipt-page', {
                state: {
                  tradeId,
                  type: 'cash_delivery',
                  amount,
                  crypto,
                  completedAt: new Date().toISOString()
                }
              })}
              variant="outline"
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              Download Receipt
            </Button>
          )}
        </div>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default DeliveryStatus;
