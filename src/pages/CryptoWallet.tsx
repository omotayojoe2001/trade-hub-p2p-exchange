import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Copy, QrCode, RefreshCw, AlertTriangle, ArrowLeft, Wallet, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CryptoIcon from '@/components/CryptoIcon';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from '@/components/BottomNavigation';

interface CryptoWallet {
  id: string;
  coin_type: string;
  deposit_address: string;
  available_balance: number;
  pending_balance: number;
  total_balance: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const CryptoWallet = () => {
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<string>('BTC');
  const [showAddresses, setShowAddresses] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const { toast } = useToast();

  const supportedCoins = [
    { symbol: 'BTC', name: 'Bitcoin', icon: 'btc' },
    { symbol: 'USDT', name: 'Tether', icon: 'usdt' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'eth' }
  ];

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error loading wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWallet = async (coinType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate realistic-looking addresses as fallback
      const generateAddress = (type: string) => {
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const hexChars = '0123456789abcdef';
        
        switch (type) {
          case 'BTC':
            // Bitcoin address format (P2PKH starts with 1)
            let btcAddr = '1';
            for (let i = 0; i < 33; i++) {
              btcAddr += chars[Math.floor(Math.random() * chars.length)];
            }
            return btcAddr;
          
          case 'ETH':
            // Ethereum address format (0x + 40 hex chars)
            let ethAddr = '0x';
            for (let i = 0; i < 40; i++) {
              ethAddr += hexChars[Math.floor(Math.random() * hexChars.length)];
            }
            return ethAddr;
          
          case 'USDT':
            // USDT on Solana (Base58 format)
            let usdtAddr = '';
            for (let i = 0; i < 44; i++) {
              usdtAddr += chars[Math.floor(Math.random() * chars.length)];
            }
            return usdtAddr;
          
          default:
            return `${type.toLowerCase()}_${Math.random().toString(36).substring(2, 15)}`;
        }
      };

      const address = generateAddress(coinType);

      const { error } = await supabase
        .from('crypto_wallets')
        .insert({
          user_id: user.id,
          coin_type: coinType,
          deposit_address: address,
          available_balance: 0,
          pending_balance: 0,
          total_balance: 0
        });

      if (error) throw error;

      toast({
        title: "Wallet generated!",
        description: `New ${coinType} wallet address created successfully.`,
      });

      loadWallets();
    } catch (error) {
      console.error('Error generating wallet:', error);
      toast({
        title: "Error",
        description: "Failed to generate wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Address copied to clipboard.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const toggleAddressVisibility = (walletId: string) => {
    setShowAddresses(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }));
  };

  const getCurrentWallet = () => {
    return wallets.find(w => w.coin_type === selectedCoin);
  };

  const generateQRCode = (address: string) => {
    // In a real app, you'd use a QR code library like 'qrcode' or 'react-qr-code'
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`;
  };

  const currentWallet = getCurrentWallet();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/settings" className="mr-4">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <Wallet size={24} className="text-blue-600 mr-3" />
          <h1 className="text-xl font-semibold text-gray-900">Crypto Wallet</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Coin Selector */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Cryptocurrency</h2>
          <div className="grid grid-cols-3 gap-3">
            {supportedCoins.map((coin) => (
              <button
                key={coin.symbol}
                onClick={() => setSelectedCoin(coin.symbol)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedCoin === coin.symbol 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="mb-1">
                  <CryptoIcon symbol={coin.symbol} size={32} />
                </div>
                  <div className="font-semibold">{coin.symbol}</div>
                  <div className="text-xs text-gray-600">{coin.name}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Wallet Balance */}
        {currentWallet ? (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{selectedCoin} Balance</h2>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {currentWallet.available_balance.toFixed(8)} {selectedCoin}
                </div>
                {currentWallet.pending_balance > 0 && (
                  <div className="text-sm text-orange-600">
                    {currentWallet.pending_balance.toFixed(8)} {selectedCoin} pending
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Address */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="font-medium">Deposit Address</Label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAddressVisibility(currentWallet.id)}
                  >
                    {showAddresses[currentWallet.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(currentWallet.deposit_address)}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                {showAddresses[currentWallet.id] 
                  ? currentWallet.deposit_address 
                  : '••••••••••••••••••••••••••••••••'
                }
              </div>
              
              {showAddresses[currentWallet.id] && (
                <div className="mt-3 text-center">
                  <img 
                    src={generateQRCode(currentWallet.deposit_address)} 
                    alt="QR Code" 
                    className="mx-auto border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-2">QR Code for easy sharing</p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-4 text-center">
            <div className="py-8">
              <Wallet size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No {selectedCoin} Wallet
              </h3>
              <p className="text-gray-600 mb-4">
                Generate a new {selectedCoin} wallet to start trading
              </p>
              <Button onClick={() => generateWallet(selectedCoin)}>
                Generate {selectedCoin} Wallet
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        {currentWallet && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowDownLeft size={24} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Receive</h3>
                <p className="text-sm text-gray-600">Get crypto deposits</p>
              </div>
            </Card>

            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowUpRight size={24} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Send</h3>
                <p className="text-sm text-gray-600">Transfer crypto</p>
              </div>
            </Card>
          </div>
        )}

        {/* Send Form (if Send is selected) */}
        {/* This would be shown when user clicks Send */}
        <Card className="p-4 hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Send {selectedCoin}</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="send_address">Recipient Address</Label>
              <Input
                id="send_address"
                placeholder="Enter recipient address"
                value={sendAddress}
                onChange={(e) => setSendAddress(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="send_amount">Amount</Label>
              <Input
                id="send_amount"
                type="number"
                placeholder="0.00000000"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
              />
            </div>

            <Button className="w-full">Send {selectedCoin}</Button>
          </div>
        </Card>

        {/* Warning */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle size={16} className="text-blue-600 mr-3 mt-1" />
            <div>
              <p className="text-sm text-gray-700 font-medium mb-1">Demo Wallet Notice</p>
              <p className="text-xs text-gray-600">
                These are demo wallet addresses for testing purposes. Do not send real cryptocurrency to these addresses.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default CryptoWallet;