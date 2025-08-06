import React, { createContext, useContext, useState } from 'react';

interface QuickAuthContextType {
  isQuickAuthActive: boolean;
  setQuickAuthActive: (active: boolean) => void;
}

const QuickAuthContext = createContext<QuickAuthContextType | undefined>(undefined);

export const QuickAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isQuickAuthActive, setIsQuickAuthActive] = useState(false);

  const setQuickAuthActive = (active: boolean) => {
    setIsQuickAuthActive(active);
  };

  return (
    <QuickAuthContext.Provider value={{ isQuickAuthActive, setQuickAuthActive }}>
      {children}
    </QuickAuthContext.Provider>
  );
};

export const useQuickAuth = () => {
  const context = useContext(QuickAuthContext);
  if (context === undefined) {
    throw new Error('useQuickAuth must be used within a QuickAuthProvider');
  }
  return context;
};