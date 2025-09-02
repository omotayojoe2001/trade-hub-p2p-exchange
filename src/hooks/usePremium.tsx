import React, { createContext, useContext, useState, useEffect } from 'react';

interface PremiumContextType {
  isPremium: boolean;
  setPremium: (status: boolean) => void;
  premiumFeatures: string[];
  premiumExpiry: Date | null;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState<Date | null>(null);

  const premiumFeatures = [
    'priority_trading',
    'cash_delivery',
    'currency_conversion',
    'sell_for_cash',
    'premium_support',
    'advanced_analytics',
    'instant_withdrawals',
    'trending_coins',
    'refer_earn_bonus'
  ];

  useEffect(() => {
    // Check premium status from localStorage
    const premiumStatus = localStorage.getItem('premium-status');
    const premiumExpiryStr = localStorage.getItem('premium-expiry');
    
    if (premiumStatus === 'true' && premiumExpiryStr) {
      const expiry = new Date(premiumExpiryStr);
      if (expiry > new Date()) {
        setIsPremium(true);
        setPremiumExpiry(expiry);
      } else {
        // Premium expired
        localStorage.removeItem('premium-status');
        localStorage.removeItem('premium-expiry');
        setIsPremium(false);
        setPremiumExpiry(null);
      }
    }
  }, []);

  const setPremium = (status: boolean) => {
    setIsPremium(status);
    
    if (status) {
      // Set premium for 1 year
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      setPremiumExpiry(expiry);
      
      localStorage.setItem('premium-status', 'true');
      localStorage.setItem('premium-expiry', expiry.toISOString());
    } else {
      setPremiumExpiry(null);
      localStorage.removeItem('premium-status');
      localStorage.removeItem('premium-expiry');
    }
  };

  return (
    <PremiumContext.Provider value={{
      isPremium,
      setPremium,
      premiumFeatures,
      premiumExpiry
    }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};
