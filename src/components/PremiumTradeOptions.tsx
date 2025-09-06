import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Zap, Users, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PremiumTradeOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  tradeData: {
    crypto_type: string;
    amount_crypto: number;
    amount_fiat: number;
    rate: number;
    trade_type: string;
    payment_method: string;
  };
}

const PremiumTradeOptions: React.FC<PremiumTradeOptionsProps> = ({
  isOpen,
  onClose,
  tradeData
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleManualMatch = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Create regular trade request  
      const { data, error } = await supabase
        .from('trade_requests')
        .insert({
          user_id: user.id,
          crypto_type: tradeData.crypto_type,
          amount_crypto: tradeData.amount_crypto,
          amount_fiat: tradeData.amount_fiat,
          rate: tradeData.rate,
          trade_type: tradeData.trade_type,
          payment_method: tradeData.payment_method,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Trade Request Posted",
        description: "Your trade request has been posted for manual matching",
      });

      onClose();
    } catch (error) {
      console.error('Error creating manual trade request:', error);
      toast({
        title: "Error",
        description: "Failed to create trade request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMatch = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Create auto-match trade request with vendor system
      const { data: vendorJob, error } = await supabase.rpc('create_premium_trade_with_vendor', {
        p_premium_user_id: user.id,
        p_amount_usd: tradeData.amount_crypto,
        p_delivery_type: 'delivery'
      });

      if (error) throw error;

      if (vendorJob) {
        toast({
          title: "Premium Trade Created!",
          description: `Vendor assigned for ${tradeData.trade_type} ${tradeData.amount_crypto} ${tradeData.crypto_type}`,
        });
      } else {
        toast({
          title: "No Vendor Available",
          description: "No vendors available for premium service right now",
          variant: "destructive"
        });
      }

      onClose();
    } catch (error) {
      console.error('Error creating auto-match trade request:', error);
      toast({
        title: "Error",
        description: "Failed to create auto-match request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            <span>Premium Trade Options</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Trade Details:</strong> {tradeData.trade_type.toUpperCase()} {tradeData.amount_crypto} {tradeData.crypto_type} 
              for ₦{tradeData.amount_fiat.toLocaleString()}
            </p>
          </div>

          <div className="space-y-3">
            <Card className="p-4 border-blue-200 bg-blue-50">
              <div className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900">Auto-Match (Premium)</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Instantly match with an available merchant. Faster and more convenient.
                  </p>
                  <Button 
                    onClick={handleAutoMatch}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Matching...' : 'Auto-Match Now'}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-gray-200">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Manual Match</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Post your request and wait for merchants to respond. More control over who you trade with.
                  </p>
                  <Button 
                    onClick={handleManualMatch}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? 'Posting...' : 'Post Manually'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Auto-match typically completes in under 30 seconds</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumTradeOptions;
