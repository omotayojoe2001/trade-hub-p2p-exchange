import React from 'react';

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

const CryptoIcon: React.FC<CryptoIconProps> = ({ symbol, size = 24, className = '' }) => {
  // Normalize symbol to lowercase for the icon library
  const normalizedSymbol = symbol.toLowerCase();
  
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
