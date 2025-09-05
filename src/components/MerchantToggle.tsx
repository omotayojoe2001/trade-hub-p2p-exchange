import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Shield, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MerchantToggle = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [merchantMode, setMerchantMode] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMerchantStatus();
  }, [user]);

  const loadMerchantStatus = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_merchant, merchant_mode')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setIsMerchant(data.is_merchant || false);
        setMerchantMode(data.merchant_mode || false);
      }
    } catch (error) {
      console.error('Error loading merchant status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMerchantMode = async (enabled: boolean) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          merchant_mode: enabled,
          is_merchant: enabled ? true : isMerchant // If enabling merchant mode, also set is_merchant to true
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setMerchantMode(enabled);
      if (enabled) setIsMerchant(true);

      toast({
        title: enabled ? "Merchant Mode Enabled" : "Merchant Mode Disabled",
        description: enabled 
          ? "You are now visible to other traders and can receive trade requests"
          : "You are no longer visible in the merchant list",
      });
    } catch (error) {
      console.error('Error updating merchant mode:', error);
      toast({
        title: "Error",
        description: "Failed to update merchant mode",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${merchantMode ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Shield className={`w-5 h-5 ${merchantMode ? 'text-green-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Merchant Mode</h3>
            <p className="text-sm text-gray-600">
              {merchantMode 
                ? "You're visible to other traders" 
                : "You're not visible in merchant list"
              }
            </p>
          </div>
        </div>
        <Switch
          checked={merchantMode}
          onCheckedChange={toggleMerchantMode}
        />
      </div>
      
      {merchantMode && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Users className="w-4 h-4 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Merchant Mode Active</p>
              <p>Other users can see you in the available merchants list and send you trade requests.</p>
            </div>
          </div>
        </div>
      )}
      
      {!merchantMode && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium">Merchant Mode Disabled</p>
              <p>You won't appear in the merchant list. Enable this to receive trade requests from other users.</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MerchantToggle;
