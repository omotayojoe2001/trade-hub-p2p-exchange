import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import SessionRecoveryModal from '@/components/SessionRecoveryModal';
import { useToast } from '@/hooks/use-toast';

const GlobalSessionManager: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getActiveSessionsByType, removeSession } = useSessionPersistence();
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalSessions, setGlobalSessions] = useState<any[]>([]);

  useEffect(() => {
    // ONLY show on home page and ONLY once per session
    const showOnPages = ['/home'];
    const currentPath = location.pathname;
    
    // Check if we've already shown the modal in this browser session
    const hasShownModal = sessionStorage.getItem('session_modal_shown');
    
    if (showOnPages.includes(currentPath) && !hasShownModal) {
      const allSessions = [
        ...getActiveSessionsByType('credit_purchase'),
        ...getActiveSessionsByType('crypto_buy'),
        ...getActiveSessionsByType('crypto_sell'),
        ...getActiveSessionsByType('escrow')
      ];
      
      if (allSessions.length > 0) {
        setGlobalSessions(allSessions);
        setShowGlobalModal(true);
        // Mark that we've shown the modal
        sessionStorage.setItem('session_modal_shown', 'true');
      }
    }
  }, [location.pathname, getActiveSessionsByType]);

  const handleRestoreGlobalSession = (session: any) => {
    console.log('🔄 Restoring session:', session);
    setShowGlobalModal(false);
    
    try {
      // Navigate to appropriate page based on session type
      switch (session.type) {
        case 'credit_purchase':
          navigate('/credits-purchase');
          // Dispatch restoration event
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('restorePaymentSession', {
              detail: session
            }));
          }, 100);
          break;
        case 'crypto_buy':
          navigate('/buy-crypto-flow', { 
            state: { 
              restoreSession: true, 
              sessionData: session,
              selectedCoin: session.data.selectedCoin,
              coinData: session.data.coinData
            } 
          });
          break;
        case 'crypto_sell':
          navigate('/sell-crypto-flow', { 
            state: { 
              restoreSession: true, 
              sessionData: session 
            } 
          });
          break;
        case 'escrow':
          navigate('/escrow-flow', { 
            state: { 
              restoreSession: true, 
              sessionData: session,
              tradeId: session.data.transactionId,
              amount: session.data.tradeAmount,
              mode: session.data.mode,
              deliveryType: session.data.deliveryType,
              deliveryAddress: session.data.deliveryAddress,
              serviceFee: session.data.serviceFee
            } 
          });
          break;
        default:
          toast({
            title: "Unknown Session Type",
            description: "Unable to restore this session",
            variant: "destructive"
          });
      }
      
      toast({
        title: "Session Restored",
        description: "Resuming your transaction...",
      });
    } catch (error) {
      console.error('Error restoring session:', error);
      toast({
        title: "Restore Failed",
        description: "Unable to restore session",
        variant: "destructive"
      });
    }
  };

  const handleDismissGlobalSession = (sessionId: string) => {
    console.log('❌ Dismissing session:', sessionId);
    
    try {
      removeSession(sessionId);
      const remainingSessions = globalSessions.filter(s => s.id !== sessionId);
      setGlobalSessions(remainingSessions);
      
      if (remainingSessions.length === 0) {
        setShowGlobalModal(false);
      }
      
      toast({
        title: "Session Dismissed",
        description: "Transaction session removed",
      });
    } catch (error) {
      console.error('Error dismissing session:', error);
      toast({
        title: "Dismiss Failed",
        description: "Unable to dismiss session",
        variant: "destructive"
      });
    }
  };

  if (!showGlobalModal || globalSessions.length === 0) {
    return null;
  }

  return (
    <SessionRecoveryModal
      sessions={globalSessions}
      onRestore={handleRestoreGlobalSession}
      onDismiss={handleDismissGlobalSession}
      onClose={() => {
        setShowGlobalModal(false);
        // Mark that user has seen and closed the modal
        sessionStorage.setItem('session_modal_dismissed', 'true');
      }}
    />
  );
};

export default GlobalSessionManager;