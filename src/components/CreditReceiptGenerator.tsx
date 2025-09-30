import React from 'react';
import { Download, Share2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateWAT } from '@/utils/dateUtils';

interface CreditReceiptProps {
  purchaseData: {
    id: string;
    credits: number;
    usdAmount: number;
    cryptoAmount: number;
    cryptoType: string;
    paymentAddress: string;
    transactionHash?: string;
    createdAt: string;
  };
  userInfo: {
    name: string;
    email: string;
  };
}

const CreditReceiptGenerator: React.FC<CreditReceiptProps> = ({ purchaseData, userInfo }) => {
  const generateReceipt = () => {
    const receiptContent = `
      CENTRAL EXCHANGE
      Credit Purchase Receipt
      
      Receipt ID: ${purchaseData.id}
      Date: ${formatDateWAT(purchaseData.createdAt)}
      
      Customer Information:
      Name: ${userInfo.name}
      Email: ${userInfo.email}
      
      Purchase Details:
      Credits Purchased: ${purchaseData.credits.toLocaleString()}
      USD Value: $${purchaseData.usdAmount.toFixed(2)}
      NGN Value: ₦${(purchaseData.usdAmount * 1650).toLocaleString()}
      
      Payment Information:
      Cryptocurrency: ${purchaseData.cryptoType}
      Amount Paid: ${purchaseData.cryptoAmount.toFixed(8)} ${purchaseData.cryptoType}
      Payment Address: ${purchaseData.paymentAddress}
      ${purchaseData.transactionHash ? `Transaction Hash: ${purchaseData.transactionHash}` : ''}
      
      Status: Completed ✓
      
      Thank you for your purchase!
      Central Exchange - Your trusted crypto trading platform
    `;
    
    return receiptContent;
  };

  const downloadReceipt = () => {
    const receipt = generateReceipt();
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-receipt-${purchaseData.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareReceipt = async () => {
    const receipt = generateReceipt();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Credit Purchase Receipt',
          text: receipt
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(receipt);
      alert('Receipt copied to clipboard!');
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold">Purchase Complete!</h3>
        <p className="text-gray-600">Your receipt is ready</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Receipt ID:</span>
          <span className="font-mono">{purchaseData.id.slice(-8)}</span>
        </div>
        <div className="flex justify-between">
          <span>Credits:</span>
          <span className="font-semibold">{purchaseData.credits.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount:</span>
          <span>${purchaseData.usdAmount.toFixed(2)} USD</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDateWAT(purchaseData.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button onClick={downloadReceipt} variant="outline" className="flex-1">
          <Download size={16} className="mr-2" />
          Download
        </Button>
        <Button onClick={shareReceipt} variant="outline" className="flex-1">
          <Share2 size={16} className="mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default CreditReceiptGenerator;