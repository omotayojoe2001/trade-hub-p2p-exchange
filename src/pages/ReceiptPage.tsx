import React from 'react';
import { ArrowLeft, Crown, Download, Share, CheckCircle, Calendar, DollarSign, Building } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '@/components/BottomNavigation';

const ReceiptPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const {
    tradeId,
    type,
    amount,
    crypto,
    completedAt,
    bankDetails,
    receiptData // Legacy support
  } = location.state || {};

  // Legacy support
  if (receiptData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Receipt Available</h2>
          <p className="text-muted-foreground mb-4">Your receipt is ready for download.</p>
          <Button onClick={() => navigate('/premium-trades')}>
            Back to Trades
          </Button>
        </div>
      </div>
    );
  }

  const downloadReceipt = () => {
    // Create a simple receipt content
    const receiptContent = `
PREMIUM TRADE RECEIPT
=====================

Trade ID: ${tradeId}
Type: ${type === 'bank_transfer' ? 'Bank Transfer' : 'Cash Transaction'}
Cryptocurrency: ${crypto}
Amount: ${amount}
Completed: ${new Date(completedAt).toLocaleString()}

${bankDetails ? `
Bank Details:
Bank: ${bankDetails.bankName}
Account: ${bankDetails.accountNumber}
Name: ${bankDetails.accountName}
` : ''}

Thank you for using our premium service!
    `;

    // Create and download file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${tradeId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Your receipt has been downloaded successfully",
    });
  };

  const shareReceipt = () => {
    const receiptText = `Premium Trade Receipt - ID: ${tradeId}, ${crypto} ${amount}, Completed: ${new Date(completedAt).toLocaleDateString()}`;

    if (navigator.share) {
      navigator.share({
        title: 'Trade Receipt',
        text: receiptText,
      });
    } else {
      navigator.clipboard.writeText(receiptText);
      toast({
        title: "Receipt Copied",
        description: "Receipt details copied to clipboard",
      });
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
                Transaction Receipt
              </h1>
              <p className="text-gray-600 text-sm">Download or share your receipt</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Success Status */}
        <Card className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 border-green-200 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Transaction Completed!</h2>
          <p className="text-green-700">
            Your {type === 'bank_transfer' ? 'bank transfer' : 'cash transaction'} has been completed successfully.
          </p>
        </Card>

        {/* Receipt Details */}
        <Card className="p-4 bg-white border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Receipt Details</h3>
            <div className="text-sm text-gray-600">#{tradeId}</div>
          </div>

          <div className="space-y-4">
            {/* Transaction Info */}
            <div className="border-b pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Cryptocurrency</div>
                  <div className="font-medium text-gray-900">{crypto}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Amount</div>
                  <div className="font-medium text-gray-900">{amount}</div>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="border-b pb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar size={16} className="text-gray-600" />
                <span className="text-sm text-gray-600">Completed Date & Time</span>
              </div>
              <div className="font-medium text-gray-900">
                {new Date(completedAt).toLocaleString()}
              </div>
            </div>

            {/* Bank Details (if applicable) */}
            {bankDetails && (
              <div className="border-b pb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Building size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-600">Bank Details</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank:</span>
                    <span className="font-medium">{bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account:</span>
                    <span className="font-medium">{bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{bankDetails.accountName}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Type */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign size={16} className="text-gray-600" />
                <span className="text-sm text-gray-600">Transaction Type</span>
              </div>
              <div className="font-medium text-gray-900">
                {type === 'bank_transfer' ? 'Bank Transfer' : 'Cash Transaction'}
              </div>
            </div>
          </div>
        </Card>

        {/* Premium Benefits */}
        <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
            <Crown size={20} className="mr-2" />
            Premium Benefits Applied
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span className="text-yellow-800 text-sm">Priority processing completed</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span className="text-yellow-800 text-sm">Enhanced security protection applied</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span className="text-yellow-800 text-sm">Premium support access maintained</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={downloadReceipt}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download size={16} className="mr-2" />
              Download
            </Button>
            <Button
              onClick={shareReceipt}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Share size={16} className="mr-2" />
              Share
            </Button>
          </div>

          <Button
            onClick={() => navigate('/premium-trades')}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Crown size={16} className="mr-2" />
            Back to My Trades
          </Button>

          <Button
            onClick={() => navigate('/premium-trade')}
            variant="outline"
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            Start Another Trade
          </Button>
        </div>

        {/* Footer Note */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-center">
            <div className="text-sm text-blue-900 font-medium">Thank you for using our premium service!</div>
            <div className="text-xs text-blue-700 mt-1">
              Keep this receipt for your records. Contact support if you need assistance.
            </div>
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ReceiptPage;