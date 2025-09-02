import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Key, MapPin, Phone, Clock, Copy, CheckCircle, Shield, User, Truck } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const CashDeliveryConfirmation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 2 hours in seconds
  
  const {
    deliveryCode,
    cryptoAmount,
    cryptocurrency,
    usdAmount,
    deliveryAddress,
    phoneNumber,
    preferredTime,
    deliveryFee
  } = location.state || {};

  const timeSlots = {
    'morning': '9:00 AM - 12:00 PM',
    'afternoon': '12:00 PM - 4:00 PM',
    'evening': '4:00 PM - 7:00 PM'
  };

  const selectedTime = timeSlots[preferredTime as keyof typeof timeSlots];

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Delivery code copied to clipboard",
    });
  };

  const handleContactAgent = () => {
    window.open(`tel:+2349012345684`);
  };

  const getFullAddress = () => {
    return `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state}${deliveryAddress.landmark ? `, Near ${deliveryAddress.landmark}` : ''}`;
  };

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
                <CheckCircle size={24} className="mr-2 text-green-600" />
                Delivery Confirmed
              </h1>
              <p className="text-gray-600 text-sm">Your cash delivery order is confirmed</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Success Message */}
        <Card className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 border-green-200 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-green-900 mb-2">Delivery Order Confirmed!</h2>
          <p className="text-green-700">Your crypto has been processed and USD cash is being prepared for delivery.</p>
        </Card>

        {/* Delivery Code */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Key size={20} className="mr-2 text-yellow-600" />
            Your Delivery Code
          </h3>
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-900 mb-2 tracking-wider">
              {deliveryCode}
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Show this code to the delivery agent to receive your cash
            </p>
            <Button
              onClick={() => copyToClipboard(deliveryCode)}
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <Copy size={16} className="mr-2" />
              Copy Code
            </Button>
          </div>
        </Card>

        {/* Order Details */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Crypto Sold:</span>
              <span className="font-medium text-gray-900">{cryptoAmount} {cryptocurrency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Fee:</span>
              <span className="font-medium text-gray-900">{deliveryFee}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Cash to Receive:</span>
                <span className="font-bold text-green-600 text-lg">${usdAmount} USD</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Delivery Information */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin size={20} className="mr-2 text-gray-600" />
            Delivery Information
          </h3>
          <div className="space-y-4">
            <div>
              <div className="font-medium text-gray-900">Delivery Address</div>
              <div className="text-sm text-gray-600">{getFullAddress()}</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Clock size={16} className="text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Time: {selectedTime}</span>
              </div>
              <div className="flex items-center">
                <Phone size={16} className="text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Your Phone: {phoneNumber}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Delivery Agent Information */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <User size={20} className="mr-2 text-gray-600" />
            Delivery Agent Information
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium text-gray-900">Agent: Sarah A.</div>
                <div className="text-sm text-gray-600">Verified Premium Delivery Agent</div>
              </div>
              <div className="flex items-center space-x-2">
                <Crown size={12} className="text-yellow-500" />
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">En Route</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Contact:</strong> +234 901 234 5684
              </div>
              <div className="text-sm text-gray-600">
                <strong>Agent ID:</strong> TH-DA-{Math.floor(Math.random() * 1000) + 100}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Vehicle:</strong> Honda CRV - ABC 123 XY
              </div>
            </div>
            <Button
              onClick={handleContactAgent}
              variant="outline"
              size="sm"
              className="w-full mt-3"
            >
              <Phone size={16} className="mr-2" />
              Call Delivery Agent
            </Button>
          </div>
        </Card>

        {/* Status Timeline */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Delivery Status</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle size={14} className="text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Order Confirmed</div>
                <div className="text-sm text-gray-600">Your delivery order has been confirmed</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle size={14} className="text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Cash Prepared</div>
                <div className="text-sm text-gray-600">USD cash has been prepared for delivery</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Agent En Route</div>
                <div className="text-sm text-gray-600">Delivery agent is on the way to your location</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              </div>
              <div>
                <div className="font-medium text-gray-500">Delivered</div>
                <div className="text-sm text-gray-500">Cash will be delivered to your address</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Countdown Timer */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Estimated Delivery Time</h4>
              <p className="text-sm text-blue-700">Your cash will be delivered within this time</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{formatTime(timeLeft)}</div>
              <div className="text-sm text-blue-600">remaining</div>
            </div>
          </div>
        </Card>

        {/* Delivery Instructions */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <Truck size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Delivery Instructions</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Agent will call you 30 minutes before arrival</li>
                <li>• Be available at the delivery address during your selected time</li>
                <li>• Have your delivery code ready to show the agent</li>
                <li>• Bring a valid ID for verification</li>
                <li>• Count the cash before the agent leaves</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Important Security Notice */}
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <Shield size={20} className="text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Security Notice</h4>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• Only share your delivery code with the verified agent</li>
                <li>• Verify agent's ID and vehicle details before handover</li>
                <li>• Agent will never ask for additional payments</li>
                <li>• Contact support immediately if anything seems suspicious</li>
                <li>• All deliveries are tracked and recorded for security</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/premium-trades')}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Crown size={16} className="mr-2" />
            View My Premium Trades
          </Button>
          <Button
            onClick={() => navigate('/premium-support')}
            variant="outline"
            className="w-full"
          >
            Contact Premium Support
          </Button>
        </div>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default CashDeliveryConfirmation;
