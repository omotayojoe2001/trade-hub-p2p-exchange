import React, { useRef } from 'react';
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
  const receiptRef = useRef<HTMLDivElement>(null);

  const downloadAsJPG = async () => {
    if (!receiptRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `receipt-${receiptData.transactionId}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      
      onDownload?.();
    } catch (error) {
      console.error('Error generating JPG:', error);
    }
  };

  const downloadAsPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`receipt-${receiptData.transactionId}.pdf`);
      
      onDownload?.();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
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
    <div className="space-y-6">
      <Card ref={receiptRef} className="bg-white shadow-lg">
        <div className="text-center p-6 space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">CP</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900">CryptoPay Receipt</h3>
          <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-green-50 text-green-600">
            TRANSACTION COMPLETED ✓
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Transaction ID:</span>
              <p className="font-mono text-xs break-all">{receiptData.transactionId}</p>
            </div>
            <div>
              <span className="text-gray-600">Date:</span>
              <p className="font-medium">{receiptData.completedAt.toLocaleString()}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="font-semibold text-gray-900">Transaction Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Crypto Amount:</span>
                <p className="font-semibold">{receiptData.amount} {receiptData.coin.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-gray-600">Escrow Address:</span>
                <p className="font-mono text-xs break-all">{receiptData.escrowAddress}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium text-gray-900">Receiver Details</h4>
            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-600">Bank Name:</span>
                <p className="font-medium">{receiptData.receiverBankDetails.bankName}</p>
              </div>
              <div>
                <span className="text-gray-600">Account Number:</span>
                <p className="font-mono">{receiptData.receiverBankDetails.accountNumber}</p>
              </div>
              <div>
                <span className="text-gray-600">Account Name:</span>
                <p className="font-medium">{receiptData.receiverBankDetails.accountName}</p>
              </div>
            </div>
          </div>

          {receiptData.txHash && (
            <div className="border-t pt-4 space-y-2">
              <span className="text-gray-600 text-sm">Transaction Hash:</span>
              <p className="font-mono text-xs break-all bg-gray-50 p-2 rounded">
                {receiptData.txHash}
              </p>
            </div>
          )}

          <div className="text-center text-xs text-gray-500 space-y-1 border-t pt-4">
            <p>Generated on {new Date().toLocaleString()}</p>
            <p>CryptoPay - Secure Cryptocurrency Trading Platform</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button onClick={downloadAsJPG} className="flex-1" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download JPG
          </Button>
          <Button onClick={downloadAsPDF} className="flex-1" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600 text-center">Share Receipt</p>
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
      </div>
    </div>
  );
};