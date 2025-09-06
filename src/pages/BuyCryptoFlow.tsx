import React, { useState } from 'react';
import { ArrowLeft, Info, Shield, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate, useLocation } from 'react-router-dom';
import CryptoIcon from '@/components/CryptoIcon';

const BuyCryptoFlow = () => {
  const [nairaAmount, setNairaAmount] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCoin = 'bitcoin', coinData } = location.state || {};

  // Default coin data if not provided
  const defaultCoinData = {
    bitcoin: { symbol: 'BTC', name: 'Bitcoin', price: 30000, rate: 1500 },
    tether: { symbol: 'USDT', name: 'Tether', price: 1, rate: 1350 },
    ethereum: { symbol: 'ETH', name: 'Ethereum', price: 3900, rate: 1500 },
    bnb: { symbol: 'BNB', name: 'Binance Coin', price: 567, rate: 1500 }
  };

  const coin = coinData || defaultCoinData[selectedCoin as keyof typeof defaultCoinData] || defaultCoinData.bitcoin;

  // Exchange rate (₦1500 per $1)
  const RATE = coin.rate; // NGN per USD
  const CRYPTO_PRICE = coin.price; // USD per crypto

  const handleNairaChange = (value: string) => {
    setNairaAmount(value);
    if (value) {
      const usdAmount = parseFloat(value) / RATE;
      const crypto = usdAmount / CRYPTO_PRICE;
      setCryptoAmount(crypto.toFixed(8));
    } else {
      setCryptoAmount("");
    }
  };

  const handleCryptoChange = (value: string) => {
    setCryptoAmount(value);
    if (value) {
      const usdAmount = parseFloat(value) * CRYPTO_PRICE;
      const naira = usdAmount * RATE;
      setNairaAmount(naira.toFixed(2));
    } else {
      setNairaAmount("");
    }
  };

  const handleContinue = () => {
    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) return;
    
    navigate('/buy-crypto-merchant-selection', { 
      state: { 
        nairaAmount: parseFloat(nairaAmount), 
        cryptoAmount: parseFloat(cryptoAmount),
        selectedCoin,
        coinData: coin,
        tradeType: 'buy'
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Buy {coin.name}</h1>
      </div>

      <div className="p-4">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info size={16} className="text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How buying works:</p>
              <p>1. Enter the amount you want to spend in Naira</p>
              <p>2. We'll match you with a verified merchant</p>
              <p>3. Transfer Naira to merchant's account</p>
              <p>4. Receive {coin.symbol} in your wallet after confirmation</p>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <Card className="p-4 mb-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Amount to Buy
              </label>
              <p className="text-sm text-muted-foreground mb-2">
                Type the {coin.symbol} amount you want to buy. Rate updates live.
              </p>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <CryptoIcon symbol={coin.symbol} size={16} />
                </div>
                <Input
                  type="number"
                  placeholder="0.00000000"
                  value={cryptoAmount}
                  onChange={(e) => handleCryptoChange(e.target.value)}
                  className="pl-10 text-lg h-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  {coin.symbol}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter amount to offer for trade
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                You'll send (Nigerian Naira)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={nairaAmount}
                  onChange={(e) => handleNairaChange(e.target.value)}
                  className="pl-8 text-lg h-12"
                  readOnly
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cash to be sent to merchant's bank account
              </p>
            </div>
          </div>
        </Card>

        {/* Rate Info */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Current Rate:</span>
            <span className="font-semibold">₦{(CRYPTO_PRICE * RATE).toLocaleString()}/{coin.symbol}</span>
          </div>
        </Card>

        {/* Security Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Shield size={16} className="text-green-600 mr-2 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Secure Transaction</p>
              <p>Your payment is protected by escrow. {coin.symbol} is only released after payment confirmation.</p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!cryptoAmount || parseFloat(cryptoAmount) <= 0}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
        >
          Continue to Merchant Selection
        </Button>
      </div>
    </div>
  );
};

export default BuyCryptoFlow;