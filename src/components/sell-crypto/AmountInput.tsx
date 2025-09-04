import React from 'react';

interface AmountInputProps {
  amount: string;
  onAmountChange: (value: string) => void;
  currentRate: number;
  calculateNairaValue: () => number;
  currency?: string;
  mode?: 'buy' | 'sell';
}

const AmountInput = ({ amount, onAmountChange, currentRate, calculateNairaValue, currency = 'BTC', mode = 'sell' }: AmountInputProps) => {
  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');

    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return; // Don't update if more than one decimal point
    }

    // Limit decimal places to 8 (standard for crypto)
    if (parts[1] && parts[1].length > 8) {
      return;
    }

    onAmountChange(numericValue);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {mode === 'buy' ? `Amount to Buy` : `Amount to Sell`}
      </h2>

      <div className="relative">
        <input
          type="text"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          className="w-full text-4xl font-light text-gray-900 bg-transparent border-none outline-none"
          placeholder="0.00"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
        />
        <span className="absolute right-0 top-0 text-4xl font-light text-gray-900">{currency}</span>
      </div>
      
      <p className="text-sm text-gray-500 mt-2">Enter amount to offer for trade</p>
      
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700">You'll receive</span>
          <span className="text-gray-400">≈</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-500">Rate: ₦{currentRate.toLocaleString()}/{currency}</span>
            <div className={`ml-2 w-2 h-2 rounded-full ${
              Math.random() > 0.5 ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`}></div>
          </div>
          <span className="text-2xl font-bold text-gray-900">
            ₦{calculateNairaValue().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AmountInput;