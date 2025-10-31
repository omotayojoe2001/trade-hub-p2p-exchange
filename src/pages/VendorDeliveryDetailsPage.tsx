import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, MapPin, Phone, User, Lock, Truck, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MessageThread from '@/components/MessageThread';

interface DeliveryDetails {
  id: string;
  usd_amount: number;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string;
  pickup_location?: string;
  status: string;
  customer_name?: string;
  customer_phone?: string;
  customer_full_address?: string;
}

const VendorDeliveryDetailsPage = () => {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeValidated, setCodeValidated] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    loadDeliveryDetails();
  }, [deliveryId]);

  const loadDeliveryDetails = async () => {
    try {
      console.log('🔍 DEBUG: Loading delivery details for ID:', deliveryId);
      
      const { data: cashTrade, error } = await supabase
        .from('cash_trades')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (error) throw error;
      
      console.log('🔍 DEBUG: Cash trade data:', cashTrade);
      console.log('🔍 DEBUG: Seller ID:', cashTrade.seller_id);
      
      // Get real customer details from seller_id (the person who wants cash)
      let customerName = 'Customer';
      let customerPhone = cashTrade.seller_phone || cashTrade.customer_phone || 'Phone not provided';
      
      console.log('📞 DEBUG: Phone number sources:', {
        seller_phone: cashTrade.seller_phone,
        customer_phone: cashTrade.customer_phone,
        final_used: customerPhone
      });
      
      console.log('🔍 DEBUG: Existing seller_phone in cash_trades:', cashTrade.seller_phone);
      console.log('🔍 DEBUG: Existing customer_phone in cash_trades:', cashTrade.customer_phone);
      
      if (cashTrade.seller_id) {
        console.log('🔍 DEBUG: Fetching customer profile for seller_id:', cashTrade.seller_id);
        
        // Try user_profiles first
        const { data: userProfile, error: userError } = await supabase
          .from('user_profiles')
          .select('full_name, phone')
          .eq('user_id', cashTrade.seller_id)
          .single();
        
        console.log('🔍 DEBUG: User profile result:', { userProfile, userError });
        
        if (userProfile) {
          customerName = userProfile.full_name || 'Customer';
          // Keep the phone from cash_trades (from form), don't override with profile phone
          console.log('✅ DEBUG: Found customer in user_profiles:', { customerName, customerPhone });
        } else {
          // Try profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', cashTrade.seller_id)
            .single();
          
          console.log('🔍 DEBUG: Profiles table result:', { profile, profileError });
          
          if (profile) {
            customerName = profile.display_name || 'Customer';
            console.log('✅ DEBUG: Found customer name in profiles:', customerName);
          }
        }
      } else {
        console.log('❌ DEBUG: No seller_id in cash trade');
      }
      
      // Combine data
      const deliveryData = {
        ...cashTrade,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_full_address: cashTrade.delivery_address || cashTrade.pickup_location
      };
      
      console.log('✅ DEBUG: Customer details set:', {
        name: customerName,
        phone: customerPhone,
        type: cashTrade.delivery_type,
        address: cashTrade.delivery_type === 'delivery' ? cashTrade.delivery_address : cashTrade.pickup_location
      });
      
      console.log('📞 DEBUG: Final phone number source:', {
        seller_phone: cashTrade.seller_phone,
        customer_phone: cashTrade.customer_phone,
        final_phone: customerPhone
      });
      
      console.log('🔍 DEBUG: Final delivery data:', deliveryData);
      setDelivery(deliveryData);
    } catch (error) {
      console.error('Error loading delivery details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!delivery) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('start_delivery_process', {
        cash_trade_id: delivery.id
      });
      
      if (error) throw error;
      
      await loadDeliveryDetails();
    } catch (error) {
      console.error('Error starting delivery:', error);
      alert('Failed to start delivery');
    } finally {
      setProcessing(false);
    }
  };

  const validateDeliveryCode = () => {
    const customerCode = enteredCode.trim().toUpperCase();
    const expectedCode = delivery?.delivery_code?.toString().trim().toUpperCase();
    
    console.log('🔍 Code validation:', {
      entered: customerCode,
      expected: expectedCode,
      match: customerCode === expectedCode
    });
    
    if (customerCode === expectedCode) {
      setCodeValidated(true);
      alert('✅ Code validated! You can now confirm delivery.');
    } else {
      alert(`❌ Invalid code! Expected: ${expectedCode}, Got: ${customerCode}`);
      setEnteredCode('');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!delivery || !codeValidated) {
      alert('Please validate the delivery code first!');
      return;
    }
    
    setProcessing(true);
    try {
      await supabase
        .from('cash_trades')
        .update({ 
          status: 'cash_delivered',
          updated_at: new Date().toISOString()
        })
        .eq('id', delivery.id);

      navigate('/vendor/dashboard');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert('Failed to confirm delivery');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Delivery Not Found</h2>
          <Button onClick={() => navigate('/vendor/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vendor/dashboard')}
            className="mr-3 text-black hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-black">Customer Delivery</h1>
            <p className="text-sm text-gray-600">${delivery.usd_amount.toLocaleString()} USD Cash</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Customer Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Customer Details</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Name:</span>
              <span className="text-gray-900 font-semibold">{delivery.customer_name || 'Customer'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Phone:</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 font-semibold">{delivery.customer_phone || 'Not provided'}</span>
                <Button
                  onClick={() => setShowMessage(true)}
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800 h-7 px-3 text-xs"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Message
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium">Service:</span>
              <span className="text-gray-900 font-semibold flex items-center">
                {delivery.delivery_type === 'delivery' ? (
                  <><Truck className="w-4 h-4 mr-2 text-gray-600" /> Home Delivery</>
                ) : (
                  <><MapPin className="w-4 h-4 mr-2 text-gray-600" /> Pickup Service</>
                )}
              </span>
            </div>
            <div className="bg-black rounded-lg p-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Cash Amount:</span>
                <span className="text-white font-bold text-lg">${delivery.usd_amount.toLocaleString()} USD</span>
              </div>
            </div>
            <div className="py-3 mt-3">
              <span className="text-gray-600 font-medium block mb-2">{delivery.delivery_type === 'delivery' ? 'Delivery Address:' : 'Pickup Location:'}:</span>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-900 font-semibold text-base leading-relaxed">
                  {(() => {
                    let address = delivery.delivery_type === 'delivery' 
                      ? delivery.delivery_address 
                      : delivery.pickup_location;
                    
                    // Parse JSON if it's a string
                    if (typeof address === 'string') {
                      try {
                        const parsed = JSON.parse(address);
                        if (parsed.pickup_location) {
                          return parsed.pickup_location;
                        }
                        if (parsed.address) {
                          return `${parsed.address}${parsed.landmark ? `, Near: ${parsed.landmark}` : ''}`;
                        }
                        return address;
                      } catch {
                        return address;
                      }
                    }
                    
                    // Handle object format
                    if (address && typeof address === 'object') {
                      if (address.pickup_location) {
                        return address.pickup_location;
                      }
                      if (address.address) {
                        return `${address.address}${address.landmark ? `, Near: ${address.landmark}` : ''}`;
                      }
                    }
                    
                    return delivery.delivery_type === 'delivery' 
                      ? 'Address not provided' 
                      : 'Pickup location not provided';
                  })()
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="p-1 bg-orange-100 rounded-full mr-3 mt-0.5">
              <span className="block w-2 h-2 bg-orange-500 rounded-full"></span>
            </div>
            <div>
              <h3 className="text-orange-800 font-semibold mb-2">Important Instructions</h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Contact customer using phone number or message button</li>
                <li>• Meet customer at the address shown above</li>
                <li>• Ask for their 6-digit delivery code</li>
                <li>• Only give cash after code is validated</li>
                <li>• Count the cash carefully before handing over</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Always show code validation section */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Lock className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Step 1: Get Customer Code</span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <p className="text-gray-900 font-medium">
                  Ask customer: "What is your delivery code?"
                </p>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center font-mono text-xl tracking-wider uppercase font-bold bg-white text-gray-900 focus:border-green-500 focus:outline-none"
                  maxLength={6}
                  disabled={codeValidated}
                />
                <Button
                  onClick={validateDeliveryCode}
                  disabled={!enteredCode || codeValidated}
                  className="w-full bg-green-600 text-white hover:bg-green-700 py-3 font-semibold"
                >
                  {codeValidated ? (
                    <><CheckCircle className="w-4 h-4 mr-1" /> Valid</>
                  ) : (
                    'Check Code'
                  )}
                </Button>
              </div>
              
              {codeValidated && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-green-800 font-semibold">Code is correct!</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <p className="text-green-800 font-medium">
                      Give ${delivery.usd_amount.toLocaleString()} USD cash to customer
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleConfirmDelivery}
            disabled={processing || !codeValidated}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold disabled:bg-gray-400"
          >
            {processing ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Confirming Delivery...
              </div>
            ) : (
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {codeValidated ? 'Confirm Cash Delivered' : 'Validate Code First'}
              </div>
            )}
          </Button>
        </div>
      </div>
      
      {/* Message Thread */}
      {showMessage && delivery && (
        <MessageThread
          otherUserId={delivery.seller_id || 'customer'}
          otherUserName={delivery.customer_name || 'Customer'}
          cashTradeId={delivery.id}
          contextType="cash_delivery"
          isOpen={showMessage}
          onClose={() => setShowMessage(false)}
        />
      )}
    </div>
  );
};

export default VendorDeliveryDetailsPage;