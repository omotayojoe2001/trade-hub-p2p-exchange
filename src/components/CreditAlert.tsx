import React, { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { creditsService } from '@/services/creditsService';
import { useToast } from '@/hooks/use-toast';

const CreditAlert = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credits, setCredits] = useState(0);
  const [hasShownLowAlert, setHasShownLowAlert] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const checkCredits = async () => {
      try {
        const userCredits = await creditsService.getUserCredits(user.id);
        if (typeof userCredits === 'number') {
          setCredits(userCredits);

          // Show low credit alert if credits < 10 and haven't shown today
          if (userCredits < 10 && !hasShownLowAlert) {
            const lastAlertDate = localStorage.getItem('lastLowCreditAlert');
            const today = new Date().toDateString();
            
            if (lastAlertDate !== today) {
              toast({
                title: "Low Credits",
                description: `You have ${userCredits} credits remaining. Consider purchasing more to continue trading.`,
                variant: "destructive",
              });
              localStorage.setItem('lastLowCreditAlert', today);
              setHasShownLowAlert(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking credits:', error);
      }
    };

    // Initial check
    checkCredits();
    
    // Check credits every 60 seconds (reduced frequency)
    const interval = setInterval(checkCredits, 60000);
    return () => clearInterval(interval);
  }, [user?.id, toast, hasShownLowAlert]);

  return null; // This component only shows toasts
};

export default CreditAlert;