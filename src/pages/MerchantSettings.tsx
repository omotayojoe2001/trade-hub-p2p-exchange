import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, TrendingUp, Shield, Clock, DollarSign, Coins, Globe, CreditCard, MapPin, Calendar, Save, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from '@/components/BottomNavigation';

interface MerchantSettings {
  merchant_type: 'auto' | 'manual';
  supported_coins: string[];
  supported_currencies: string[];
  exchange_rates: Record<string, { buy_rate: number | null; sell_rate: number | null }>;
  min_trade_amount: number;
  max_trade_amount: number;
  auto_accept_trades: boolean;
  auto_release_escrow: boolean;
  is_online: boolean;
  accepts_new_trades: boolean;
  avg_response_time_minutes: number;
  payment_methods: string[];
  service_locations: string[];
  business_hours: {
    enabled: boolean;
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  requires_kyc: boolean;
  min_customer_rating: number;
}

const MerchantSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<MerchantSettings>({
    merchant_type: 'manual',
    supported_coins: [],
    supported_currencies: ['NGN'],
    exchange_rates: {},
    min_trade_amount: 1000,
    max_trade_amount: 10000000,
    auto_accept_trades: false,
    auto_release_escrow: false,
    is_online: true,
    accepts_new_trades: true,
    avg_response_time_minutes: 10,
    payment_methods: [],
    service_locations: [],
    business_hours: {
      enabled: false,
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '10:00', end: '15:00', enabled: false },
      sunday: { start: '10:00', end: '15:00', enabled: false }
    },
    requires_kyc: false,
    min_customer_rating: 0
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});

  // Load merchant settings from Supabase
  useEffect(() => {
    if (user) {
      loadMerchantSettings();
    }
  }, [user]);

  const loadMerchantSettings = async () => {
    try {
      setLoading(true);

      // Load merchant settings from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Check merchant_settings table separately
      const { data: merchantSettings } = await supabase
        .from('merchant_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (merchantSettings) {
        setIsOnline(merchantSettings.is_online || false);
        setAcceptsNewTrades(merchantSettings.accepts_new_trades || false);
        setAutoAcceptTrades(merchantSettings.auto_accept_trades || false);
        setMinTradeAmount(merchantSettings.min_trade_amount || 0);
        setMaxTradeAmount(merchantSettings.max_trade_amount || 1000000);
        setAvgResponseTime(merchantSettings.avg_response_time_minutes || 15);
        setBtcBuyRate(merchantSettings.btc_buy_rate || 0);
        setBtcSellRate(merchantSettings.btc_sell_rate || 0);
        setEthBuyRate(merchantSettings.eth_buy_rate || 0);
        setEthSellRate(merchantSettings.eth_sell_rate || 0);
        setUsdtBuyRate(merchantSettings.usdt_buy_rate || 0);
        setUsdtSellRate(merchantSettings.usdt_sell_rate || 0);
      }
    } catch (error) {
      console.error('Error loading merchant settings:', error);
      toast({
        title: "Error",
        description: "Failed to load merchant settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMerchantSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Save merchant settings to profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          merchant_settings: settings,
          is_merchant: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your merchant settings have been saved successfully.",
        duration: 3000
      });
    } catch (error) {
      console.error('Error saving merchant settings:', error);
      toast({
        title: "Error",
        description: "Failed to save merchant settings. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setSaving(false);
    }
  };

  const availableCoins = ['BTC', 'USDT', 'ETH', 'DOGE', 'ADA', 'BNB', 'XRP', 'SOL', 'MATIC', 'DOT'];
  const availableCurrencies = ['NGN', 'USD', 'EUR', 'GBP', 'KES', 'ZAR', 'GHS'];
  const availablePaymentMethods = ['bank_transfer', 'mobile_money', 'paypal', 'wise', 'revolut', 'cash_app', 'zelle', 'western_union'];
  const availableCountries = ['Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Uganda', 'Rwanda', 'Tanzania', 'Ethiopia'];

  useEffect(() => {
    fetchCurrentPrices();
  }, []);



  const fetchCurrentPrices = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether,ethereum,dogecoin,cardano,binancecoin,ripple,solana,matic-network,polkadot&vs_currencies=usd');
      const data = await response.json();
      setCurrentPrices({
        BTC: data.bitcoin?.usd || 68500,
        USDT: data.tether?.usd || 1,
        ETH: data.ethereum?.usd || 3200,
        DOGE: data.dogecoin?.usd || 0.15,
        ADA: data.cardano?.usd || 0.45,
        BNB: data.binancecoin?.usd || 300,
        XRP: data.ripple?.usd || 0.60,
        SOL: data.solana?.usd || 180,
        MATIC: data['matic-network']?.usd || 0.85,
        DOT: data.polkadot?.usd || 7.5
      });
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Only save fields that exist in the database schema
      const dbSettings = {
        user_id: user.id,
        merchant_type: settings.merchant_type,
        btc_buy_rate: settings.exchange_rates.BTC?.buy_rate,
        btc_sell_rate: settings.exchange_rates.BTC?.sell_rate,
        usdt_buy_rate: settings.exchange_rates.USDT?.buy_rate,
        usdt_sell_rate: settings.exchange_rates.USDT?.sell_rate,
        min_trade_amount: settings.min_trade_amount,
        max_trade_amount: settings.max_trade_amount,
        auto_accept_trades: settings.auto_accept_trades,
        auto_release_escrow: settings.auto_release_escrow,
        is_online: settings.is_online,
        accepts_new_trades: settings.accepts_new_trades,
        avg_response_time_minutes: settings.avg_response_time_minutes,
        payment_methods: settings.payment_methods
      };

      const { error } = await supabase
        .from('merchant_settings')
        .upsert(dbSettings, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist, show helpful message
          toast({
            title: "Database Setup Required",
            description: "Merchant settings table needs to be created. Please contact support.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

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

        {/* Supported Coins */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Coins size={20} className="text-orange-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Supported Cryptocurrencies</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {availableCoins.map((coin) => (
              <div key={coin} className="flex items-center space-x-2">
                <Checkbox
                  id={`coin-${coin}`}
                  checked={settings.supported_coins.includes(coin)}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({
                      ...prev,
                      supported_coins: checked 
                        ? [...prev.supported_coins, coin]
                        : prev.supported_coins.filter(c => c !== coin)
                    }));
                  }}
                />
                <Label htmlFor={`coin-${coin}`} className="flex items-center">
                  {coin} <span className="text-xs text-gray-500 ml-1">${currentPrices[coin]?.toLocaleString()}</span>
                </Label>
              </div>
            ))}
          </div>
        </Card>

        {/* Supported Currencies */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Globe size={20} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Supported Currencies</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {availableCurrencies.map((currency) => (
              <div key={currency} className="flex items-center space-x-2">
                <Checkbox
                  id={`currency-${currency}`}
                  checked={settings.supported_currencies.includes(currency)}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({
                      ...prev,
                      supported_currencies: checked 
                        ? [...prev.supported_currencies, currency]
                        : prev.supported_currencies.filter(c => c !== currency)
                    }));
                  }}
                />
                <Label htmlFor={`currency-${currency}`}>{currency}</Label>
              </div>
            ))}
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
              <div className="grid grid-cols-2 gap-2 text-sm">
                {settings.supported_coins.map(coin => (
                  <span key={coin}>{coin}: ${currentPrices[coin]?.toLocaleString()}</span>
                ))}
              </div>
              <p className="text-xs text-blue-500 mt-2">Set your rates with 1-3% margin</p>
            </div>

            {settings.supported_coins.map((coin) => (
              <div key={coin} className="border rounded-lg p-3">
                <h3 className="font-medium mb-2">{coin} Rates</h3>
                <div className="grid grid-cols-2 gap-4">
                  {settings.supported_currencies.map((currency) => (
                    <div key={`${coin}-${currency}`} className="space-y-2">
                      <div>
                        <Label>Buy Rate ({currency})</Label>
                        <Input
                          type="number"
                          placeholder={`${coin} buy rate in ${currency}`}
                          value={settings.exchange_rates[coin]?.buy_rate || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            exchange_rates: {
                              ...prev.exchange_rates,
                              [coin]: {
                                ...prev.exchange_rates[coin],
                                buy_rate: e.target.value ? Number(e.target.value) : null
                              }
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Sell Rate ({currency})</Label>
                        <Input
                          type="number"
                          placeholder={`${coin} sell rate in ${currency}`}
                          value={settings.exchange_rates[coin]?.sell_rate || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            exchange_rates: {
                              ...prev.exchange_rates,
                              [coin]: {
                                ...prev.exchange_rates[coin],
                                sell_rate: e.target.value ? Number(e.target.value) : null
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <CreditCard size={20} className="text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {availablePaymentMethods.map((method) => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  id={`payment-${method}`}
                  checked={settings.payment_methods.includes(method)}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({
                      ...prev,
                      payment_methods: checked 
                        ? [...prev.payment_methods, method]
                        : prev.payment_methods.filter(m => m !== method)
                    }));
                  }}
                />
                <Label htmlFor={`payment-${method}`} className="capitalize">
                  {method.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </Card>

        {/* Service Locations */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <MapPin size={20} className="text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Service Locations</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {availableCountries.map((country) => (
              <div key={country} className="flex items-center space-x-2">
                <Checkbox
                  id={`location-${country}`}
                  checked={settings.service_locations.includes(country)}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({
                      ...prev,
                      service_locations: checked 
                        ? [...prev.service_locations, country]
                        : prev.service_locations.filter(l => l !== country)
                    }));
                  }}
                />
                <Label htmlFor={`location-${country}`}>{country}</Label>
              </div>
            ))}
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

        {/* Business Hours */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Calendar size={20} className="text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Business Hours</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Business Hours</Label>
                <p className="text-sm text-gray-600">Set specific times when you accept trades</p>
              </div>
              <Switch
                checked={settings.business_hours.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  business_hours: { ...prev.business_hours, enabled: checked }
                }))}
              />
            </div>

            {settings.business_hours.enabled && (
              <div className="space-y-3">
                {Object.entries(settings.business_hours).map(([day, hours]) => {
                  if (day === 'enabled' || typeof hours === 'boolean') return null;
                  const dayHours = hours as { start: string; end: string; enabled: boolean };
                  return (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-20">
                        <Checkbox
                          checked={dayHours.enabled}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            business_hours: {
                              ...prev.business_hours,
                              [day]: { ...dayHours, enabled: checked as boolean }
                            }
                          }))}
                        />
                        <Label className="capitalize ml-2">{day}</Label>
                      </div>
                      {dayHours.enabled && (
                        <>
                          <Input
                            type="time"
                            value={dayHours.start}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              business_hours: {
                                ...prev.business_hours,
                                [day]: { ...dayHours, start: e.target.value }
                              }
                            }))}
                            className="w-24"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={dayHours.end}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              business_hours: {
                                ...prev.business_hours,
                                [day]: { ...dayHours, end: e.target.value }
                              }
                            }))}
                            className="w-24"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

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

            <div className="flex items-center justify-between">
              <div>
                <Label>Require KYC Verification</Label>
                <p className="text-sm text-gray-600">Only trade with verified customers</p>
              </div>
              <Switch
                checked={settings.requires_kyc}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  requires_kyc: checked 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="response_time">Average Response Time</Label>
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

            <div>
              <Label htmlFor="min_rating">Minimum Customer Rating</Label>
              <Select
                value={settings.min_customer_rating.toString()}
                onValueChange={(value) => setSettings(prev => ({ 
                  ...prev, 
                  min_customer_rating: Number(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No minimum</SelectItem>
                  <SelectItem value="3">3+ stars</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="4.5">4.5+ stars</SelectItem>
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