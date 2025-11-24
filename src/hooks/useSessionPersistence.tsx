import { useState, useEffect } from 'react';

export interface SessionData {
  id: string;
  type: 'credit_purchase' | 'crypto_buy' | 'crypto_sell' | 'escrow';
  step: number;
  data: any;
  timestamp: number;
  expiresAt: number;
}

const SESSION_STORAGE_KEY = 'trade_hub_sessions';
const SESSION_EXPIRY_HOURS = 24; // 24 hours

export const useSessionPersistence = () => {
  const [activeSessions, setActiveSessions] = useState<SessionData[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const sessions: SessionData[] = JSON.parse(stored);
        const now = Date.now();
        
        // Filter out expired sessions
        const validSessions = sessions.filter(session => session.expiresAt > now);
        
        setActiveSessions(validSessions);
        
        // Update storage if we removed expired sessions
        if (validSessions.length !== sessions.length) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(validSessions));
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setActiveSessions([]);
    }
  };

  const saveSession = (sessionData: Omit<SessionData, 'timestamp' | 'expiresAt'>) => {
    const now = Date.now();
    const session: SessionData = {
      ...sessionData,
      timestamp: now,
      expiresAt: now + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
    };

    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      let sessions: SessionData[] = stored ? JSON.parse(stored) : [];
      
      // Remove existing session with same ID
      sessions = sessions.filter(s => s.id !== session.id);
      
      // Add new session
      sessions.push(session);
      
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
      setActiveSessions(sessions);
      
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  };

  const getSession = (id: string): SessionData | null => {
    const session = activeSessions.find(s => s.id === id);
    if (session && session.expiresAt > Date.now()) {
      return session;
    }
    return null;
  };

  const updateSession = (id: string, updates: Partial<SessionData>) => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return false;
      
      let sessions: SessionData[] = JSON.parse(stored);
      const sessionIndex = sessions.findIndex(s => s.id === id);
      
      if (sessionIndex === -1) return false;
      
      sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
      
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
      setActiveSessions(sessions);
      
      return true;
    } catch (error) {
      console.error('Error updating session:', error);
      return false;
    }
  };

  const removeSession = (id: string) => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return;
      
      let sessions: SessionData[] = JSON.parse(stored);
      sessions = sessions.filter(s => s.id !== id);
      
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Error removing session:', error);
    }
  };

  const clearAllSessions = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setActiveSessions([]);
  };

  const getActiveSessionsByType = (type: SessionData['type']) => {
    return activeSessions.filter(s => s.type === type && s.expiresAt > Date.now());
  };

  return {
    activeSessions,
    saveSession,
    getSession,
    updateSession,
    removeSession,
    clearAllSessions,
    getActiveSessionsByType,
    loadSessions
  };
};