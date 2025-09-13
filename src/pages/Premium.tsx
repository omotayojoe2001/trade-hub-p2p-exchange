import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Premium = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to premium payment flow
    navigate('/premium-payment');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to premium upgrade...</p>
      </div>
    </div>
  );
};

export default Premium;