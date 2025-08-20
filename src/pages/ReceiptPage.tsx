import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReceiptGenerator } from '@/components/escrow/ReceiptGenerator';

const ReceiptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { receiptData } = location.state || {};

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">No Receipt Data</h2>
          <p className="text-muted-foreground mb-4">Unable to load receipt information.</p>
          <Button onClick={() => navigate('/my-trades')}>
            Back to Trades
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="flex items-center p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-2 p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Transaction Receipt</h1>
        </div>
      </div>

      {/* Receipt Content */}
      <div className="p-4">
        <ReceiptGenerator 
          receiptData={receiptData}
          onDownload={() => console.log('Receipt downloaded')}
          onShare={(platform) => console.log(`Shared to ${platform}`)}
        />
      </div>
    </div>
  );
};

export default ReceiptPage;