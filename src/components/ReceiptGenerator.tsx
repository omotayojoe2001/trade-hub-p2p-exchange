import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Share2, MessageCircle, X } from 'lucide-react';
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
      <Card ref={receiptRef} className="bg-gray-900 text-white shadow-lg max-w-md mx-auto">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {receiptData.receipt_type === 'completed' ? 'Bought' : 'Buying'} {receiptData.crypto_type.toUpperCase()}
            </div>
            <X className="w-6 h-6 text-gray-400" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          {/* Amount Display */}
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-white">
              {receiptData.amount} {receiptData.crypto_type.toUpperCase()}
            </div>
            <div className="text-3xl font-bold text-white">
              ${receiptData.cash_amount.toLocaleString()}
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6 space-y-4">
            {/* Reference Code */}
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Reference code</span>
              <span className="text-white font-mono text-sm">{receiptData.id.slice(-8).toUpperCase()}</span>
            </div>

            {/* Price */}
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Price</span>
              <span className="text-gray-300">${receiptData.rate.toLocaleString()}</span>
            </div>

            {/* Payment Method */}
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Payment method</span>
              <span className="text-gray-300">
                {receiptData.bank_details ?
                  `${receiptData.bank_details.bank_name} (${receiptData.bank_details.account_number.slice(-4).padStart(receiptData.bank_details.account_number.length, '*')})` :
                  'Bank Transfer'
                }
              </span>
            </div>

            {/* Platform Fee */}
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Coinbase fee</span>
              <span className="text-gray-300">${(receiptData.platform_fee || receiptData.cash_amount * 0.015).toFixed(2)}</span>
            </div>

            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Subtotal</span>
              <span className="text-gray-300">${(receiptData.cash_amount - (receiptData.platform_fee || receiptData.cash_amount * 0.015)).toFixed(2)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="text-gray-300 text-lg">Total</span>
              <span className="text-white text-lg font-bold">${receiptData.cash_amount.toLocaleString()}</span>
            </div>

            {/* Date */}
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Date</span>
              <span className="text-gray-300">{new Date(receiptData.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – {new Date(receiptData.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Status</span>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${receiptData.receipt_type === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-gray-300 capitalize">{receiptData.receipt_type}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button onClick={downloadAsJPG} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download Image
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