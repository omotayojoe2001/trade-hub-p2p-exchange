import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const PremiumBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-brand rounded-lg p-4 text-brand-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold mb-1">Unlock Premium Features</h4>
          <p className="text-sm text-brand-foreground/80 mb-2">Access cash delivery & pickup options</p>
        </div>
        <Button 
          onClick={() => navigate('/premium-payment')}
          className="bg-white text-brand hover:bg-gray-50 px-4 py-2 rounded-lg font-medium"
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
};

export default PremiumBanner;