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
        className={`bg-orange-100 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-orange-600 text-xs font-bold">₿</span>
      </div>
    );
  }

  // Normalize symbol to lowercase for the icon library
  const normalizedSymbol = symbol.toString().toLowerCase();
  
  // Use CDN for crypto icons in production
  const iconPath = `https://cryptologos.cc/logos/${normalizedSymbol}-${normalizedSymbol}-logo.svg`;
  
  return (
    <img
      src={iconPath}
      alt={`${symbol} icon`}
      width={size}
      height={size}
      className={className}
      onError={(e) => {
        // Fallback to emoji if CDN fails
        const target = e.target as HTMLImageElement;
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = `bg-orange-100 rounded-full flex items-center justify-center ${className}`;
        fallbackDiv.style.width = `${size}px`;
        fallbackDiv.style.height = `${size}px`;
        fallbackDiv.innerHTML = `<span class="text-orange-600 text-xs font-bold">₿</span>`;
        target.parentNode?.replaceChild(fallbackDiv, target);
      }}
    />
  );
};

export default CryptoIcon;
