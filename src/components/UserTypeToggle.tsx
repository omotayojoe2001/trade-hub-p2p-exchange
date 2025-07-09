import React, { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Store, ArrowRightLeft } from 'lucide-react';

interface UserTypeToggleProps {
  className?: string;
}

const UserTypeToggle: React.FC<UserTypeToggleProps> = ({ className }) => {
  const [userType, setUserType] = useState<'customer' | 'merchant'>('customer');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserType = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserType((profile.user_type as 'customer' | 'merchant') || 'customer');
        }
      }
    };
    
    fetchUserType();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    const newUserType = userType === 'customer' ? 'merchant' : 'customer';
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: newUserType,
          is_merchant: newUserType === 'merchant'
        })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to switch user type",
          variant: "destructive"
        });
        return;
      }

      setUserType(newUserType);
      toast({
        title: "Success",
        description: `Switched to ${newUserType} mode`,
      });
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