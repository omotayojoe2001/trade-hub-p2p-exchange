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
    // Only show global session modal on home page or main navigation pages
    const showOnPages = ['/', '/home', '/dashboard', '/trade-requests'];
    const currentPath = location.pathname;
    
    if (showOnPages.includes(currentPath)) {
      const allSessions = [
        ...getActiveSessionsByType('credit_purchase'),
        ...getActiveSessionsByType('crypto_buy'),
        ...getActiveSessionsByType('crypto_sell'),
        ...getActiveSessionsByType('escrow')
      ];
      
      if (allSessions.length > 0) {
        setGlobalSessions(allSessions);
        setShowGlobalModal(true);
      }
    }
  }, [location.pathname]);

  const handleRestoreGlobalSession = (session: any) => {
    setShowGlobalModal(false);
    
    // Navigate to appropriate page based on session type
    switch (session.type) {
      case 'credit_purchase':
        navigate('/credits-purchase', { 
          state: { 
            restoreSession: true, 
            sessionData: session 
          } 
        });
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
  };

  const handleDismissGlobalSession = (sessionId: string) => {
    removeSession(sessionId);
    const remainingSessions = globalSessions.filter(s => s.id !== sessionId);
    setGlobalSessions(remainingSessions);
    
    if (remainingSessions.length === 0) {
      setShowGlobalModal(false);
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
      onClose={() => setShowGlobalModal(false)}
    />
  );
};

export default GlobalSessionManager;