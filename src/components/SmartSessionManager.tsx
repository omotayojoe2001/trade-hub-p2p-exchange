import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import SessionRecoveryModal from '@/components/SessionRecoveryModal';
import { useToast } from '@/hooks/use-toast';

const SmartSessionManager: React.FC = () => {
  const location = useLocation();
  const { toast } = useToast();
  const { getActiveSessionsByType, removeSession } = useSessionPersistence();
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    // ONLY show on home page and ONLY if user just logged in
    const isHomePage = location.pathname === '/home';
    const hasShownToday = localStorage.getItem('session_modal_shown_today');
    const today = new Date().toDateString();
    
    if (isHomePage && hasShownToday !== today) {
      const allSessions = [
        ...getActiveSessionsByType('credit_purchase'),
        ...getActiveSessionsByType('crypto_buy'),
        ...getActiveSessionsByType('crypto_sell'),
        ...getActiveSessionsByType('escrow')
      ];
      
      if (allSessions.length > 0) {
        setSessions(allSessions);
        setShowModal(true);
        localStorage.setItem('session_modal_shown_today', today);
      }
    }
  }, [location.pathname, getActiveSessionsByType]);

  const handleRestore = (session: any) => {
    setShowModal(false);
    
    // Navigate based on session type
    if (session.type === 'credit_purchase') {
      window.location.href = '/credits-purchase';
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('restorePaymentSession', {
          detail: session
        }));
      }, 500);
    }
    
    toast({
      title: "Session Restored",
      description: "Resuming your transaction...",
    });
  };

  const handleDismiss = (sessionId: string) => {
    removeSession(sessionId);
    const remaining = sessions.filter(s => s.id !== sessionId);
    setSessions(remaining);
    
    if (remaining.length === 0) {
      setShowModal(false);
    }
    
    toast({
      title: "Session Dismissed",
      description: "Transaction session removed",
    });
  };

  const handleClose = () => {
    setShowModal(false);
    localStorage.setItem('session_modal_dismissed_today', new Date().toDateString());
  };

  if (!showModal || sessions.length === 0) {
    return null;
  }

  return (
    <SessionRecoveryModal
      sessions={sessions}
      onRestore={handleRestore}
      onDismiss={handleDismiss}
      onClose={handleClose}
    />
  );
};

export default SmartSessionManager;