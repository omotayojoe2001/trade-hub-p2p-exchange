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
      let customerPhone = cashTrade.seller_phone || cashTrade.customer_phone || 'Not provided'; // Use phone from form
      
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
    if (enteredCode.toUpperCase() === delivery?.delivery_code?.toUpperCase()) {
      setCodeValidated(true);
      alert('✅ Code validated! You can now confirm delivery.');
    } else {
      alert('❌ Invalid code! Please ask customer for the correct delivery code.');
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
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vendor/dashboard')}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Customer Delivery</h1>
            <p className="text-sm text-gray-600">${delivery.usd_amount.toLocaleString()} USD Cash</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Customer Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <User className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">Customer Details</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-600">Name:</span>
              <span className="font-medium">{delivery.customer_name || 'Customer'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600">Phone:</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{delivery.customer_phone || 'Not provided'}</span>
                <Button
                  onClick={() => setShowMessage(true)}
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Message
                </Button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Type:</span>
              <span className="font-medium flex items-center">
                {delivery.delivery_type === 'delivery' ? (
                  <><Truck className="w-4 h-4 mr-1" /> Home Delivery</>
                ) : (
                  <><MapPin className="w-4 h-4 mr-1" /> Pickup</>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Amount:</span>
              <span className="font-medium text-green-600">${delivery.usd_amount.toLocaleString()} USD</span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-blue-600">{delivery.delivery_type === 'delivery' ? 'Address:' : 'Location:'}:</span>
              <span className="font-medium text-right flex-1 ml-2">
                {delivery.delivery_type === 'delivery' 
                  ? delivery.delivery_address || 'Address not provided'
                  : delivery.pickup_location || 'Pickup location not provided'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {delivery.status === 'payment_confirmed' && (
          <Button
            onClick={handleStartDelivery}
            disabled={processing}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
          >
            {processing ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Starting Delivery...
              </div>
            ) : (
              <div className="flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Start Delivery Process
              </div>
            )}
          </Button>
        )}

        {/* Always show code validation section */}
        <div className="space-y-4">
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <Lock className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-lg font-bold text-green-800">Delivery Code Validation</span>
            </div>
            
            <div className="bg-white border border-green-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-green-700 mb-3">
                <strong>Ask customer for their delivery code:</strong>
              </p>
              
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                  placeholder="Enter customer's code"
                  className="flex-1 px-3 py-3 border-2 border-green-300 rounded-lg text-center font-mono text-lg tracking-wider uppercase font-bold"
                  maxLength={6}
                  disabled={codeValidated}
                />
                <Button
                  onClick={validateDeliveryCode}
                  disabled={!enteredCode || codeValidated}
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                >
                  {codeValidated ? 'Valid' : 'Validate'}
                </Button>
              </div>
              
              {codeValidated && (
                <div className="bg-green-100 border-2 border-green-400 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-bold">
                    ✅ Code validated! Give ${delivery.usd_amount.toLocaleString()} USD to customer.
                  </p>
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