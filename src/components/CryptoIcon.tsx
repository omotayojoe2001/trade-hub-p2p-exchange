import React from 'react';

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

const CryptoIcon: React.FC<CryptoIconProps> = ({ symbol, size = 24, className = '' }) => {
  // Handle undefined or null symbol
  if (!symbol || symbol === 'undefined' || symbol.trim() === '') {
    return (
      <div
        className={`bg-gray-200 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-xs font-bold">₿</span>
      </div>
    );
  }

  // Normalize symbol to lowercase for the icon library
  const normalizedSymbol = symbol.toString().toLowerCase();
  
  // Use the local package files
  const iconPath = `/node_modules/cryptocurrency-icons/svg/color/${normalizedSymbol}.svg`;
  
  return (
    <img
      src={iconPath}
      alt={`${symbol} icon`}
      width={size}
      height={size}
      className={className}
      onError={(e) => {
        // Fallback to a generic crypto icon if the specific one fails to load
        const target = e.target as HTMLImageElement;
        target.src = '/node_modules/cryptocurrency-icons/svg/color/generic.svg';
      }}
    />
  );
};

export default CryptoIcon;
