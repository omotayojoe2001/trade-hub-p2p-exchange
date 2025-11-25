import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface PaymentSessionGuardProps {
  children: React.ReactNode;
}

const PaymentSessionGuard: React.FC<PaymentSessionGuardProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    // Only run once per page load
    if (hasCheckedSession) return;
    
    const checkAndRestoreSession = () => {
      try {
        // Check for active credit purchase session
        const activeSession = sessionStorage.getItem('active_credit_purchase');
        const backupSession = localStorage.getItem('backup_credit_purchase');
        
        const sessionData = activeSession ? JSON.parse(activeSession) : 
                           backupSession ? JSON.parse(backupSession) : null;
        
        if (sessionData && location.pathname === '/credits-purchase') {
          // Check if session is still valid (within 24 hours)
          const sessionAge = Date.now() - (sessionData.data?.timestamp || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (sessionAge < maxAge && sessionData.step > 1) {
            console.log('🔄 PaymentSessionGuard: Restoring credit purchase session:', sessionData);
            
            // Dispatch custom event to restore session
            window.dispatchEvent(new CustomEvent('restorePaymentSession', {
              detail: sessionData
            }));
            
            toast({
              title: "Session Restored",
              description: `Resumed your credit purchase at step ${sessionData.step}`,
            });
          }
        }
        
        setHasCheckedSession(true);
      } catch (error) {
        console.error('Error checking payment session:', error);
        setHasCheckedSession(true);
      }
    };

    // Small delay to ensure component is mounted
    const timer = setTimeout(checkAndRestoreSession, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname, hasCheckedSession, toast]);

  // Prevent navigation away from payment pages
  useEffect(() => {
    const criticalPaymentRoutes = ['/credits-purchase', '/credits/purchase'];
    const isCriticalRoute = criticalPaymentRoutes.some(route => location.pathname.includes(route));
    
    if (isCriticalRoute) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        const activeSession = sessionStorage.getItem('active_credit_purchase');
        if (activeSession) {
          const sessionData = JSON.parse(activeSession);
          if (sessionData.step > 1 && sessionData.step < 3) {
            e.preventDefault();
            e.returnValue = 'You have an active payment. Are you sure you want to leave?';
            return 'You have an active payment. Are you sure you want to leave?';
          }
        }
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [location.pathname]);

  return <>{children}</>;
};

export default PaymentSessionGuard;