import React, { useState, useEffect } from 'react';

const CryptoTicker = () => {
  const cryptoData = [
    { symbol: 'BTC', price: '$97,234', change: '+2.45%', positive: true },
    { symbol: 'ETH', price: '$3,456', change: '+1.23%', positive: true },
    { symbol: 'USDT', price: '$1.00', change: '+0.01%', positive: true },
    { symbol: 'XRP', price: '$2.34', change: '-1.23%', positive: false },
    { symbol: 'BNB', price: '$692', change: '-0.87%', positive: false },
    { symbol: 'SOL', price: '$246', change: '+5.23%', positive: true },
    { symbol: 'ADA', price: '$1.23', change: '+3.45%', positive: true },
    { symbol: 'DOGE', price: '$0.42', change: '+8.76%', positive: true },
    { symbol: 'MATIC', price: '$0.90', change: '+2.15%', positive: true },
    { symbol: 'DOT', price: '$7.26', change: '-0.95%', positive: false },
    { symbol: 'AVAX', price: '$38.15', change: '+4.12%', positive: true },
    { symbol: 'LINK', price: '$15.18', change: '-2.34%', positive: false },
    { symbol: 'LTC', price: '$152', change: '+0.56%', positive: true },
    { symbol: 'UNI', price: '$10.14', change: '+1.87%', positive: true },
    { symbol: 'SHIB', price: '$0.000024', change: '+12.34%', positive: true },
    { symbol: 'TRX', price: '$0.28', change: '+1.45%', positive: true },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const coinsPerView = 3;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + coinsPerView) % cryptoData.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getVisibleCoins = () => {
    const visible = [];
    for (let i = 0; i < coinsPerView; i++) {
      const index = (currentIndex + i) % cryptoData.length;
      visible.push(cryptoData[index]);
    }
    return visible;
  };

  return (
    <div className="bg-white py-2">
      <div className="flex justify-between px-4 gap-2">
        {getVisibleCoins().map((crypto, index) => (
          <div key={`${crypto.symbol}-${currentIndex}-${index}`} className="bg-white rounded-lg px-2 py-2 shadow-sm border border-gray-200 flex-1 text-center h-14 flex flex-col justify-center">
            <div className="text-black font-medium text-xs leading-tight">{crypto.symbol} {crypto.price}</div>
            <div className={`text-xs ${crypto.positive ? 'text-green-600' : 'text-red-600'}`}>
              {crypto.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CryptoTicker;