import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

const PushNotificationSetup = () => {
  const { isSupported, isSubscribed, requestPermission } = usePushNotifications();
  const { toast } = useToast();

  console.log('PushNotificationSetup - isSupported:', isSupported, 'isSubscribed:', isSubscribed);

  const handleEnableNotifications = async () => {
    console.log('Enable notifications clicked');
    const success = await requestPermission();
    if (success) {
      // Test with a simple browser notification first
      try {
        new Notification('Test Notification', {
          body: 'Notifications are working!',
          vibrate: [200, 100, 200]
        });
      } catch (e) {
        console.error('Simple notification failed:', e);
      }
      
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive push notifications for trades and messages.",
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive"
      });
    }
  };

  // Always show for testing - remove this line later
  // if (!isSupported) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-3">
        {isSubscribed ? (
          <Bell className="w-5 h-5 text-blue-600" />
        ) : (
          <BellOff className="w-5 h-5 text-gray-500" />
        )}
        <div className="flex-1">
          <h4 className="font-medium text-blue-900">
            {isSubscribed ? 'Notifications Enabled' : 'Enable Push Notifications'}
            {!isSupported && ' (Not Supported)'}
          </h4>
          <p className="text-sm text-blue-700">
            {isSubscribed 
              ? 'You\'ll receive notifications for new trades and messages'
              : isSupported 
                ? 'Get notified instantly when you receive trades or messages'
                : 'Push notifications may not be supported - check console for details'
            }
          </p>
        </div>
        {!isSubscribed && (
          <div className="space-x-2">
            {isSupported && (
              <Button
                onClick={handleEnableNotifications}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Enable
              </Button>
            )}
            <Button
              onClick={async () => {
                console.log('Force enable clicked - bypassing support check');
                try {
                  if ('Notification' in window) {
                    const permission = await Notification.requestPermission();
                    console.log('Force permission result:', permission);
                    if (permission === 'granted') {
                      new Notification('Test', { body: 'Force test worked!' });
                    }
                  } else {
                    console.log('Notification API not available');
                  }
                } catch (e) {
                  console.error('Force test error:', e);
                }
              }}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Force Test
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PushNotificationSetup;