import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Clock, Star, User } from 'lucide-react';

interface TradeRequest {
  id: string;
  merchant: string;
  rating: number;
  coin: string;
  amount: string;
  rate: string;
  timeLeft: string;
  paymentMethods: string[];
}

interface TradeRequestCardProps {
  request: TradeRequest;
  onAccept: (id: string) => void;
}

export const TradeRequestCard: React.FC<TradeRequestCardProps> = ({
  request,
  onAccept
}) => {
  return (
    <Card className="p-4 border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center mr-3">
            <User size={16} className="text-foreground/60" />
          </div>
          <div>
            <h4 className="font-medium text-foreground text-sm">{request.merchant}</h4>
            <div className="flex items-center">
              <Star size={12} className="text-brand mr-1" />
              <span className="text-xs text-muted-foreground">{request.rating}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-brand text-xs">
            <Clock size={12} className="mr-1" />
            <span>{request.timeLeft}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-muted-foreground text-xs">Buying</p>
          <p className="font-semibold text-foreground text-sm">{request.amount} {request.coin}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Rate</p>
          <p className="font-semibold text-foreground text-sm">{request.rate}</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-muted-foreground text-xs mb-1">Payment Methods</p>
        <div className="flex flex-wrap gap-1">
          {request.paymentMethods.map((method, index) => (
            <span key={index} className="bg-secondary text-foreground px-2 py-1 text-xs rounded">
              {method}
            </span>
          ))}
        </div>
      </div>

      <Button 
        onClick={() => onAccept(request.id)}
        className="w-full bg-brand hover:bg-brand/90 text-white py-2 text-sm"
      >
        Accept Trade
        <ArrowRight size={14} className="ml-2" />
      </Button>
    </Card>
  );
};