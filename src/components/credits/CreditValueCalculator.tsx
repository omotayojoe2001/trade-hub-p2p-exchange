import React from 'react';
import { DollarSign, Bitcoin, Coins } from 'lucide-react';

interface CreditValueCalculatorProps {
  credits: number;
  className?: string;
}

// Credit Value System:
// 1 credit = $0.01 USD
// BTC price: ~$100,000 USD
// ETH price: ~$3,500 USD

export const CreditValueCalculator: React.FC<CreditValueCalculatorProps> = ({ 
  credits, 
  className = "" 
}) => {
  const usdValue = credits * 0.01;
  const btcValue = usdValue / 100000; // Assuming BTC = $100,000
  const ethValue = usdValue / 3500;   // Assuming ETH = $3,500

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-green-600">
        <DollarSign size={16} />
        <span className="font-medium">${usdValue.toFixed(2)} USD</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Bitcoin size={14} />
          <span>{btcValue.toFixed(8)} BTC</span>
        </div>
        <div className="flex items-center gap-1">
          <Coins size={14} />
          <span>{ethValue.toFixed(6)} ETH</span>
        </div>
      </div>
    </div>
  );
};

export const calculateCreditValue = (credits: number) => ({
  credits,
  usd: credits * 0.01,
  btc: (credits * 0.01) / 100000,
  eth: (credits * 0.01) / 3500
});