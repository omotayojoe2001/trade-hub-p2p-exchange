import React, { useState } from 'react';
import { ArrowLeft, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CryptoMarkets = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('All');
  const navigate = useNavigate();

  const cryptoData = [
    { symbol: 'BTC', name: 'Bitcoin', price: 105234.56, change: 2.34, icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: -1.23, icon: 'Ξ' },
    { symbol: 'USDT', name: 'Tether', price: 1.00, change: 0.00, icon: '⊎' },
    { symbol: 'XRP', name: 'Ripple', price: 2.45, change: 5.67, icon: '◉' },
    { symbol: 'BNB', name: 'Binance Coin', price: 645.32, change: 3.21, icon: '🔶' },
    { symbol: 'ADA', name: 'Cardano', price: 1.23, change: -2.45, icon: '₳' },
    { symbol: 'SOL', name: 'Solana', price: 234.56, change: 4.32, icon: '◎' },
    { symbol: 'DOGE', name: 'Dogecoin', price: 0.42, change: 8.76, icon: 'Ð' },
    { symbol: 'AVAX', name: 'Avalanche', price: 87.65, change: -3.21, icon: '▲' },
    { symbol: 'DOT', name: 'Polkadot', price: 12.34, change: 1.87, icon: '●' },
    { symbol: 'MATIC', name: 'Polygon', price: 2.34, change: -0.98, icon: '◆' },
    { symbol: 'LINK', name: 'Chainlink', price: 23.45, change: 2.11, icon: '⬢' },
    { symbol: 'UNI', name: 'Uniswap', price: 15.67, change: -1.45, icon: '🦄' },
    { symbol: 'LTC', name: 'Litecoin', price: 156.78, change: 0.87, icon: 'Ł' },
    { symbol: 'BCH', name: 'Bitcoin Cash', price: 543.21, change: -2.34, icon: '₿' },
    { symbol: 'ATOM', name: 'Cosmos', price: 18.90, change: 3.45, icon: '⚛' },
    { symbol: 'FIL', name: 'Filecoin', price: 12.45, change: -1.23, icon: '⬢' },
    { symbol: 'TRX', name: 'TRON', price: 0.234, change: 4.56, icon: '◈' },
    { symbol: 'VET', name: 'VeChain', price: 0.087, change: 2.34, icon: 'V' },
    { symbol: 'ICP', name: 'Internet Computer', price: 23.45, change: -3.21, icon: '∞' },
    { symbol: 'NEAR', name: 'NEAR Protocol', price: 8.76, change: 1.98, icon: 'N' },
    { symbol: 'ALGO', name: 'Algorand', price: 0.567, change: -0.87, icon: 'A' },
    { symbol: 'XLM', name: 'Stellar', price: 0.234, change: 3.45, icon: '*' },
    { symbol: 'HBAR', name: 'Hedera', price: 0.123, change: 2.11, icon: 'ℏ' },
    { symbol: 'FLOW', name: 'Flow', price: 2.34, change: -1.87, icon: '◊' }
  ];

  const tabs = ['All', 'Favorites', 'DeFi', 'Layer 1', 'Meme'];

  const filteredCrypto = cryptoData.filter(crypto =>
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Markets</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search coins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-green-600 text-xs mb-1">24h Gainers</div>
            <div className="text-green-800 font-semibold text-sm">156</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-red-600 text-xs mb-1">24h Losers</div>
            <div className="text-red-800 font-semibold text-sm">89</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-blue-600 text-xs mb-1">Total Volume</div>
            <div className="text-blue-800 font-semibold text-sm">$2.4B</div>
          </div>
        </div>

        {/* Table Header */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200 mb-2">
          <div className="text-xs font-medium text-gray-500 flex-1">Name</div>
          <div className="text-xs font-medium text-gray-500 text-right w-20">Price</div>
          <div className="text-xs font-medium text-gray-500 text-right w-16">24h%</div>
        </div>

        {/* Crypto List */}
        <div className="space-y-1">
          {filteredCrypto.map((crypto, index) => (
            <div
              key={crypto.symbol}
              className="flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2 cursor-pointer"
              onClick={() => navigate(`/coin-detail/${crypto.symbol.toLowerCase()}`)}
            >
              <div className="flex items-center flex-1">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm">{crypto.icon}</span>
                </div>
                <div>
                  <div className="text-gray-900 font-medium text-sm">{crypto.name}</div>
                  <div className="text-gray-500 text-xs">{crypto.symbol}</div>
                </div>
              </div>
              
              <div className="text-right w-20">
                <div className="text-gray-900 font-semibold text-sm">
                  ${crypto.price < 1 ? crypto.price.toFixed(4) : crypto.price.toLocaleString()}
                </div>
              </div>
              
              <div className="text-right w-16">
                <div className={`flex items-center justify-end text-xs font-medium ${
                  crypto.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {crypto.change >= 0 ? (
                    <TrendingUp size={12} className="mr-1" />
                  ) : (
                    <TrendingDown size={12} className="mr-1" />
                  )}
                  {Math.abs(crypto.change).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCrypto.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No coins found</div>
            <div className="text-gray-500 text-sm">Try searching with a different term</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoMarkets;