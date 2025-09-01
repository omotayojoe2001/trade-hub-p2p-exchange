import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Copy, Clock, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import QRCodeLib from 'qrcode';

interface TradeData {
  id: string;
  amount: string;
  coin: string;
  nairaAmount: string;
  total: string;
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  type: 'buy' | 'sell';
  walletAddress?: string;
  paymentStage?: number;
  progress?: number;
  merchant: {
    name: string;
    rating: number;
    trades: number;
    phone: string;
    bankAccount: string;
  };
}

interface TradeTemplateProps {
  tradeData: TradeData;
  title: string;
  backUrl?: string;
  showPaymentProgress?: boolean;
  showQRCode?: boolean;
  children?: React.ReactNode;
  onActionClick?: () => void;
  actionButtonText?: string;
  actionButtonDisabled?: boolean;
}

export const TradeTemplate: React.FC<TradeTemplateProps> = ({
  tradeData,
  title,
  backUrl = '/my-trades',
  showPaymentProgress = false,
  showQRCode = false,
  children,
  onActionClick,
  actionButtonText,
  actionButtonDisabled = false
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generate QR code for wallet address
  useEffect(() => {
    if (showQRCode && tradeData.walletAddress) {
      QRCodeLib.toDataURL(tradeData.walletAddress)
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation failed', err));
    }
  }, [showQRCode, tradeData.walletAddress]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPaymentStageInfo = (stage: number) => {
    const stages = [
      { title: 'Request Sent', description: 'Trade request initiated' },
      { title: 'Payment Sent', description: 'Waiting for payment confirmation' },
      { title: 'Confirming', description: 'Payment being verified' },
      { title: 'Completed', description: 'Trade successfully completed' }
    ];
    return stages[stage - 1] || stages[0];
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Link to={backUrl}>
              <ArrowLeft size={24} className="text-gray-700 mr-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">{tradeData.id}</p>
            </div>
          </div>
          <MoreVertical size={24} className="text-gray-700" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Transaction Summary Card */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="text-center pb-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">{tradeData.amount}</h2>
              <p className="text-lg text-gray-600">@ {tradeData.nairaAmount} per {tradeData.coin}</p>
              <p className="text-2xl font-semibold text-gray-900">Total: {tradeData.total}</p>
              <Badge className={`${getStatusColor(tradeData.status)} border`}>
                {tradeData.status.charAt(0).toUpperCase() + tradeData.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Payment Progress - Show for pending transactions */}
        {showPaymentProgress && tradeData.status === 'pending' && tradeData.paymentStage && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Payment Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                {/* Step 1: Request Sent */}
                <div className="flex items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    tradeData.paymentStage >= 1 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {tradeData.paymentStage >= 1 ? '✓' : '1'}
                  </div>
                  <div className="text-center min-w-0">
                    <p className={`text-sm font-medium ${tradeData.paymentStage >= 1 ? 'text-green-600' : 'text-gray-500'}`}>Request</p>
                    <p className={`text-xs ${tradeData.paymentStage >= 1 ? 'text-green-600' : 'text-gray-500'}`}>Sent</p>
                  </div>
                </div>

                <div className={`flex-1 h-1 mx-3 rounded ${tradeData.paymentStage >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>

                {/* Step 2: Payment Sent */}
                <div className="flex items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    tradeData.paymentStage >= 2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {tradeData.paymentStage >= 2 ? '✓' : '2'}
                  </div>
                  <div className="text-center min-w-0">
                    <p className={`text-sm font-medium ${tradeData.paymentStage >= 2 ? 'text-green-600' : 'text-gray-500'}`}>Payment</p>
                    <p className={`text-xs ${tradeData.paymentStage >= 2 ? 'text-green-600' : 'text-gray-500'}`}>Sent</p>
                  </div>
                </div>

                <div className={`flex-1 h-1 mx-3 rounded ${tradeData.paymentStage >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}></div>

                {/* Step 3: Confirming */}
                <div className="flex items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    tradeData.paymentStage >= 3 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {tradeData.paymentStage >= 3 ? '✓' : '3'}
                  </div>
                  <div className="text-center min-w-0">
                    <p className={`text-sm font-medium ${tradeData.paymentStage >= 3 ? 'text-green-600' : 'text-gray-500'}`}>Confirming</p>
                    <p className={`text-xs ${tradeData.paymentStage >= 3 ? 'text-green-600' : 'text-gray-500'}`}>Payment</p>
                  </div>
                </div>

                <div className={`flex-1 h-1 mx-3 rounded ${tradeData.paymentStage >= 4 ? 'bg-green-500' : 'bg-gray-300'}`}></div>

                {/* Step 4: Completed */}
                <div className="flex items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tradeData.paymentStage >= 4 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {tradeData.paymentStage >= 4 ? '✓' : '4'}
                  </div>
                  <div className="text-center min-w-0">
                    <p className={`text-sm font-medium ${tradeData.paymentStage >= 4 ? 'text-green-600' : 'text-gray-500'}`}>Completed</p>
                  </div>
                </div>
              </div>

              {/* Current Stage Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">{getPaymentStageInfo(tradeData.paymentStage).title}</h4>
                    <p className="text-sm text-blue-800">{getPaymentStageInfo(tradeData.paymentStage).description}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Code Section */}
        {showQRCode && tradeData.walletAddress && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="bg-gray-50 rounded-xl p-6 text-center mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Send {tradeData.coin} to this address</h4>
                
                {qrDataUrl ? (
                  <div className="flex flex-col items-center">
                    <img src={qrDataUrl} alt={`${tradeData.coin} wallet QR`} className="w-48 h-48 border-2 border-white rounded-lg shadow-sm mb-4" />
                    <p className="text-sm text-gray-600 mb-4">Scan to send {tradeData.coin}</p>
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                  </div>
                )}
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Wallet Address</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(tradeData.walletAddress!, 'Wallet address')}
                      className="text-blue-600 p-1 h-auto"
                    >
                      <Copy size={14} className="mr-1" /> Copy
                    </Button>
                  </div>
                  <p className="font-mono text-sm break-all text-gray-900 bg-gray-50 p-2 rounded">{tradeData.walletAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Content */}
        {children}

        {/* Security Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Secure Transaction</h4>
                <p className="text-sm text-blue-800">
                  Your crypto is securely held in escrow. It will be released only when payment is confirmed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {actionButtonText && onActionClick && (
          <Button 
            onClick={onActionClick}
            disabled={actionButtonDisabled}
            className="w-full py-3 rounded-lg"
          >
            {actionButtonText}
          </Button>
        )}
      </div>
    </div>
  );
};
