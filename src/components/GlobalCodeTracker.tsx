import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Eye, Clock, MapPin, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/hooks/useAuth';

interface ActiveCode {
  code: string;
  orderType: string;
  amount: string;
  currency: string;
  timestamp: number;
  status: 'pending' | 'ready' | 'completed';
}

const GlobalCodeTracker = () => {
  const { isPremium } = usePremium();
  const { user } = useAuth();
  const [activeCodes, setActiveCodes] = useState<ActiveCode[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCode, setSelectedCode] = useState<ActiveCode | null>(null);
  const [isBlinking, setIsBlinking] = useState(true);

  useEffect(() => {
    // Check for active codes on mount
    checkForActiveCodes();

    // Listen for new trade codes
    const handleNewTradeCode = (event: CustomEvent) => {
      checkForActiveCodes();
    };

    window.addEventListener('newTradeCode', handleNewTradeCode as EventListener);

    // Check periodically for status updates
    const interval = setInterval(checkForActiveCodes, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('newTradeCode', handleNewTradeCode as EventListener);
      clearInterval(interval);
    };
  }, []);

  const checkForActiveCodes = () => {
    // Check for multiple active codes
    const storedCodes = localStorage.getItem('activeTradeCodes');
    if (storedCodes) {
      try {
        const codesArray: ActiveCode[] = JSON.parse(storedCodes);
        // Filter out completed codes
        const activeCodes = codesArray.filter(code => code.status !== 'completed');
        setActiveCodes(activeCodes);
        setIsBlinking(activeCodes.some(code => code.status === 'ready'));
      } catch (error) {
        console.error('Error parsing active codes:', error);
        localStorage.removeItem('activeTradeCodes');
      }
    }

    // Also check for single code (backward compatibility)
    const storedCode = localStorage.getItem('activeTradeCode');
    if (storedCode) {
      try {
        const codeData: ActiveCode = JSON.parse(storedCode);
        if (codeData.status !== 'completed') {
          setActiveCodes(prev => {
            const exists = prev.find(c => c.code === codeData.code);
            if (!exists) {
              return [...prev, codeData];
            }
            return prev;
          });
          setIsBlinking(codeData.status === 'ready');
        }
      } catch (error) {
        console.error('Error parsing active code:', error);
        localStorage.removeItem('activeTradeCode');
      }
    }
  };

  const markAsCompleted = (codeToComplete: ActiveCode) => {
    // Update the specific code as completed
    const updatedCodes = activeCodes.map(code =>
      code.code === codeToComplete.code
        ? { ...code, status: 'completed' as const }
        : code
    ).filter(code => code.status !== 'completed');

    setActiveCodes(updatedCodes);

    // Update localStorage
    localStorage.setItem('activeTradeCodes', JSON.stringify(updatedCodes));

    // Close details if this was the selected code
    if (selectedCode?.code === codeToComplete.code) {
      setShowDetails(false);
      setSelectedCode(null);
    }
  };

  const showCodeDetails = (code: ActiveCode) => {
    setSelectedCode(code);
    setShowDetails(true);
  };

  const getOrderTypeDisplay = (orderType: string) => {
    switch (orderType) {
      case 'pickup':
        return 'Cash Pickup';
      case 'delivery':
        return 'Cash Delivery';
      case 'usd-pickup':
        return 'USD Pickup';
      case 'usd-delivery':
        return 'USD Delivery';
      default:
        return 'Order';
    }
  };

  const getOrderIcon = (orderType: string) => {
    switch (orderType) {
      case 'pickup':
      case 'usd-pickup':
        return <MapPin size={16} className="text-white" />;
      case 'delivery':
      case 'usd-delivery':
        return <Truck size={16} className="text-white" />;
      default:
        return <AlertCircle size={16} className="text-white" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'ready':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Processing';
      case 'ready':
        return 'Ready for Collection';
      default:
        return 'Unknown';
    }
  };

  // Don't show for non-premium users or when not logged in
  if (!isPremium || !user || activeCodes.length === 0) {
    return null;
  }

  const primaryCode = activeCodes[0]; // Show the first active code in the indicator

  return (
    <>
      {/* Blinking Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div
          onClick={() => showCodeDetails(primaryCode)}
          className={`w-full h-2 cursor-pointer transition-all duration-500 ${
            getStatusColor(primaryCode.status)
          } ${isBlinking ? 'animate-pulse' : ''}`}
        >
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 text-white text-xs font-medium">
              {getOrderIcon(primaryCode.orderType)}
              <span>
                {activeCodes.length === 1
                  ? 'Active Order - Click to View'
                  : `${activeCodes.length} Active Orders - Click to View`
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={20} className="text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Active Orders ({activeCodes.length})
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Multiple Codes List */}
              <div className="space-y-4">
                {activeCodes.map((code, index) => (
                  <div key={code.code} className="border rounded-lg p-4">
                    {/* Code Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getOrderIcon(code.orderType)}
                        <h4 className="font-semibold text-gray-900">
                          {getOrderTypeDisplay(code.orderType)}
                        </h4>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        code.status === 'ready' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusText(code.status)}
                      </div>
                    </div>

                    {/* Code Display */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-3 text-center">
                      <div className="text-sm text-gray-600 mb-1">Your Code</div>
                      <div className="text-xl font-bold text-gray-900 tracking-wider">
                        {code.code}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Show this code to collect your cash
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">{code.amount} {code.currency}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Order Time:</span>
                        <span className="font-medium">
                          {new Date(code.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <Button
                      onClick={() => markAsCompleted(code)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Eye size={14} className="mr-2" />
                      Mark as Completed
                    </Button>
                  </div>
                ))}
              </div>

              {/* Global Instructions */}
              <div className="bg-blue-50 p-3 rounded-lg mb-4 mt-4">
                <div className="text-sm text-blue-900">
                  <strong>Instructions:</strong>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Keep your codes safe and don't share them</li>
                    <li>• Have a valid ID ready for verification</li>
                    <li>• Our agent will contact you when ready</li>
                    <li>• Complete orders one by one as they're fulfilled</li>
                  </ul>
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="outline"
                onClick={() => setShowDetails(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default GlobalCodeTracker;
