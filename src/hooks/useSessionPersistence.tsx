import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SessionData {
  currentStep: string;
  completedSteps: string[];
  formData: Record<string, any>;
  timestamp: Date;
}

interface UserSession {
  id: string;
  user_id: string;
  session_data: Record<string, any>;
  session_type: 'trade_flow' | 'premium_flow' | 'onboarding' | 'kyc';
  current_step: string;
  completed_steps: string[];
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export const useSessionPersistence = (sessionType: 'trade_flow' | 'premium_flow' | 'onboarding' | 'kyc') => {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session data on mount
  useEffect(() => {
    const loadSession = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('session_type', sessionType)
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSessionData({
            currentStep: data.current_step || '',
            completedSteps: data.completed_steps || [],
            formData: (data.session_data as Record<string, any>) || {},
            timestamp: new Date(data.updated_at)
          });
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [user, sessionType]);

  // Save session data
  const saveSession = useCallback(async (data: Partial<SessionData>) => {
    if (!user) return;

    try {
      const sessionPayload = {
        user_id: user.id,
        session_type: sessionType,
        session_data: { ...sessionData?.formData, ...data.formData },
        current_step: data.currentStep || sessionData?.currentStep || '',
        completed_steps: data.completedSteps || sessionData?.completedSteps || [],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      const { error } = await supabase
        .from('user_sessions')
        .upsert(sessionPayload, {
          onConflict: 'user_id,session_type'
        });

      if (error) throw error;

      setSessionData({
        currentStep: sessionPayload.current_step,
        completedSteps: sessionPayload.completed_steps,
        formData: sessionPayload.session_data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, [user, sessionType, sessionData]);

  // Clear session data
  const clearSession = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .eq('session_type', sessionType);

      if (error) throw error;

      setSessionData(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }, [user, sessionType]);

  // Update current step
  const updateStep = useCallback(async (step: string, markCompleted = true) => {
    const completedSteps = sessionData?.completedSteps || [];
    const newCompletedSteps = markCompleted && !completedSteps.includes(step) 
      ? [...completedSteps, step] 
      : completedSteps;

    await saveSession({
      currentStep: step,
      completedSteps: newCompletedSteps
    });
  }, [sessionData, saveSession]);

  // Update form data
  const updateFormData = useCallback(async (data: Record<string, any>) => {
    await saveSession({
      formData: { ...sessionData?.formData, ...data }
    });
  }, [sessionData, saveSession]);

  return {
    sessionData,
    isLoading,
    saveSession,
    clearSession,
    updateStep,
    updateFormData,
    hasSession: !!sessionData,
    currentStep: sessionData?.currentStep || '',
    completedSteps: sessionData?.completedSteps || [],
    formData: sessionData?.formData || {}
  };
};