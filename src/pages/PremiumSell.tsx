import React, { useMemo, useState } from 'react';
import { ArrowLeft, DollarSign, MapPin, Truck, Store, Calendar, Clock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import AmountInput from '@/components/sell-crypto/AmountInput';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumSell: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [currentRate, setCurrentRate] = useState(1755000);
  const [method, setMethod] = useState<'delivery' | 'pickup' | null>(null);

  const calculateNairaValue = useMemo(() => () => {
    if (!amount || isNaN(parseFloat(amount))) return 0;
    return parseFloat(amount) * currentRate;
  }, [amount, currentRate]);

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center">
          <button onClick={() => navigate('/premium-dashboard')} className="mr-3">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Sell Crypto (Premium)</h1>
        </div>
        <Crown size={18} className="text-yellow-500" />
      </div>

      <div className="p-4 space-y-6">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Amount</h3>
          <AmountInput
            amount={amount}
            onAmountChange={setAmount}
            currentRate={currentRate}
            calculateNairaValue={calculateNairaValue}
          />
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">How do you want to receive cash?</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMethod('delivery')}
              className={`border rounded-lg p-4 text-left ${method==='delivery' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <Truck className="text-blue-600 mb-2" size={18} />
              <div className="font-medium text-gray-900">Cash Delivery</div>
              <div className="text-xs text-gray-600">We deliver to your address</div>
            </button>
            <button
              onClick={() => setMethod('pickup')}
              className={`border rounded-lg p-4 text-left ${method==='pickup' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <Store className="text-green-600 mb-2" size={18} />
              <div className="font-medium text-gray-900">Cash Pickup</div>
              <div className="text-xs text-gray-600">Pick up from nearby partner</div>
            </button>
          </div>
        </Card>

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!amount || !method}
          onClick={() => {
            if (!method) return;
            if (method === 'delivery') {
              navigate('/premium/cash-delivery', { state: { amount, nairaAmount: calculateNairaValue(), method } });
            } else {
              navigate('/premium/cash-pickup', { state: { amount, nairaAmount: calculateNairaValue(), method } });
            }
          }}
        >
          Continue
        </Button>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumSell;
