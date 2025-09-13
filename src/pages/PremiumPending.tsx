import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Crown, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const PremiumPending = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timeout

  useEffect(() => {
    if (!user) return;

    // Check payment status every 10 seconds
    const checkPayment = async () => {
      const { data } = await supabase
        .from('escrow_addresses')
        .select('*')
        .ilike('trade_id', `premium_${user.id}_%`)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setStatus('confirmed');
        setTimeout(() => navigate('/premium-dashboard'), 2000);
      }
    };

    const paymentInterval = setInterval(checkPayment, 10000);
    checkPayment(); // Check immediately

    // Timeout after 5 minutes
    const timeoutInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setStatus('failed');
          setTimeout(() => navigate('/'), 3000); // Redirect to home after 3 seconds
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(paymentInterval);
      clearInterval(timeoutInterval);
    };
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="p-8 max-w-sm w-full text-center">
        {status === 'pending' && (
          <>
            <Clock size={48} className="text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Payment Pending</h2>
            <p className="text-gray-600 mb-4">
              We're monitoring your payment. Premium access will be granted automatically once confirmed.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Timeout in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            {process.env.NODE_ENV === 'development' && (
              <button 
                onClick={() => {
                  // Skip database - just redirect to premium
                  navigate('/premium-dashboard');
                }}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded text-sm"
              >
                Grant Premium Access (Test)
              </button>
            )}
          </>
        )}
        
        {status === 'confirmed' && (
          <>
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <Crown size={24} className="text-yellow-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold mb-2">Payment Confirmed!</h2>
            <p className="text-gray-600">Welcome to Premium! Redirecting...</p>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">✕</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Payment Not Confirmed</h2>
            <p className="text-gray-600 mb-4">
              We didn't receive your payment within the time limit. Please try again or contact support.
            </p>
            <p className="text-sm text-gray-500">Redirecting to home...</p>
          </>
        )}
      </Card>
    </div>
  );
};

export default PremiumPending;