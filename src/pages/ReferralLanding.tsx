import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Gift } from 'lucide-react';

const ReferralLanding = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      localStorage.setItem('referral_code', userId);
      // Auto redirect after 2 seconds
      const timer = setTimeout(() => {
        navigate('/auth');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gift className="w-8 h-8 text-blue-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            You've been invited!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Join P2P Crypto Hub and start trading cryptocurrency securely.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">🎉 Special Bonus</p>
            <p className="text-green-700 text-sm">
              Get bonus rewards when you complete your first trade!
            </p>
          </div>
          
          <p className="text-sm text-gray-500">
            Redirecting to signup...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralLanding;