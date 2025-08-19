import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Share2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReceiptData {
  id: string;
  trade_id: string;
  receipt_type: 'completed' | 'cancelled' | 'rejected' | 'pending';
  amount: number;
  crypto_type: string;
  cash_amount: number;
  rate: number;
  buyer_name: string;
  seller_name: string;
  created_at: string;
  transaction_hash?: string;
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
  platform_fee?: number;
  net_amount?: number;
}

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
  onShare?: (platform: string) => void;
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({ 
  receiptData, 
  onShare 
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (type: string) => {
    switch (type) {
      case 'completed':
        return 'TRANSACTION COMPLETED';
      case 'cancelled':
        return 'TRANSACTION CANCELLED';
      case 'rejected':
        return 'TRANSACTION REJECTED';
      case 'pending':
        return 'TRANSACTION PENDING';
      default:
        return 'TRANSACTION';
    }
  };

  const downloadAsJPG = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `receipt-${receiptData.id}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      
      toast.success('Receipt downloaded as JPG');
    } catch (error) {
      console.error('Error generating JPG:', error);
      toast.error('Failed to download JPG');
    }
  };

  const downloadAsPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`receipt-${receiptData.id}.pdf`);
      
      toast.success('Receipt downloaded as PDF');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const shareToWhatsApp = () => {
    const text = `*CryptoPay Receipt*\n\nTransaction ID: ${receiptData.id}\nStatus: ${getStatusText(receiptData.receipt_type)}\nAmount: ${receiptData.amount} ${receiptData.crypto_type.toUpperCase()}\nCash Amount: ₦${receiptData.cash_amount.toLocaleString()}\nRate: ₦${receiptData.rate}/USD\nDate: ${new Date(receiptData.created_at).toLocaleDateString()}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    onShare?.('whatsapp');
  };

  const shareToTelegram = () => {
    const text = `CryptoPay Receipt\n\nTransaction ID: ${receiptData.id}\nStatus: ${getStatusText(receiptData.receipt_type)}\nAmount: ${receiptData.amount} ${receiptData.crypto_type.toUpperCase()}\nCash Amount: ₦${receiptData.cash_amount.toLocaleString()}\nDate: ${new Date(receiptData.created_at).toLocaleDateString()}`;
    
    const url = `https://t.me/share/url?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    onShare?.('telegram');
  };

  const shareToSMS = () => {
    const text = `CryptoPay Receipt - Transaction ID: ${receiptData.id} - Status: ${getStatusText(receiptData.receipt_type)} - Amount: ${receiptData.amount} ${receiptData.crypto_type.toUpperCase()} - ₦${receiptData.cash_amount.toLocaleString()}`;
    
    const url = `sms:?body=${encodeURIComponent(text)}`;
    window.location.href = url;
    onShare?.('sms');
  };

  return (
    <div className="space-y-6">
      <Card ref={receiptRef} className="bg-white shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">CP</span>
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">CryptoPay</CardTitle>
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(receiptData.receipt_type)}`}>
            {getStatusText(receiptData.receipt_type)}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Transaction ID:</span>
              <p className="font-mono text-xs break-all">{receiptData.id}</p>
            </div>
            <div>
              <span className="text-gray-600">Date:</span>
              <p className="font-medium">{new Date(receiptData.created_at).toLocaleString()}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Crypto Amount:</span>
                <p className="font-semibold">{receiptData.amount} {receiptData.crypto_type.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-gray-600">Cash Amount:</span>
                <p className="font-semibold">₦{receiptData.cash_amount.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-600">Exchange Rate:</span>
                <p className="font-medium">₦{receiptData.rate}/USD</p>
              </div>
              {receiptData.platform_fee && (
                <div>
                  <span className="text-gray-600">Platform Fee:</span>
                  <p className="font-medium">₦{receiptData.platform_fee.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Parties</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Buyer:</span>
                <p className="font-medium">{receiptData.buyer_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Seller:</span>
                <p className="font-medium">{receiptData.seller_name}</p>
              </div>
            </div>
          </div>

          {receiptData.bank_details && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Bank Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Bank Name:</span>
                    <p className="font-medium">{receiptData.bank_details.bank_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Account Number:</span>
                    <p className="font-mono">{receiptData.bank_details.account_number}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Account Name:</span>
                    <p className="font-medium">{receiptData.bank_details.account_name}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {receiptData.transaction_hash && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-gray-600 text-sm">Transaction Hash:</span>
                <p className="font-mono text-xs break-all bg-gray-50 p-2 rounded">
                  {receiptData.transaction_hash}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Generated on {new Date().toLocaleString()}</p>
            <p>CryptoPay - Secure Cryptocurrency Trading Platform</p>
          </div>
        </CardContent>
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
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={shareToWhatsApp} variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={shareToTelegram} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Telegram
            </Button>
            <Button onClick={shareToSMS} variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              SMS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};