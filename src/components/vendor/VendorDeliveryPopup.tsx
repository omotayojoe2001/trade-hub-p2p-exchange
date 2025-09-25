import React from 'react';
import { DollarSign, MapPin, Phone, User, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeliveryRequest {
  id: string;
  usd_amount: number;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string;
  pickup_location?: string;
  delivery_code: string;
  customer_phone?: string;
  seller_name?: string;
  created_at: string;
}

interface VendorDeliveryPopupProps {
  request: DeliveryRequest;
  onAccept: () => void;
  onClose: () => void;
}

const VendorDeliveryPopup: React.FC<VendorDeliveryPopupProps> = ({
  request,
  onAccept,
  onClose
}) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-pulse-scale">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 rounded-t-lg relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-white hover:bg-green-700 rounded-full p-1"
          >
            <X size={20} />
          </button>
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-xl font-bold">NEW CASH DELIVERY!</h2>
              <p className="text-green-100">Payment received - Action required</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Amount */}
          <div className="text-center bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">Deliver Cash Amount:</p>
            <p className="text-3xl font-bold text-green-800">
              ${request.usd_amount.toLocaleString()} USD
            </p>
            <p className="text-xs text-green-600">
              Received at {formatTime(request.created_at)}
            </p>
          </div>

          {/* Customer Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-3">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <User className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-blue-700">{request.seller_name || 'Customer'}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-blue-700">{request.customer_phone}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-blue-700">
                  {request.delivery_type === 'delivery' 
                    ? `Deliver to: ${request.delivery_address}` 
                    : `Pickup at: ${request.pickup_location || 'Customer location'}`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Code */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-700 mb-1">Delivery Code:</p>
            <p className="text-2xl font-mono font-bold text-yellow-900">
              {request.delivery_code}
            </p>
            <p className="text-xs text-yellow-600">Customer will provide this code</p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Quick Instructions:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Contact customer immediately</li>
              <li>• Arrange {request.delivery_type} time</li>
              <li>• Get delivery code before handing cash</li>
              <li>• Deliver exactly ${request.usd_amount.toLocaleString()} USD</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              View Later
            </Button>
            <Button
              onClick={onAccept}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Accept Delivery
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse-scale {
          animation: pulse-scale 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default VendorDeliveryPopup;