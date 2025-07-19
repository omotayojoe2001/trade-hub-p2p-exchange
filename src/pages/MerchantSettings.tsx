import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Settings, TrendingUp, Shield, Clock, DollarSign } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from '@/components/BottomNavigation';

interface MerchantSettings {
  merchant_type: 'auto' | 'manual';
  btc_buy_rate: number | null;
  btc_sell_rate: number | null;
  usdt_buy_rate: number | null;
  usdt_sell_rate: number | null;
  min_trade_amount: number;
  max_trade_amount: number;
  auto_accept_trades: boolean;
  auto_release_escrow: boolean;
  is_online: boolean;
  accepts_new_trades: boolean;
  avg_response_time_minutes: number;
  payment_methods: string[];
}

const MerchantSettings = () => {
  const [settings, setSettings] = useState<MerchantSettings>({
    merchant_type: 'manual',
    btc_buy_rate: null,
    btc_sell_rate: null,
    usdt_buy_rate: null,
    usdt_sell_rate: null,
    min_trade_amount: 1000,
    max_trade_amount: 10000000,
    auto_accept_trades: false,
    auto_release_escrow: false,
    is_online: true,
    accepts_new_trades: true,
    avg_response_time_minutes: 10,
    payment_methods: ['bank_transfer']
  });

  const [loading, setLoading] = useState(false);
  const [currentBtcPrice, setCurrentBtcPrice] = useState<number>(68500);
  const [currentUsdtPrice, setCurrentUsdtPrice] = useState<number>(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadMerchantSettings();
    fetchCurrentPrices();
  }, []);

  const loadMerchantSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('merchant_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSettings({
          merchant_type: data.merchant_type as 'auto' | 'manual',
          btc_buy_rate: data.btc_buy_rate,
          btc_sell_rate: data.btc_sell_rate,
          usdt_buy_rate: data.usdt_buy_rate,
          usdt_sell_rate: data.usdt_sell_rate,
          min_trade_amount: data.min_trade_amount,
          max_trade_amount: data.max_trade_amount,
          auto_accept_trades: data.auto_accept_trades,
          auto_release_escrow: data.auto_release_escrow,
          is_online: data.is_online,
          accepts_new_trades: data.accepts_new_trades,
          avg_response_time_minutes: data.avg_response_time_minutes,
          payment_methods: Array.isArray(data.payment_methods) ? data.payment_methods as string[] : ['bank_transfer']
        });
      }
    } catch (error) {
      console.error('Error loading merchant settings:', error);
    }
  };

  const fetchCurrentPrices = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd');
      const data = await response.json();
      setCurrentBtcPrice(data.bitcoin?.usd || 68500);
      setCurrentUsdtPrice(data.tether?.usd || 1);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('merchant_settings')
        .upsert({
          user_id: user.id,
          ...settings
        });

      if (error) throw error;

      toast({
        title: "Settings saved successfully!",
        description: "Your merchant settings have been updated.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNairaRate = (usdPrice: number, margin: number = 0) => {
    const usdToNgn = 1530; // Current USD to NGN rate
    return Math.round((usdPrice * usdToNgn) * (1 + margin / 100));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
        <div className="flex items-center">
          <Link to="/settings" className="mr-4">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <Settings size={24} className="text-blue-600 mr-3" />
          <h1 className="text-xl font-semibold text-gray-900">Merchant Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Merchant Type */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Shield size={20} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Merchant Type</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSettings(prev => ({ ...prev, merchant_type: 'manual' }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.merchant_type === 'manual' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <h3 className="font-semibold">Manual Trading</h3>
                <p className="text-sm text-gray-600">Review each trade manually</p>
              </div>
            </button>

            <button
              onClick={() => setSettings(prev => ({ ...prev, merchant_type: 'auto' }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.merchant_type === 'auto' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <h3 className="font-semibold">Auto Trading</h3>
                <p className="text-sm text-gray-600">Accept trades automatically</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Exchange Rates */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <TrendingUp size={20} className="text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Exchange Rates</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-600 mb-2">Current Market Prices:</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <span>BTC: ${currentBtcPrice.toLocaleString()}</span>
                <span>USDT: ${currentUsdtPrice}</span>
              </div>
              <p className="text-xs text-blue-500 mt-2">Suggested rates include 1-3% margin</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="btc_buy_rate">BTC Buy Rate (₦)</Label>
                <Input
                  id="btc_buy_rate"
                  type="number"
                  placeholder={calculateNairaRate(currentBtcPrice, -1).toLocaleString()}
                  value={settings.btc_buy_rate || ''}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    btc_buy_rate: e.target.value ? Number(e.target.value) : null 
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Rate when you buy BTC from customers</p>
              </div>

              <div>
                <Label htmlFor="btc_sell_rate">BTC Sell Rate (₦)</Label>
                <Input
                  id="btc_sell_rate"
                  type="number"
                  placeholder={calculateNairaRate(currentBtcPrice, 2).toLocaleString()}
                  value={settings.btc_sell_rate || ''}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    btc_sell_rate: e.target.value ? Number(e.target.value) : null 
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">Rate when you sell BTC to customers</p>
              </div>

              <div>
                <Label htmlFor="usdt_buy_rate">USDT Buy Rate (₦)</Label>
                <Input
                  id="usdt_buy_rate"
                  type="number"
                  placeholder={calculateNairaRate(currentUsdtPrice, -1).toString()}
                  value={settings.usdt_buy_rate || ''}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    usdt_buy_rate: e.target.value ? Number(e.target.value) : null 
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="usdt_sell_rate">USDT Sell Rate (₦)</Label>
                <Input
                  id="usdt_sell_rate"
                  type="number"
                  placeholder={calculateNairaRate(currentUsdtPrice, 2).toString()}
                  value={settings.usdt_sell_rate || ''}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    usdt_sell_rate: e.target.value ? Number(e.target.value) : null 
                  }))}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Trading Limits */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <DollarSign size={20} className="text-orange-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Trading Limits</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_amount">Minimum Trade (₦)</Label>
              <Input
                id="min_amount"
                type="number"
                value={settings.min_trade_amount}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  min_trade_amount: Number(e.target.value) 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="max_amount">Maximum Trade (₦)</Label>
              <Input
                id="max_amount"
                type="number"
                value={settings.max_trade_amount}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  max_trade_amount: Number(e.target.value) 
                }))}
              />
            </div>
          </div>
        </Card>

        {/* Auto Trading Settings */}
        {settings.merchant_type === 'auto' && (
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Auto Trading Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Accept Trades</Label>
                  <p className="text-sm text-gray-600">Automatically accept new trade requests</p>
                </div>
                <Switch
                  checked={settings.auto_accept_trades}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    auto_accept_trades: checked 
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Release Escrow</Label>
                  <p className="text-sm text-gray-600">Automatically release crypto when payment confirmed</p>
                </div>
                <Switch
                  checked={settings.auto_release_escrow}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    auto_release_escrow: checked 
                  }))}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Status Settings */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Clock size={20} className="text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Status & Availability</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Currently Online</Label>
                <p className="text-sm text-gray-600">Accept new trades and respond to customers</p>
              </div>
              <Switch
                checked={settings.is_online}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  is_online: checked 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Accept New Trades</Label>
                <p className="text-sm text-gray-600">Allow customers to initiate new trades</p>
              </div>
              <Switch
                checked={settings.accepts_new_trades}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  accepts_new_trades: checked 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="response_time">Average Response Time (minutes)</Label>
              <Select
                value={settings.avg_response_time_minutes.toString()}
                onValueChange={(value) => setSettings(prev => ({ 
                  ...prev, 
                  avg_response_time_minutes: Number(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Button 
          onClick={handleSave} 
          className="w-full h-12 bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Merchant Settings'}
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MerchantSettings;