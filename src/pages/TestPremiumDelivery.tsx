import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, MapPin, Phone, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const TestPremiumDelivery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [testData, setTestData] = useState('Loading...');

  useEffect(() => {
    testDatabase();
  }, [user]);

  const testDatabase = async () => {
    if (!user) {
      setTestData('No user logged in');
      return;
    }

    try {
      // Test if tables exist
      const { data: addresses, error: addressError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      const { data: contacts, error: contactError } = await supabase
        .from('user_contacts')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      setTestData(`
        User ID: ${user.id}
        Address Error: ${addressError?.message || 'None'}
        Contact Error: ${contactError?.message || 'None'}
        Addresses Found: ${addresses?.length || 0}
        Contacts Found: ${contacts?.length || 0}
      `);
    } catch (error) {
      setTestData(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-trade" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold flex items-center">
                <Crown size={20} className="mr-2 text-gray-600" />
                Test Premium Cash Delivery
              </h1>
              <p className="text-gray-600 text-sm">Database connection test</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Database Test Results</h3>
          <pre className="text-sm bg-gray-100 p-3 rounded whitespace-pre-wrap">
            {testData}
          </pre>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Manual Address Entry</h3>
          <div className="space-y-3">
            <Input placeholder="Street address" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="City" />
              <Input placeholder="State" />
            </div>
            <Input placeholder="Landmark (optional)" />
          </div>
        </Card>

        <Button
          onClick={() => navigate('/premium-trade')}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Back to Premium Trade
        </Button>
      </div>
    </div>
  );
};

export default TestPremiumDelivery;