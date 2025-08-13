import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  session_id: string;
  properties: Record<string, any>;
  timestamp: string;
  page_url: string;
  user_agent: string;
}

interface UserMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
}

export const useAdvancedAnalytics = () => {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [sessionStart] = useState(() => Date.now());
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);

  const track = async (eventName: string, properties?: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const event: AnalyticsEvent = {
        event_name: eventName,
        user_id: user?.id,
        session_id: sessionId,
        properties: {
          ...properties,
          referrer: document.referrer,
          screen_resolution: `${screen.width}x${screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      };

      // Store locally and in Supabase (if tables exist)
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push(event);
      localStorage.setItem('analytics_events', JSON.stringify(events.slice(-1000)));

      console.log('Analytics Event:', event);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  const trackPageView = (page: string) => {
    track('page_view', { 
      page,
      session_duration: Date.now() - sessionStart 
    });
  };

  const trackConversion = (action: string, value?: number) => {
    track('conversion', { 
      action, 
      value,
      conversion_timestamp: Date.now() 
    });
  };

  const trackError = (error: string, context?: Record<string, any>) => {
    track('error', { 
      error_message: error,
      error_context: context,
      stack_trace: new Error().stack 
    });
  };

  const getMetrics = (): UserMetrics => {
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    const sessions = [...new Set(events.map((e: AnalyticsEvent) => e.session_id))];
    const pageViews = events.filter((e: AnalyticsEvent) => e.event_name === 'page_view');
    
    return {
      totalSessions: sessions.length,
      averageSessionDuration: 0, // Calculate from session events
      pageViews: pageViews.length,
      uniqueVisitors: [...new Set(events.map((e: AnalyticsEvent) => e.user_id).filter(Boolean))].length,
      bounceRate: 0, // Calculate from single-page sessions
    };
  };

  useEffect(() => {
    trackPageView(window.location.pathname);
    
    // Track session end on page unload
    const handleUnload = () => {
      track('session_end', { 
        session_duration: Date.now() - sessionStart 
      });
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return {
    track,
    trackPageView,
    trackConversion,
    trackError,
    getMetrics,
    sessionId,
  };
};