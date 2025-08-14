import React from 'react';
import { Download, Share2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ReceiptData {
  transactionId: string;
  amount: number;
  coin: string;
  escrowAddress: string;
  receiverBankDetails: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
  completedAt: Date;
  txHash?: string;
}

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
  onDownload?: () => void;
  onShare?: (platform: string) => void;
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  receiptData,
  onDownload,
  onShare
}) => {
  const generatePDF = () => {
    const receiptContent = `
CRYPTO ESCROW RECEIPT
=====================

Transaction ID: ${receiptData.transactionId}
Date: ${receiptData.completedAt.toLocaleDateString()}
Time: ${receiptData.completedAt.toLocaleTimeString()}

TRANSACTION DETAILS
------------------
Amount: ${receiptData.amount} ${receiptData.coin.toUpperCase()}
Escrow Address: ${receiptData.escrowAddress}
Transaction Hash: ${receiptData.txHash || 'N/A'}

RECEIVER DETAILS
---------------
Bank: ${receiptData.receiverBankDetails.bankName}
Account: ${receiptData.receiverBankDetails.accountNumber}
Name: ${receiptData.receiverBankDetails.accountName}

STATUS: COMPLETED ✓

This receipt confirms successful completion of your crypto-to-cash transaction through our secure escrow service.
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onDownload?.();
  };

  const shareToSocial = (platform: string) => {
    const message = `Successfully completed crypto-to-cash transaction! Transaction ID: ${receiptData.transactionId}`;
    
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?text=${encodeURIComponent(message)}`,
      sms: `sms:?body=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(message)}`
    };

    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank');
      onShare?.(platform);
    }
  };

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <FileText className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">Transaction Receipt</h3>
        <p className="text-sm text-gray-600">Your transaction has been completed successfully</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Transaction ID</span>
              <p className="font-medium">{receiptData.transactionId}</p>
            </div>
            <div>
              <span className="text-gray-600">Amount</span>
              <p className="font-medium">{receiptData.amount} {receiptData.coin.toUpperCase()}</p>
            </div>
            <div>
              <span className="text-gray-600">Completed</span>
              <p className="font-medium">{receiptData.completedAt.toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-gray-600">Status</span>
              <p className="font-medium text-green-600">Completed ✓</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Receiver Details</h4>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-600">Bank:</span> {receiptData.receiverBankDetails.bankName}</p>
            <p><span className="text-gray-600">Account:</span> {receiptData.receiverBankDetails.accountNumber}</p>
            <p><span className="text-gray-600">Name:</span> {receiptData.receiverBankDetails.accountName}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={generatePDF}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Receipt
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => shareToSocial('whatsapp')}
            variant="outline"
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            <Share2 className="w-4 h-4 mr-1" />
            WhatsApp
          </Button>
          <Button 
            onClick={() => shareToSocial('telegram')}
            variant="outline"
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Telegram
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => shareToSocial('sms')}
            variant="outline"
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <Share2 className="w-4 h-4 mr-1" />
            SMS
          </Button>
          <Button 
            onClick={() => shareToSocial('facebook')}
            variant="outline"
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Facebook
          </Button>
        </div>
      </div>
    </Card>
  );
};