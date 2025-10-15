import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { paymentConfirmationService } from '@/services/paymentConfirmationService';

interface PaymentStatusIndicatorProps {
  tradeId: string;
  onConfirmed?: () => void;
}

const PaymentStatusIndicator: React.FC<PaymentStatusIndicatorProps> = ({ 
  tradeId, 
  onConfirmed 
}) => {
  const [status, setStatus] = useState<{
    isConfirmed: boolean;
    txHash?: string;
    confirmations?: number;
  }>({ isConfirmed: false });

  useEffect(() => {
    // Check initial status
    paymentConfirmationService.checkPaymentStatus(tradeId)
      .then(setStatus);

    // Subscribe to real-time updates
    const subscription = paymentConfirmationService.subscribeToPaymentUpdates(
      tradeId,
      (payload) => {
        const newStatus = {
          isConfirmed: payload.new.status === 'confirmed',
          txHash: payload.new.tx_hash,
          confirmations: payload.new.confirmations || 0
        };
        setStatus(newStatus);
        
        if (newStatus.isConfirmed && onConfirmed) {
          onConfirmed();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [tradeId, onConfirmed]);

  if (status.isConfirmed) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle size={20} />
        <span className="font-medium">Payment Confirmed</span>
        {status.txHash && (
          <a 
            href={`https://blockstream.info/tx/${status.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline text-sm"
          >
            View TX
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-orange-600">
      <Clock size={20} />
      <span>Waiting for blockchain confirmation...</span>
    </div>
  );
};

export default PaymentStatusIndicator;