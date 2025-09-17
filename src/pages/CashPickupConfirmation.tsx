import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Key, MapPin, Phone, Clock, Copy, CheckCircle, Shield, User } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '@/components/BottomNavigation';

const CashPickupConfirmation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes in seconds
  
  const {
    pickupCode,
    cryptoAmount,
    cryptocurrency,
    usdAmount,
    pickupLocation,
    phoneNumber,
    preferredTime,
    platformFee
  } = location.state || {};

  const pickupLocations = {
    'victoria_island': { name: 'Victoria Island', address: 'Tiamiyu Savage Street, VI', contact: '+234 901 234 5678' },
    'ikeja': { name: 'Ikeja', address: 'Allen Avenue, Ikeja', contact: '+234 901 234 5679' },
    'lekki': { name: 'Lekki Phase 1', address: 'Admiralty Way, Lekki', contact: '+234 901 234 5680' },
    'surulere': { name: 'Surulere', address: 'Adeniran Ogunsanya Street', contact: '+234 901 234 5681' },
    'mainland': { name: 'Lagos Mainland', address: 'Herbert Macaulay Way', contact: '+234 901 234 5682' },
    'abuja_central': { name: 'Abuja Central', address: 'Wuse 2 District', contact: '+234 901 234 5683' }
  };

  const timeSlots = {
    'morning': '9:00 AM - 12:00 PM',
    'afternoon': '12:00 PM - 4:00 PM',
    'evening': '4:00 PM - 7:00 PM'
  };

  const selectedLocation = pickupLocations[pickupLocation as keyof typeof pickupLocations];
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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Pickup code copied to clipboard",
    });
  };

  const handleContactAgent = () => {
    if (selectedLocation?.contact) {
      window.open(`tel:${selectedLocation.contact}`);
    }
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
                Pickup Confirmed
              </h1>
              <p className="text-gray-600 text-sm">Your cash pickup order is confirmed</p>
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
            <CheckCircle size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-green-900 mb-2">Pickup Order Confirmed!</h2>
          <p className="text-green-700">Your crypto has been processed and USD cash is being prepared for pickup.</p>
        </Card>

        {/* Pickup Code */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Key size={20} className="mr-2 text-yellow-600" />
            Your Pickup Code
          </h3>
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-900 mb-2 tracking-wider">
              {pickupCode}
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Show this code to the agent to receive your cash
            </p>
            <Button
              onClick={() => copyToClipboard(pickupCode)}
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
              <span className="text-gray-600">Platform Fee:</span>
              <span className="font-medium text-gray-900">{platformFee}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Cash to Receive:</span>
                <span className="font-bold text-green-600 text-lg">${usdAmount} USD</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pickup Information */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin size={20} className="mr-2 text-gray-600" />
            Pickup Information
          </h3>
          <div className="space-y-4">
            <div>
              <div className="font-medium text-gray-900">{selectedLocation?.name}</div>
              <div className="text-sm text-gray-600">{selectedLocation?.address}</div>
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

        {/* Agent Information */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <User size={20} className="mr-2 text-gray-600" />
            Agent Information
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium text-gray-900">Agent: Michael O.</div>
                <div className="text-sm text-gray-600">Verified Premium Agent</div>
              </div>
              <div className="flex items-center space-x-2">
                <Crown size={12} className="text-yellow-500" />
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Online</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Contact:</strong> {selectedLocation?.contact}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Agent ID:</strong> TH-AG-{Math.floor(Math.random() * 1000) + 100}
              </div>
            </div>
            <Button
              onClick={handleContactAgent}
              variant="outline"
              size="sm"
              className="w-full mt-3"
            >
              <Phone size={16} className="mr-2" />
              Call Agent
            </Button>
          </div>
        </Card>

        {/* Status Timeline */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Status Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle size={14} className="text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Order Confirmed</div>
                <div className="text-sm text-gray-600">Your pickup order has been confirmed</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Cash Being Prepared</div>
                <div className="text-sm text-gray-600">Agent is preparing your USD cash</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              </div>
              <div>
                <div className="font-medium text-gray-500">Ready for Pickup</div>
                <div className="text-sm text-gray-500">Agent will notify you when ready</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Countdown Timer */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Estimated Preparation Time</h4>
              <p className="text-sm text-blue-700">Your cash will be ready within this time</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{formatTime(timeLeft)}</div>
              <div className="text-sm text-blue-600">remaining</div>
            </div>
          </div>
        </Card>

        {/* Important Instructions */}
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <Shield size={20} className="text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Important Instructions</h4>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• Bring a valid ID for verification</li>
                <li>• Only share your pickup code with the verified agent</li>
                <li>• Agent will verify your phone number before handover</li>
                <li>• Count the cash before leaving the pickup location</li>
                <li>• Contact support if you encounter any issues</li>
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

      <BottomNavigation />
    </div>
  );
};

export default CashPickupConfirmation;
