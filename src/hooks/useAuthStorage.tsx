import { useState, useCallback } from 'react';

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  lastLoginAt: string;
}

const AUTH_STORAGE_KEY = 'central_exchange_last_user';

export const useAuthStorage = () => {
  const [storedUser, setStoredUser] = useState<StoredUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveUser = useCallback((user: { id: string; email: string; displayName?: string }) => {
    const userData: StoredUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName || user.email,
      lastLoginAt: new Date().toISOString()
    };
    
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    setStoredUser(userData);
  }, []);

  const clearStoredUser = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setStoredUser(null);
  }, []);

  const hasStoredUser = useCallback(() => {
    return storedUser !== null;
  }, [storedUser]);

  return {
    storedUser,
    saveUser,
    clearStoredUser,
    hasStoredUser
  };
};