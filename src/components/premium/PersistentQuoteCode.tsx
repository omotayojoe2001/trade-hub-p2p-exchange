import React, { useState, useEffect } from 'react';
import { Key, Copy, X, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ActiveQuoteCode {
  id: string;
  quoteCode: string; // This is the 6-digit code for vendor
  trackingCode: string; // This is the tracking code
  orderType: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

const PersistentQuoteCode = () => {
  const [activeCodes, setActiveCodes] = useState<ActiveQuoteCode[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is premium
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('user_id', user.id)
          .single();
        
        setUserRole(profile?.is_premium ? 'premium' : 'regular');
      }
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    // Only show for premium users
    if (userRole !== 'premium') {
      return;
    }

    const loadActiveQuoteCodes = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get active cash orders for this user
        const { data: orders, error } = await supabase
          .from('cash_order_tracking')
          .select(`
            id,
            tracking_code,
            order_type,
            usd_amount,
            status,
            created_at,
            vendor_job:vendor_job_id (
              verification_code
            )
          `)
          .eq('user_id', user.id)
          .in('status', ['payment_pending', 'payment_submitted', 'payment_confirmed'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching active orders:', error);
          return;
        }

        const activeQuoteCodes: ActiveQuoteCode[] = orders.map(order => ({
          id: order.id,
          quoteCode: order.vendor_job?.verification_code || '',
          trackingCode: order.tracking_code,
          orderType: order.order_type,
          amount: order.usd_amount,
          currency: 'USD',
          status: order.status,
          created_at: order.created_at
        }));

        setActiveCodes(activeQuoteCodes);
      } catch (error) {
        console.error('Error loading active quote codes:', error);
      }
    };

    // Load immediately
    loadActiveQuoteCodes();

    // Check every 30 seconds for updates
    const interval = setInterval(loadActiveQuoteCodes, 30000);

    return () => clearInterval(interval);
  }, [userRole]);

  const copyToClipboard = async (quoteCode: string) => {
    try {
      await navigator.clipboard.writeText(quoteCode);
      toast({
        title: "Code copied!",
        description: "Quote code copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  const getOrderTypeDisplay = (orderType: string) => {
    switch (orderType) {
      case 'naira_to_usd_pickup':
        return 'Cash Pickup';
      case 'naira_to_usd_delivery':
        return 'Cash Delivery';
      case 'usd-pickup':
        return 'Cash Pickup';
      case 'usd-delivery':
        return 'Cash Delivery';
      default:
        return 'Cash Order';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payment_pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_submitted':
        return 'bg-blue-100 text-blue-800';
      case 'payment_confirmed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Only show for premium users with active codes
  if (userRole !== 'premium' || !isVisible || activeCodes.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className={`bg-yellow-50 border-2 border-yellow-300 shadow-lg transition-all duration-300 ${
        isMinimized ? 'w-16 h-16' : 'w-80'
      }`}>
        {isMinimized ? (
          <div 
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            <div className="relative">
              <Key className="w-6 h-6 text-yellow-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeCodes.length}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">
                  Quote Codes ({activeCodes.length})
                </h3>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-1">
                {activeCodes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-6 w-6 p-0 text-yellow-600 hover:bg-yellow-100"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="h-6 w-6 p-0 text-yellow-600 hover:bg-yellow-100"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                  className="h-6 w-6 p-0 text-yellow-600 hover:bg-yellow-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Show first code prominently */}
            <div className="text-center mb-3">
              <div className="text-2xl font-bold text-yellow-900 mb-1 tracking-wider">
                {activeCodes[0].quoteCode}
              </div>
              <p className="text-xs text-yellow-700">
                {getOrderTypeDisplay(activeCodes[0].orderType)} • ${activeCodes[0].amount}
              </p>
              <div className="inline-block mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activeCodes[0].status)}`}>
                  {activeCodes[0].status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex space-x-2 mb-3">
              <Button
                onClick={() => copyToClipboard(activeCodes[0].quoteCode)}
                variant="outline"
                size="sm"
                className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>

            {/* Show additional codes if expanded */}
            {isExpanded && activeCodes.length > 1 && (
              <div className="space-y-3 border-t border-yellow-200 pt-3">
                <p className="text-xs font-medium text-yellow-800">Other Active Orders:</p>
                {activeCodes.slice(1).map((code, index) => (
                  <div key={code.id} className="bg-yellow-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-lg font-bold text-yellow-900 tracking-wider">
                        {code.quoteCode}
                      </div>
                      <Button
                        onClick={() => copyToClipboard(code.quoteCode)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-yellow-600 hover:bg-yellow-200"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-yellow-700">
                      {getOrderTypeDisplay(code.orderType)} • ${code.amount}
                    </div>
                    <div className="inline-block mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(code.status)}`}>
                        {code.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2 text-xs text-yellow-600 text-center">
              ⚠️ Give these codes to vendors for delivery confirmation
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PersistentQuoteCode;
