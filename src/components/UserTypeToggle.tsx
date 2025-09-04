import React, { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Store, ArrowRightLeft } from 'lucide-react';
import { merchantService } from '@/services/merchantService';
import { useAuth } from '@/hooks/useAuth';

interface UserTypeToggleProps {
  className?: string;
}

const UserTypeToggle: React.FC<UserTypeToggleProps> = ({ className }) => {
  const [userType, setUserType] = useState<'customer' | 'merchant'>('customer');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserType = async () => {
      if (user) {
        const isMerchant = await merchantService.isUserMerchant(user.id);
        setUserType(isMerchant ? 'merchant' : 'customer');
      }
    };

    fetchUserType();
  }, [user]);

  const handleToggle = async () => {
    if (!user) return;

    setLoading(true);
    const enableMerchant = userType === 'customer';

    try {
      const result = await merchantService.toggleMerchantMode(user.id, enableMerchant);

      if (result.success) {
        setUserType(result.is_merchant ? 'merchant' : 'customer');
        toast({
          title: "Success",
          description: `Switched to ${result.is_merchant ? 'merchant' : 'customer'} mode`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to switch user type",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User className={`h-5 w-5 ${userType === 'customer' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${userType === 'customer' ? 'text-blue-600' : 'text-gray-500'}`}>
                Customer
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={userType === 'merchant'}
                onCheckedChange={handleToggle}
                disabled={loading}
              />
              <ArrowRightLeft className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex items-center space-x-2">
              <Store className={`h-5 w-5 ${userType === 'merchant' ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${userType === 'merchant' ? 'text-green-600' : 'text-gray-500'}`}>
                Merchant
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-2">
          <p className="text-xs text-gray-500">
            {userType === 'customer' 
              ? 'You are in customer mode - buy crypto from merchants'
              : 'You are in merchant mode - sell crypto to customers'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserTypeToggle;