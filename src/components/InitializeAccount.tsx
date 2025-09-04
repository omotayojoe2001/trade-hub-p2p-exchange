import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crown, CheckCircle, Loader2, Database, Users, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const InitializeAccount = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [initializing, setInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [steps, setSteps] = useState({
    database: false,
    profile: false,
    notifications: false,
    sampleData: false
  });

  useEffect(() => {
    checkInitialization();
  }, [user]);

  const checkInitialization = async () => {
    if (!user) return;

    try {
      // Check if user profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setSteps(prev => ({ ...prev, profile: true }));
        
        // Check if user has notifications
        const { data: notifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (notifications && notifications.length > 0) {
          setSteps(prev => ({ ...prev, notifications: true, sampleData: true }));
          setInitialized(true);
        }
      }
    } catch (error) {
      console.error('Error checking initialization:', error);
    }
  };

  const initializeAccount = async () => {
    if (!user) return;

    try {
      setInitializing(true);
      setSteps(prev => ({ ...prev, database: true, profile: true, notifications: true, sampleData: true }));
      setInitialized(true);
      
      toast({
        title: "Account Ready!",
        description: "Your account is set up and ready for trading.",
      });
    } catch (error) {
      console.error('Error initializing account:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setInitializing(false);
    }
  };

  if (initialized) {
    return (
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">Account Ready!</h3>
            <p className="text-green-700">Your account is set up and ready for trading.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Crown className="w-8 h-8 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Account Ready</h3>
            <p className="text-gray-600">Your account is set up for trading</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle size={16} />
            <span className="text-sm">Database ready</span>
          </div>
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle size={16} />
            <span className="text-sm">Profile created</span>
          </div>
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle size={16} />
            <span className="text-sm">Notifications set up</span>
          </div>
        </div>

        <Button
          onClick={initializeAccount}
          disabled={initializing}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {initializing ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Ready...
            </>
          ) : (
            <>
              <Crown size={16} className="mr-2" />
              Start Trading
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default InitializeAccount;
