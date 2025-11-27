import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, TrendingUp, Shield, Clock, DollarSign, Coins, Globe, CreditCard, MapPin, Calendar, Save, Loader2, Bitcoin, Banknote, CircleDollarSign } from 'lucide-react';
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
    supported_coins: ['BTC', 'USDT'],
    supported_currencies: ['NGN', 'USD'],
    exchange_rates: {
      BTC: { buy_rate: null, sell_rate: null },
      USDT: { buy_rate: null, sell_rate: null }
    },
    min_trade_amount: 1000,
    max_trade_amount: 10000000,
    auto_accept_trades: false,
    auto_release_escrow: false,
    is_online: true,
    accepts_new_trades: true,
    avg_response_time_minutes: 10,
    payment_methods: ['bank_transfer'],
    service_locations: ['Lagos', 'Abuja'],
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
        setSettings(prev => ({
          ...prev,
          is_online: merchantSettings.is_online || false,
          accepts_new_trades: merchantSettings.accepts_new_trades || false,
          auto_accept_trades: merchantSettings.auto_accept_trades || false,
          min_trade_amount: merchantSettings.min_trade_amount || 0,
          max_trade_amount: merchantSettings.max_trade_amount || 1000000,
          avg_response_time_minutes: merchantSettings.avg_response_time_minutes || 15,
          exchange_rates: {
            ...prev.exchange_rates,
            BTC: { buy_rate: merchantSettings.btc_buy_rate || 0, sell_rate: merchantSettings.btc_sell_rate || 0 },
            ETH: { buy_rate: merchantSettings.eth_buy_rate || 0, sell_rate: merchantSettings.eth_sell_rate || 0 },
            USDT: { buy_rate: merchantSettings.usdt_buy_rate || 0, sell_rate: merchantSettings.usdt_sell_rate || 0 }
          }
        }));
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

  const availableCoins = ['BTC', 'USDT'];
  const availableCurrencies = ['NGN', 'USD'];
  const availablePaymentMethods = ['bank_transfer', 'paypal'];
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
        btc_buy_rate: settings.exchange_rates.BTC?.buy_rate || 0,
        btc_sell_rate: settings.exchange_rates.BTC?.sell_rate || 0,
        usdt_buy_rate: settings.exchange_rates.USDT?.buy_rate || 0,
        usdt_sell_rate: settings.exchange_rates.USDT?.sell_rate || 0,
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
        
      // Update global profile with response time
      await supabase
        .from('profiles')
        .update({ 
          avg_response_time_minutes: settings.avg_response_time_minutes,
          is_merchant: true
        })
        .eq('user_id', user.id);

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
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="flex items-center p-3 bg-white border-b">
        <Link to="/settings" className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-lg font-semibold">Merchant Settings</h1>
      </div>

      <div className="p-3 space-y-2">


        {/* Supported Coins */}
        <div className="bg-gray-50 rounded p-2 border">
          <div className="flex items-center mb-1">
            <Coins size={16} className="text-orange-600 mr-2" />
            <h2 className="font-medium text-sm">Cryptocurrencies</h2>
          </div>
          <div className="space-y-1">
            {availableCoins.map((coin) => (
              <div key={coin} className="flex items-center justify-between p-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    coin === 'BTC' ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    {coin === 'BTC' ? (
                      <Bitcoin size={14} className="text-orange-600" />
                    ) : (
                      <CircleDollarSign size={14} className="text-green-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{coin}</span>
                  <span className="text-xs text-gray-500">${currentPrices[coin]?.toLocaleString()}</span>
                </div>
                <Switch
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
              </div>
            ))}
          </div>
        </div>

        {/* Supported Currencies */}
        <div className="bg-gray-50 rounded p-2 border">
          <div className="flex items-center mb-1">
            <Globe size={16} className="text-blue-600 mr-2" />
            <h2 className="font-medium text-sm">Currencies</h2>
          </div>
          <div className="space-y-1">
            {availableCurrencies.map((currency) => (
              <div key={currency} className="flex items-center justify-between p-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    currency === 'NGN' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {currency === 'NGN' ? (
                      <Banknote size={14} className="text-green-600" />
                    ) : (
                      <DollarSign size={14} className="text-blue-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{currency}</span>
                </div>
                <Switch
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
              </div>
            ))}
          </div>
        </div>

        {/* Exchange Rates */}
        <div className="bg-gray-50 rounded p-2 border">
          <div className="flex items-center mb-1">
            <TrendingUp size={16} className="text-green-600 mr-2" />
            <h2 className="font-medium text-sm">Exchange Rates</h2>
          </div>
          <div className="space-y-1">
            {settings.supported_coins.map((coin) => (
              <div key={coin} className="bg-white rounded p-2">
                <p className="text-xs font-medium mb-1">{coin}</p>
                <div className="grid grid-cols-2 gap-1">
                  {settings.supported_currencies.map((currency) => (
                    <div key={`${coin}-${currency}`} className="space-y-1">
                      <div>
                        <Label className="text-xs">Buy ({currency})</Label>
                        <Input
                          type="number"
                          className="h-7 text-xs"
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
                        <Label className="text-xs">Sell ({currency})</Label>
                        <Input
                          type="number"
                          className="h-7 text-xs"
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
        </div>

        {/* Payment Methods */}
        <div className="bg-gray-50 rounded p-2 border">
          <div className="flex items-center mb-1">
            <CreditCard size={16} className="text-purple-600 mr-2" />
            <h2 className="font-medium text-sm">Payment Methods</h2>
          </div>
          <div className="space-y-1">
            {availablePaymentMethods.map((method) => (
              <div key={method} className="flex items-center justify-between p-1">
                <span className="text-sm capitalize">{method.replace('_', ' ')}</span>
                <Switch
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
              </div>
            ))}
          </div>
        </div>



        {/* Trading Limits */}
        <div className="bg-gray-50 rounded p-2 border">
          <div className="flex items-center mb-1">
            <DollarSign size={16} className="text-orange-600 mr-2" />
            <h2 className="font-medium text-sm">Trading Limits</h2>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div>
              <Label className="text-xs">Min (₦)</Label>
              <Input
                type="number"
                className="h-7 text-xs"
                value={settings.min_trade_amount}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  min_trade_amount: Number(e.target.value) 
                }))}
              />
            </div>
            <div>
              <Label className="text-xs">Max (₦)</Label>
              <Input
                type="number"
                className="h-7 text-xs"
                value={settings.max_trade_amount}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  max_trade_amount: Number(e.target.value) 
                }))}
              />
            </div>
          </div>
        </div>



        {/* Business Hours */}
        <div className="bg-gray-50 rounded p-2 border">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <Calendar size={16} className="text-indigo-600 mr-2" />
              <h2 className="font-medium text-sm">Business Hours</h2>
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
            <div className="space-y-1">
              {Object.entries(settings.business_hours).map(([day, hours]) => {
                if (day === 'enabled' || typeof hours === 'boolean') return null;
                const dayHours = hours as { start: string; end: string; enabled: boolean };
                return (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-xs w-12">{day.slice(0,3)}</span>
                    <div className="flex items-center space-x-1">
                      <Switch
                        checked={dayHours.enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          business_hours: {
                            ...prev.business_hours,
                            [day]: { ...dayHours, enabled: checked as boolean }
                          }
                        }))}
                      />
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
                            className="w-14 h-6 text-xs"
                          />
                          <span className="text-xs">-</span>
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
                            className="w-14 h-6 text-xs"
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Settings */}
        <div className="bg-gray-50 rounded p-2 border">
          <div className="flex items-center mb-1">
            <Clock size={16} className="text-purple-600 mr-2" />
            <h2 className="font-medium text-sm">Availability</h2>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between p-1">
              <span className="text-sm">Online</span>
              <Switch
                checked={settings.is_online}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  is_online: checked 
                }))}
              />
            </div>
            <div className="flex items-center justify-between p-1">
              <span className="text-sm">Accept Trades</span>
              <Switch
                checked={settings.accepts_new_trades}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  accepts_new_trades: checked 
                }))}
              />
            </div>
            <div className="flex items-center justify-between p-1">
              <span className="text-sm">Require KYC</span>
              <Switch
                checked={settings.requires_kyc}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  requires_kyc: checked 
                }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <Label className="text-xs">Response Time</Label>
                <Select
                  value={settings.avg_response_time_minutes.toString()}
                  onValueChange={(value) => setSettings(prev => ({ 
                    ...prev, 
                    avg_response_time_minutes: Number(value) 
                  }))}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 min</SelectItem>
                    <SelectItem value="10">10 min</SelectItem>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Min Rating</Label>
                <Select
                  value={settings.min_customer_rating.toString()}
                  onValueChange={(value) => setSettings(prev => ({ 
                    ...prev, 
                    min_customer_rating: Number(value) 
                  }))}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="4.5">4.5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MerchantSettings;