import React from 'react';
import { Clock, User, Shield, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface TradeRequest {
  id: string;
  type: 'buy' | 'sell';
  amount: string;
  coin: string;
  nairaAmount: number;
  rate: number;
  merchantName: string;
  merchantRating: number;
  timeAgo: string;
  paymentMethod: string;
  status: 'pending' | 'active' | 'expired';
}

interface TradeRequestCardProps {
  request: TradeRequest;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

const TradeRequestCard = ({ request, onAccept, onDecline }: TradeRequestCardProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate('/trade-request-details', { state: { request } });
  };

  const getStatusColor = () => {
    switch (request.status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = () => {
    return request.type === 'buy' ? 'text-blue-600' : 'text-green-600';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className={`w-8 h-8 ${request.type === 'buy' ? 'bg-blue-100' : 'bg-green-100'} rounded-full flex items-center justify-center mr-3`}>
            <span className={`text-sm font-semibold ${getTypeColor()}`}>
              {request.type === 'buy' ? 'B' : 'S'}
            </span>
          </div>
          <div>
            <h3 className={`font-semibold ${getTypeColor()}`}>
              {request.type === 'buy' ? 'Crypto to Cash' : 'Cash to Crypto'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {request.type === 'buy' ? 'User wants cash, will send crypto' : 'User wants crypto, will send cash'}
            </p>
            <div className="flex items-center text-xs text-gray-500">
              <Clock size={12} className="mr-1" />
              <span>{request.timeAgo}</span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      {/* Trade Details */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">Amount</p>
            <p className="font-semibold text-gray-900">{request.amount} {request.coin}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Value</p>
            <p className="font-semibold text-gray-900">₦{request.nairaAmount.toLocaleString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Rate</p>
            <p className="text-sm text-gray-700">₦{request.rate.toLocaleString()}/{request.coin}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Payment</p>
            <p className="text-sm text-gray-700">{request.paymentMethod}</p>
          </div>
        </div>
      </div>

      {/* Merchant Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
            <User size={16} className="text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{request.merchantName}</p>
            <div className="flex items-center text-xs text-gray-500">
              <Shield size={10} className="mr-1" />
              <span>{request.merchantRating}/5 rating</span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleViewDetails}
          variant="outline"
          size="sm"
          className="text-brand hover:text-brand-foreground hover:bg-brand"
        >
          View Details
          <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>

      {/* Action Buttons - Only show view details for pending */}
      {request.status === 'pending' && (
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground mb-2">View trade details to accept or decline</p>
        </div>
      )}

      {request.status === 'active' && (
        <Button
          onClick={handleViewDetails}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          Continue Trade
        </Button>
      )}

      {request.status === 'expired' && (
        <div className="text-center py-2">
          <p className="text-sm text-red-600 font-medium">This request has expired</p>
        </div>
      )}
    </div>
  );
};

export default TradeRequestCard;