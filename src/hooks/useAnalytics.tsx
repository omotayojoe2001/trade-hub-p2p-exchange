import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export const useAnalytics = () => {
  const [sessionId] = useState(() => crypto.randomUUID());

  const track = async (eventName: string, properties?: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const event: AnalyticsEvent = {
        event_name: eventName,
        user_id: user?.id,
        properties: {
          ...properties,
          session_id: sessionId,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      // Store in local storage for now (can be sent to analytics service later)
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push(event);
      localStorage.setItem('analytics_events', JSON.stringify(events.slice(-100))); // Keep last 100

      console.log('Analytics:', event);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  const trackPageView = (page: string) => {
    track('page_view', { page });
  };

  const trackUserAction = (action: string, details?: Record<string, any>) => {
    track('user_action', { action, ...details });
  };

  const getEvents = () => {
    return JSON.parse(localStorage.getItem('analytics_events') || '[]');
  };

  useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);

  return {
    track,
    trackPageView,
    trackUserAction,
    getEvents,
  };
};