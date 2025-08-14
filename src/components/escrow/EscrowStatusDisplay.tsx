import React from 'react';
import { CheckCircle, Clock, AlertTriangle, Wallet, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EscrowStatusDisplayProps {
  status: 'pending' | 'crypto_received' | 'cash_sent' | 'completed' | 'disputed';
  amount: number;
  coin: string;
  escrowAddress: string;
  timeRemaining?: number;
  onConfirmCash?: () => void;
  onDispute?: () => void;
}

export const EscrowStatusDisplay: React.FC<EscrowStatusDisplayProps> = ({
  status,
  amount,
  coin,
  escrowAddress,
  timeRemaining,
  onConfirmCash,
  onDispute
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-8 h-8 text-orange-500" />;
      case 'crypto_received':
        return <Wallet className="w-8 h-8 text-blue-500" />;
      case 'cash_sent':
        return <Building2 className="w-8 h-8 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'disputed':
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Waiting for crypto payment';
      case 'crypto_received':
        return 'Crypto secured in escrow';
      case 'cash_sent':
        return 'Cash payment in progress';
      case 'completed':
        return 'Transaction completed';
      case 'disputed':
        return 'Transaction disputed';
      default:
        return 'Processing...';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'pending':
        return 'Send your crypto to the escrow address below';
      case 'crypto_received':
        return 'Your crypto is safely held. Cash sender has been notified.';
      case 'cash_sent':
        return 'Cash sender has initiated the transfer to your bank account';
      case 'completed':
        return 'Crypto has been released to the cash sender';
      case 'disputed':
        return 'This transaction is under review by our support team';
      default:
        return 'Please wait...';
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{getStatusText()}</h3>
            <p className="text-sm text-gray-600">{getStatusDescription()}</p>
          </div>
        </div>
      </Card>

      {/* Progress Steps */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center space-y-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              ['crypto_received', 'cash_sent', 'completed'].includes(status) 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {['crypto_received', 'cash_sent', 'completed'].includes(status) ? '✓' : '1'}
            </div>
            <span className="text-xs text-gray-600">Crypto Sent</span>
          </div>

          <div className={`flex-1 h-0.5 mx-2 ${
            ['cash_sent', 'completed'].includes(status) ? 'bg-green-500' : 'bg-gray-200'
          }`} />

          <div className="flex flex-col items-center space-y-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              ['cash_sent', 'completed'].includes(status)
                ? 'bg-green-500 text-white'
                : status === 'crypto_received' 
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {['cash_sent', 'completed'].includes(status) ? '✓' : '2'}
            </div>
            <span className="text-xs text-gray-600">Cash Sent</span>
          </div>

          <div className={`flex-1 h-0.5 mx-2 ${
            status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
          }`} />

          <div className="flex flex-col items-center space-y-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              status === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {status === 'completed' ? '✓' : '3'}
            </div>
            <span className="text-xs text-gray-600">Released</span>
          </div>
        </div>
      </Card>

      {/* Escrow Details */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Escrow Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount</span>
            <span className="font-medium">{amount} {coin.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className={`font-medium ${
              status === 'completed' ? 'text-green-600' :
              status === 'disputed' ? 'text-red-600' :
              'text-blue-600'
            }`}>
              {getStatusText()}
            </span>
          </div>
          {timeRemaining && timeRemaining > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Time Remaining</span>
              <span className="font-medium text-orange-600">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      {status === 'crypto_received' && (
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={onConfirmCash}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            I Received Cash
          </Button>
          <Button 
            onClick={onDispute}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Report Issue
          </Button>
        </div>
      )}

      {status === 'cash_sent' && (
        <div className="text-center">
          <Button 
            onClick={onConfirmCash}
            className="bg-green-600 hover:bg-green-700 text-white w-full"
          >
            Confirm Cash Received
          </Button>
        </div>
      )}
    </div>
  );
};