import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { userService, tradeRequestService, notificationService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Basic connection
      const { data: { user } } = await supabase.auth.getUser();
      results.auth = user ? 'Connected' : 'No user logged in';
      
      // Test 2: Database connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        results.database = `Error: ${error.message}`;
      } else {
        results.database = 'Connected';
      }

      // Test 3: Real-time connection
      const channel = supabase.channel('test')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {})
        .subscribe();
      
      if (channel) {
        results.realtime = 'Connected';
        // Clean up
        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 1000);
      } else {
        results.realtime = 'Failed';
      }

      // Test 4: Storage connection
      const { data: storageData, error: storageError } = await supabase.storage
        .from('receipts')
        .list('', { limit: 1 });
      
      if (storageError) {
        results.storage = `Error: ${storageError.message}`;
      } else {
        results.storage = 'Connected';
      }

      setIsConnected(true);
      setTestResults(results);
      
      toast({
        title: "Supabase Connection Test",
        description: "All services are connected successfully!",
      });

    } catch (error) {
      console.error('Supabase test error:', error);
      setIsConnected(false);
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' });
      
      toast({
        title: "Connection Test Failed",
        description: "There was an issue connecting to Supabase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testUserService = async () => {
    if (!isConnected) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "No User",
          description: "Please log in to test user services",
          variant: "destructive",
        });
        return;
      }

      // Test profile creation/update
      const profile = await userService.getProfile(user.id);
      console.log('User profile:', profile);
      
      toast({
        title: "User Service Test",
        description: "User service is working correctly!",
      });

    } catch (error) {
      console.error('User service test error:', error);
      toast({
        title: "User Service Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  const testTradeService = async () => {
    if (!isConnected) return;
    
    try {
      const tradeRequests = await tradeRequestService.getTradeRequests();
      console.log('Trade requests:', tradeRequests);
      
      toast({
        title: "Trade Service Test",
        description: `Found ${tradeRequests.length} trade requests`,
      });

    } catch (error) {
      console.error('Trade service test error:', error);
      toast({
        title: "Trade Service Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  const testNotificationService = async () => {
    if (!isConnected) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "No User",
          description: "Please log in to test notification services",
          variant: "destructive",
        });
        return;
      }

      const notifications = await notificationService.getNotifications(user.id);
      console.log('Notifications:', notifications);
      
      toast({
        title: "Notification Service Test",
        description: `Found ${notifications.length} notifications`,
      });

    } catch (error) {
      console.error('Notification service test error:', error);
      toast({
        title: "Notification Service Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  return {
    isConnected,
    testResults,
    loading,
    testConnection,
    testUserService,
    testTradeService,
    testNotificationService
  };
};
