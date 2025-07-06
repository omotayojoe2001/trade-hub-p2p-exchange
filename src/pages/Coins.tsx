
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Coins = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const coins = [
    { name: 'Bitcoin', symbol: 'BTC', price: '$68,523', change: '+1.2%', tag: 'Top Gainer', tagColor: 'bg-green-500', isTopGainer: true },
    { name: 'Ethereum', symbol: 'ETH', price: '$3,847', change: '+0.8%', tag: null, tagColor: '', isTopGainer: false },
    { name: 'Tether', symbol: 'USDT', price: '$1.00', change: '+0.1%', tag: 'Stablecoin', tagColor: 'bg-gray-500', isTopGainer: false },
    { name: 'BNB', symbol: 'BNB', price: '$245.30', change: '-0.5%', tag: 'New', tagColor: 'bg-blue-500', isTopGainer: false },
    { name: 'Solana', symbol: 'SOL', price: '$89.42', change: '+2.1%', tag: null, tagColor: '', isTopGainer: false },
    { name: 'XRP', symbol: 'XRP', price: '$0.52', change: '-1.3%', tag: null, tagColor: '', isTopGainer: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-gray-800 text-center mb-6" style={{ fontFamily: 'Poppins' }}>
        Trending Coins
      </h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-blue-500" />
        </div>
        <Input
          type="text"
          placeholder="Search coins..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-12 bg-white border border-gray-300 rounded-xl pl-12 pr-4"
          style={{ fontFamily: 'Inter' }}
        />
      </div>

      {/* Coin List */}
      <div className="space-y-0">
        {coins.map((coin, index) => (
          <div
            key={coin.symbol}
            className={`bg-white p-4 flex justify-between items-center ${
              coin.symbol === 'USDT' ? 'bg-gray-50' : ''
            } ${coin.isTopGainer ? 'border-l-4 border-green-500' : ''} ${
              index !== coins.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <p className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>
                  {coin.name}
                </p>
                {coin.tag && (
                  <span
                    className={`${coin.tagColor} text-white text-xs font-bold px-2 py-1 rounded`}
                    style={{ fontFamily: 'Inter' }}
                  >
                    {coin.tag}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>
                {coin.symbol}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins' }}>
                {coin.price}
              </p>
              <p
                className={`text-sm font-semibold ${
                  coin.change.startsWith('+') ? 'text-green-500' : 'text-red-400'
                }`}
                style={{ fontFamily: 'Inter' }}
              >
                {coin.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center mt-6">
        <Button
          variant="ghost"
          className="h-10 text-blue-500 font-medium"
          style={{ fontFamily: 'Inter' }}
        >
          Load More
        </Button>
      </div>
    </div>
  );
};

export default Coins;
