import React from 'react';
import { Clock, CreditCard, Bitcoin, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SessionData } from '@/hooks/useSessionPersistence';

interface SessionRecoveryModalProps {
  sessions: SessionData[];
  onRestore: (session: SessionData) => void;
  onDismiss: (sessionId: string) => void;
  onClose: () => void;
}

const SessionRecoveryModal: React.FC<SessionRecoveryModalProps> = ({
  sessions,
  onRestore,
  onDismiss,
  onClose
}) => {
  const getSessionIcon = (type: SessionData['type']) => {
    switch (type) {
      case 'credit_purchase':
        return <CreditCard size={20} className="text-blue-600" />;
      case 'crypto_buy':
      case 'crypto_sell':
        return <Bitcoin size={20} className="text-orange-600" />;
      case 'escrow':
        return <Clock size={20} className="text-green-600" />;
      default:
        return <Clock size={20} className="text-gray-600" />;
    }
  };

  const getSessionTitle = (session: SessionData) => {
    switch (session.type) {
      case 'credit_purchase':
        return `Credit Purchase - ${session.data.credits || 0} credits`;
      case 'crypto_buy':
        return `Buy ${session.data.coinType || 'Crypto'} - ₦${session.data.nairaAmount?.toLocaleString() || 0}`;
      case 'crypto_sell':
        return `Sell ${session.data.coinType || 'Crypto'} - ${session.data.amount || 0}`;
      case 'escrow':
        return `Escrow Trade - ${session.data.tradeAmount || 0} ${session.data.tradeCurrency || 'BTC'}`;
      default:
        return 'Transaction';
    }
  };

  const getSessionDescription = (session: SessionData) => {
    const timeAgo = Math.floor((Date.now() - session.timestamp) / (1000 * 60));
    const timeText = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`;
    
    switch (session.type) {
      case 'credit_purchase':
        if (session.step === 2) return `Payment pending • ${timeText}`;
        if (session.step === 3) return `Awaiting confirmation • ${timeText}`;
        return `Step ${session.step} • ${timeText}`;
      case 'crypto_buy':
      case 'crypto_sell':
        if (session.step === 2) return `Payment in progress • ${timeText}`;
        if (session.step === 3) return `Awaiting confirmation • ${timeText}`;
        return `Step ${session.step} • ${timeText}`;
      case 'escrow':
        if (session.step === 2) return `Crypto secured, payment pending • ${timeText}`;
        if (session.step === 3) return `Awaiting merchant confirmation • ${timeText}`;
        return `Step ${session.step} • ${timeText}`;
      default:
        return `Step ${session.step} • ${timeText}`;
    }
  };

  const getStepProgress = (session: SessionData) => {
    const maxSteps = session.type === 'escrow' ? 4 : 3;
    return `${session.step}/${maxSteps}`;
  };

  if (sessions.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Resume Transaction</h2>
            <p className="text-sm text-gray-600">You have unfinished transactions</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {sessions.map((session) => (
            <Card key={session.id} className="p-4 border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getSessionIcon(session.type)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {getSessionTitle(session)}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {getSessionDescription(session)}
                    </p>
                    <div className="flex items-center mt-2">
                      <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Progress: {getStepProgress(session)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-3">
                  <Button
                    size="sm"
                    onClick={() => onRestore(session)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                  >
                    <ArrowRight size={12} className="mr-1" />
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDismiss(session.id)}
                    className="text-gray-500 hover:text-gray-700 text-xs px-3 py-1"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            Sessions expire after 24 hours for security
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionRecoveryModal;