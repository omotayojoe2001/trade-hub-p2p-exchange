import React, { useMemo, useState } from 'react';
import { ArrowLeft, Crown, Wallet, QrCode, Copy, CheckCircle, Bitcoin, Gem, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import QRCodeLib from 'qrcode';

const COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: Bitcoin },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: Gem },
  { id: 'tether', symbol: 'USDT', name: 'Tether (USDT)', icon: Coins },
] as const;

type CoinId = typeof COINS[number]['id'];

const WALLET_MAP: Record<CoinId, { address: string; network: string[] }> = {
  bitcoin: {
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    network: ['Bitcoin (BTC)'],
  },
  ethereum: {
    address: '0x3c6B2c3Ff6f9D4C2B0b7a82AeF5E21b2F7b12345',
    network: ['Ethereum (ERC20)'],
  },
  tether: {
    address: 'TR29C9t6NQkqjU9h3Zg5q3XyQjv9D6dVx1',
    network: ['TRON (TRC20)', 'Ethereum (ERC20)'],
  },
};

const PREMIUM_PRICE_USD = 99.99;

const PremiumPayment: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCoin, setSelectedCoin] = useState<CoinId>('bitcoin');
  const [selectedNetwork, setSelectedNetwork] = useState<string>(WALLET_MAP.bitcoin.network[0]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const usdPrices: Record<CoinId, number> = {
    bitcoin: 65000,
    ethereum: 3400,
    tether: 1,
  };

  const amountInCoin = useMemo(() => {
    const price = usdPrices[selectedCoin] || 1;
    return (PREMIUM_PRICE_USD / price).toFixed(8);
  }, [selectedCoin]);

  const walletInfo = WALLET_MAP[selectedCoin];

  const generateQR = async (text: string) => {
    try {
      const url = await QRCodeLib.toDataURL(text);
      setQrDataUrl(url);
    } catch (e) {
      console.error('QR generation failed', e);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const goSuccess = () => {
    setStep(3);
    setTimeout(() => navigate('/premium-dashboard'), 2200);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-2">
          <Crown size={20} className="text-yellow-500" />
          <h1 className="text-lg font-semibold text-gray-900">Upgrade to Premium</h1>
        </div>
      </div>

      {step === 1 && (
        <div className="p-4 space-y-6">
          <Card className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold">Premium Annual</h2>
                <p className="text-purple-100">Pay with crypto</p>
              </div>
              <Crown size={28} className="text-yellow-300" />
            </div>
            <div className="text-3xl font-bold">${PREMIUM_PRICE_USD}</div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Select Coin</h3>
            <div className="grid grid-cols-3 gap-3">
              {COINS.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => {
                    setSelectedCoin(coin.id);
                    setSelectedNetwork(WALLET_MAP[coin.id].network[0]);
                  }}
                  className={`border rounded-lg p-3 text-center ${
                    selectedCoin === coin.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                  }`}
                >
                  <coin.icon className="mx-auto mb-2 text-gray-700" size={18} />
                  <div className="text-sm font-medium text-gray-900">{coin.symbol}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Amount in {COINS.find(c=>c.id===selectedCoin)?.symbol}</span>
                <span className="font-semibold">{amountInCoin}</span>
              </div>
              <div className="flex justify-between text-gray-500 mt-1">
                <span>Price Reference</span>
                <span>${usdPrices[selectedCoin].toLocaleString()}</span>
              </div>
            </div>

            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setStep(2)}>
              Continue to Wallet
            </Button>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="p-4 space-y-6">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Send {COINS.find(c=>c.id===selectedCoin)?.symbol}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Network</span>
                <div className="flex space-x-2">
                  {walletInfo.network.map(n => (
                    <button
                      key={n}
                      onClick={() => setSelectedNetwork(n)}
                      className={`px-2 py-1 rounded border text-xs ${selectedNetwork===n ? 'border-purple-500 text-purple-600' : 'border-gray-200 text-gray-600'}`}
                    >{n}</button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold">{amountInCoin} {COINS.find(c=>c.id===selectedCoin)?.symbol}</span>
              </div>
              <div className="pt-2 border-t text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Wallet Address</span>
                  <button onClick={() => handleCopy(walletInfo.address)} className="text-blue-600 hover:underline flex items-center text-xs">
                    <Copy size={14} className="mr-1" /> {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono break-all text-gray-900 mt-1">{walletInfo.address}</p>
              </div>
              <div className="flex flex-col items-center pt-2">
                <button onClick={() => generateQR(walletInfo.address)} className="text-sm text-blue-600 hover:underline flex items-center">
                  <QrCode size={16} className="mr-1" /> Generate QR
                </button>
                {qrDataUrl && <img src={qrDataUrl} alt="Wallet QR" className="w-40 h-40 mt-2" loading="lazy" />}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start space-x-3">
              <Wallet size={20} className="text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Instructions</h4>
                <ul className="list-disc pl-5 text-sm text-gray-600 mt-2 space-y-1">
                  <li>Send exactly {amountInCoin} {COINS.find(c=>c.id===selectedCoin)?.symbol} on {selectedNetwork}.</li>
                  <li>Include network fees on top; do not underpay.</li>
                  <li>After sending, tap "I have paid" to continue.</li>
                </ul>
              </div>
            </div>
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white" onClick={goSuccess}>
              I have paid
            </Button>
            <Button variant="outline" className="w-full mt-2" onClick={() => setStep(1)}>Back</Button>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <Card className="p-8 max-w-sm w-full text-center bg-white">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <Crown size={24} className="text-yellow-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Premium!</h2>
            <p className="text-gray-600 mb-4">Payment confirmed. Redirecting to your dashboard...</p>
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </Card>
        </div>
      )}

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumPayment;
