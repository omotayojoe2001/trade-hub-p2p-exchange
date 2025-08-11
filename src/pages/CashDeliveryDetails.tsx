import React, { useState } from 'react';
import { ArrowLeft, MapPin, Phone, User, Home, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLocation, useNavigate } from 'react-router-dom';

const CashDeliveryDetails: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;
  const { amount, nairaAmount } = state || {};

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateLoc, setStateLoc] = useState('');
  const [note, setNote] = useState('');

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="flex items-center p-4 border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-2">
          <Building2 size={18} className="text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">Cash Delivery Details</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-4">
          <div className="grid gap-3">
            <label className="text-sm text-gray-700">Full Name</label>
            <input className="border rounded-lg p-3" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Recipient full name" />
          </div>
          <div className="grid gap-3 mt-4">
            <label className="text-sm text-gray-700">Phone</label>
            <input className="border rounded-lg p-3" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+234..." />
          </div>
          <div className="grid gap-3 mt-4">
            <label className="text-sm text-gray-700">Address</label>
            <input className="border rounded-lg p-3" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Street, number" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-sm text-gray-700">City</label>
              <input className="border rounded-lg p-3 w-full" value={city} onChange={e=>setCity(e.target.value)} placeholder="City" />
            </div>
            <div>
              <label className="text-sm text-gray-700">State</label>
              <input className="border rounded-lg p-3 w-full" value={stateLoc} onChange={e=>setStateLoc(e.target.value)} placeholder="State" />
            </div>
          </div>
          <div className="grid gap-3 mt-4">
            <label className="text-sm text-gray-700">Delivery Note (optional)</label>
            <textarea className="border rounded-lg p-3 min-h-[80px]" value={note} onChange={e=>setNote(e.target.value)} placeholder="Gate code, landmarks, etc" />
          </div>
        </Card>

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => navigate('/payment-status', { state: { amount, nairaAmount, mode: 'sell', method: 'delivery', address, city, state: stateLoc, phone, fullName } })}
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
};

export default CashDeliveryDetails;
