import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Star, Clock, ArrowRight, ArrowUpDown, Banknote, Coins } from 'lucide-react';
import CryptoIcon from '@/components/CryptoIcon';

interface TradeRequest {
  id: string;
  merchant: string;
  rating: number;
  coin: string;
  amount: string;
  rate: string;
  nairaAmount: string;
  timeLeft: string;
  paymentMethods: string[];
  type: 'buy' | 'sell';
  direction: string;
}

interface TradeRequestCardProps {
  request: TradeRequest;
  onAccept: (id: string) => void;
}

export const TradeRequestCard: React.FC<TradeRequestCardProps> = ({
  request,
  onAccept
}) => {
  const isUserBuyingCrypto = request.type === 'buy';
  const merchantAction = isUserBuyingCrypto ? 'Send Crypto' : 'Send Cash';
  const userAction = isUserBuyingCrypto ? 'Send Cash' : 'Send Crypto';

  return (
    <Card className="p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onAccept(request.id)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <ArrowUpDown size={16} className="text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 text-sm">{request.merchant}</h4>
            <div className="flex items-center">
              <Star size={12} className="text-yellow-400 mr-1" />
              <span className="text-xs text-gray-500">{request.rating}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-orange-600 text-xs">
            <Clock size={12} className="mr-1" />
            <span>{request.timeLeft}</span>
          </div>
        </div>
      </div>

      {/* Trade Direction */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
        <div className="flex items-center mb-2">
          <ArrowUpDown size={16} className="text-blue-600 mr-2" />
          <span className="font-semibold text-blue-800 text-sm">{request.direction}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-gray-500 text-xs mb-1">Amount</p>
          <div className="flex items-center">
            <CryptoIcon symbol={request.coin} size={16} className="mr-1" />
            <p className="font-semibold text-gray-900 text-sm">{request.amount} {request.coin}</p>
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Rate</p>
          <p className="font-semibold text-gray-900 text-sm">{request.rate}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Total Value</p>
          <p className="font-semibold text-gray-900 text-sm">{request.nairaAmount}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Payment Methods</p>
          <p className="font-semibold text-gray-900 text-sm">{request.paymentMethods.length}</p>
        </div>
      </div>

      {/* Action Required */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isUserBuyingCrypto ? (
              <Coins size={16} className="text-yellow-600 mr-2" />
            ) : (
              <Banknote size={16} className="text-yellow-600 mr-2" />
            )}
            <span className="text-sm font-semibold text-yellow-800">
              You need to: {merchantAction}
            </span>
          </div>
        </div>
        <p className="text-xs text-yellow-700 mt-1">
          User will: {userAction}
        </p>
      </div>

      <Button 
        onClick={(e) => {
          e.stopPropagation();
          onAccept(request.id);
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm"
      >
        Review & Accept
        <ArrowRight size={14} className="ml-2" />
      </Button>
    </Card>
  );
};