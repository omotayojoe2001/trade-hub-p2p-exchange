import React, { useRef } from 'react';
import { Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Trade {
  id: string;
  amount: number;
  currency: string;
  nairaAmount?: number;
  type: string;
  status: string;
  date: string;
  merchant: {
    name: string;
    phone?: string;
  };
  vendor?: {
    name: string;
    phone?: string;
  };
  rate?: number;
}

interface ReceiptGeneratorProps {
  trade: Trade;
  trigger: React.ReactNode;
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({ trade, trigger }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const downloadReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`TradeHub_Receipt_${trade.id.slice(-8)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback: download as image
      try {
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `TradeHub_Receipt_${trade.id.slice(-8)}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        alert('Error generating receipt. Please try again.');
      }
    }
  };

  const shareReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      canvas.toBlob(async (blob) => {
        if (blob && navigator.share) {
          try {
            const file = new File([blob], `TradeHub_Receipt_${trade.id.slice(-8)}.png`, { type: 'image/png' });
            await navigator.share({
              title: 'TradeHub Receipt',
              files: [file]
            });
          } catch (error) {
            // Fallback to download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `TradeHub_Receipt_${trade.id.slice(-8)}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error sharing receipt:', error);
      alert('Error sharing receipt. Please try again.');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-sm w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receipt Preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div 
            ref={receiptRef}
            className="bg-white p-4 border rounded font-sans text-sm"
            style={{ width: '300px', fontSize: '12px' }}
          >
            {/* Header */}
            <div className="text-center border-b border-blue-600 pb-2 mb-4">
              <h1 className="text-lg font-bold text-blue-600">TRADEHUB</h1>
              <p className="text-xs text-gray-600">TRANSACTION RECEIPT</p>
            </div>

            {/* Trade Info */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-mono text-xs">{trade.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="text-xs">{new Date(trade.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-xs font-semibold text-green-600">{trade.status.toUpperCase()}</span>
              </div>
            </div>

            {/* Amount Details */}
            <div className="bg-gray-50 p-3 rounded mb-4">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold">{trade.amount} {trade.currency}</span>
                </div>
                {trade.nairaAmount && (
                  <>
                    <div className="flex justify-between">
                      <span>Value:</span>
                      <span>₦{trade.nairaAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Fee (1%):</span>
                      <span>₦{Math.round(trade.nairaAmount * 0.01).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Net:</span>
                      <span>₦{Math.round(trade.nairaAmount * 0.99).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Merchant */}
            <div className="mb-4">
              <p className="font-semibold mb-1">Merchant</p>
              <p className="text-xs">{trade.merchant.name}</p>
              {trade.merchant.phone && (
                <p className="text-xs text-gray-600">{trade.merchant.phone}</p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t pt-2 text-center text-xs text-gray-600">
              <p>TradeHub P2P Exchange</p>
              <p>support@tradehub.com</p>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Button onClick={downloadReceipt} size="sm" className="flex-1">
              <Download className="w-3 h-3 mr-1" />
              PDF
            </Button>
            <Button onClick={shareReceipt} variant="outline" size="sm" className="flex-1">
              <Share2 className="w-3 h-3 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};