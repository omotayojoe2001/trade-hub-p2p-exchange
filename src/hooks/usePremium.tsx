import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    // Check premium status from Supabase user profile
    const checkPremiumStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const isCurrentlyPremium = profile.user_type === 'premium';
          setIsPremium(isCurrentlyPremium);
          setPremiumExpiry(null); // Using user_type instead of expiry dates
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
        setPremiumExpiry(null);
      }
    };

    checkPremiumStatus();
  }, []);

  const setPremium = async (status: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let expiry = null;
      if (status) {
        // Set premium for 1 year
        expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
      }

      // Update database
      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: status ? 'premium' : 'customer'
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setIsPremium(status);
      setPremiumExpiry(expiry);
    } catch (error) {
      console.error('Error updating premium status:', error);
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
