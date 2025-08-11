import React, { useState } from 'react';
import { ArrowLeft, MapPin, Phone, User, Store, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLocation, useNavigate } from 'react-router-dom';

const CashPickupDetails: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;
  const { amount, nairaAmount } = state || {};

  const [locationId, setLocationId] = useState<string>('center_lekki');
  const [time, setTime] = useState<string>('today_3pm');
  const [contact, setContact] = useState<string>('');

  const locations = [
    { id: 'center_lekki', name: 'Lekki II Partner Center' },
    { id: 'center_victoria', name: 'Victoria Island Partner Center' },
    { id: 'center_ikeja', name: 'Ikeja Partner Center' },
  ];

  const times = [
    { id: 'today_3pm', label: 'Today, 3:00 PM' },
    { id: 'today_6pm', label: 'Today, 6:00 PM' },
    { id: 'tomorrow_10am', label: 'Tomorrow, 10:00 AM' },
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="flex items-center p-4 border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-2">
          <Store size={18} className="text-green-600" />
          <h1 className="text-lg font-semibold text-gray-900">Cash Pickup Details</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-4">
          <label className="text-sm text-gray-700">Choose Pickup Location</label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {locations.map(loc => (
              <button
                key={loc.id}
                onClick={() => setLocationId(loc.id)}
                className={`border rounded-lg p-3 text-left ${locationId===loc.id ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              >
                <MapPin size={16} className="inline mr-2 text-green-600" />
                <span className="font-medium text-gray-900">{loc.name}</span>
              </button>
            ))}
          </div>

          <label className="text-sm text-gray-700 mt-4 block">Pickup Time</label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {times.map(t => (
              <button
                key={t.id}
                onClick={() => setTime(t.id)}
                className={`px-3 py-2 border rounded-lg text-sm ${time===t.id ? 'border-green-500 text-green-700 bg-green-50' : 'border-gray-200 text-gray-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="text-sm text-gray-700 mt-4 block">Contact Phone</label>
          <input className="border rounded-lg p-3 w-full" value={contact} onChange={e=>setContact(e.target.value)} placeholder="+234..." />
        </Card>

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => navigate('/payment-status', { state: { amount, nairaAmount, mode: 'sell', method: 'pickup', locationId, time, contact } })}
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
};

export default CashPickupDetails;
