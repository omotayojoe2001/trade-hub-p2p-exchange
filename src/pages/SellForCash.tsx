import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { creditsService, CREDIT_COSTS, calculatePlatformFeeCredits, calculateTotalCreditsForCash } from '@/services/creditsService';
import NotesSection from '@/components/sell-crypto/NotesSection';
import SecurityNotice from '@/components/sell-crypto/SecurityNotice';
import LocationSelector from '@/components/LocationSelector';
import DeliveryAddressForm from '@/components/DeliveryAddressForm';
import AnimatedCard from '@/components/animations/AnimatedCard';
import FloatingElement from '@/components/animations/FloatingElement';
import PageTransition from '@/components/animations/PageTransition';
import PulseGlow from '@/components/animations/PulseGlow';
import Button3D from '@/components/animations/Button3D';
import LoadingSpinner3D from '@/components/animations/LoadingSpinner3D';

const SellForCash = () => {
  console.log('SellForCash component rendered at:', new Date().toISOString());
  const [amount, setAmount] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [selectedPayment, setSelectedPayment] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [currentRate, setCurrentRate] = useState(1755000);
  const [userCredits, setUserCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const cryptoOptions = [
    { value: 'BTC', label: 'Bitcoin', rate: 105000, icon: '₿' },
    { value: 'USDT', label: 'Tether', rate: 1, icon: '₮' },
    { value: 'ETH', label: 'Ethereum', rate: 3500, icon: 'Ξ' },
    { value: 'XRP', label: 'Ripple', rate: 2.5, icon: '◉' },
    { value: 'BNB', label: 'Binance Coin', rate: 650, icon: '🔶' },
    { value: 'ADA', label: 'Cardano', rate: 1.2, icon: '₳' },
    { value: 'SOL', label: 'Solana', rate: 250, icon: '◎' },
    { value: 'DOGE', label: 'Dogecoin', rate: 0.4, icon: 'Ð' }
  ];

  // Load user credits
  useEffect(() => {
    const loadCredits = async () => {
      if (user) {
        const credits = await creditsService.getUserCredits(user.id);
        setUserCredits(credits);
      }
    };
    loadCredits();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.relative')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Simulate real-time rate changes
  useEffect(() => {
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 10000;
      setCurrentRate(prev => Math.max(1745000, Math.min(1765000, prev + variation)));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const calculateUSDValue = () => {
    if (!amount || isNaN(parseFloat(amount))) return 0;
    return parseFloat(amount) * currentRate;
  };

  // Helper function to get USD value for credit calculations
  const getUsdValue = () => {
    const usdVal = calculateUSDValue();
    console.log('getUsdValue called, returning:', usdVal);
    return usdVal;
  };

  const getRequiredCredits = () => {
    return selectedPayment === 'pickup' ? CREDIT_COSTS.CASH_PICKUP : CREDIT_COSTS.CASH_DELIVERY;
  };

  const getPlatformFee = () => {
    const usdValue = getUsdValue();
    const fee = calculatePlatformFeeCredits(usdValue);
    console.log('Platform fee calculated:', fee, 'for USD:', usdValue);
    return fee;
  };

  const getTotalCredits = () => {
    const usdValue = getUsdValue();
    const paymentType = selectedPayment as 'pickup' | 'delivery';
    const total = calculateTotalCreditsForCash(usdValue, paymentType);
    console.log('Total credits calculated:', total, 'for USD:', usdValue, 'payment:', paymentType);
    return total;
  };

  const handleSendTradeRequest = async () => {
    if (!user) {
      alert('Please login to continue');
      return;
    }

    // Validate required fields
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid crypto amount');
      return;
    }

    if (selectedPayment === 'delivery' && !deliveryAddress.trim()) {
      alert('Please enter your delivery address');
      return;
    }

    if (selectedPayment === 'pickup' && !pickupLocation.trim()) {
      alert('Please select a pickup location');
      return;
    }

    if (!phoneNumber.trim()) {
      alert('Please enter your phone number');
      return;
    }

    // Check platform fee credits only (service fees calculated later)
    const platformFee = getPlatformFee();
    if (userCredits < platformFee) {
      alert(`You need ${platformFee} credits for platform fee ($${getUsdValue().toFixed(2)} USD). You have ${userCredits} credits.`);
      return;
    }

    setLoading(true);

    try {
      // Navigate to cash escrow flow (credits will be spent after successful trade creation)
      navigate('/cash-escrow-flow', {
        state: {
          amount,
          cryptoType: selectedCrypto,
          usdAmount: calculateUSDValue(),
          mode: 'sell-for-cash',
          deliveryType: selectedPayment,
          deliveryAddress: selectedPayment === 'delivery' ? deliveryAddress : null,
          pickupLocation: selectedPayment === 'pickup' ? pickupLocation : null,
          phoneNumber: phoneNumber,
          serviceFee: 0, // Will be calculated later
          platformFee: getPlatformFee(),
          totalFee: platformFee
        }
      });
    } catch (error) {
      console.error('Error processing trade request:', error);
      alert('Failed to process trade request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <AnimatedCard className="flex items-center justify-between p-4 border-b border-gray-100" hover3D={false}>
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} className="text-gray-700 mr-4" />
          </button>
          <FloatingElement intensity="low">
            <h1 className="text-lg font-semibold text-gray-900">Sell Crypto for Cash</h1>
          </FloatingElement>
        </div>
        <MoreVertical size={24} className="text-gray-700" />
      </AnimatedCard>

      <div className="p-4 space-y-6">
        {/* Credits Display */}
        <AnimatedCard delay={0.1} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-800">Your Credits</span>
            <PulseGlow color="blue" intensity="medium">
              <FloatingElement intensity="low">
                <span className="text-lg font-bold text-blue-900">{userCredits}</span>
              </FloatingElement>
            </PulseGlow>
          </div>
          <div className="text-xs text-blue-600 mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Platform fee (${getUsdValue().toFixed(2)} USD):</span>
              <span>{getPlatformFee()} credits</span>
            </div>
            <div className="text-xs text-amber-600 mt-1">
              Service fees will be calculated after location selection
            </div>
          </div>
        </AnimatedCard>

        {/* Crypto Selection */}
        <div className="space-y-2 relative">
          <h3 className="text-sm font-medium text-gray-700">Cryptocurrency</h3>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
            >
              <span className="flex items-center">
                <span className="text-lg mr-2">{cryptoOptions.find(c => c.value === selectedCrypto)?.icon}</span>
                <span className="font-medium text-blue-600">{selectedCrypto}</span>
                <span className="ml-2 text-gray-500">- {cryptoOptions.find(c => c.value === selectedCrypto)?.label}</span>
              </span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {cryptoOptions.map(crypto => (
                  <button
                    key={crypto.value}
                    type="button"
                    onClick={() => {
                      setSelectedCrypto(crypto.value);
                      setCurrentRate(crypto.rate);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between transition-colors ${
                      selectedCrypto === crypto.value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{crypto.icon}</span>
                      <span className="font-medium">{crypto.value}</span>
                      <span className="ml-2 text-sm text-gray-500">{crypto.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">${crypto.rate.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amount Input */}
        <AnimatedCard delay={0.3} className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Amount to Sell</h3>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                const parts = value.split('.');
                if (parts.length <= 2 && (!parts[1] || parts[1].length <= 8)) {
                  setAmount(value);
                }
              }}
              className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">{selectedCrypto}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">Rate: ${currentRate.toLocaleString()}/{selectedCrypto}</span>
            <PulseGlow color="green" intensity="medium">
              <FloatingElement intensity="low">
                <span className="text-sm font-bold text-green-600">${calculateUSDValue().toLocaleString()}</span>
              </FloatingElement>
            </PulseGlow>
          </div>
        </AnimatedCard>

        {/* Delivery Method */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Cash Delivery Method</h3>
          <div className="space-y-3">
            <div 
              onClick={() => setSelectedPayment('pickup')}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPayment === 'pickup' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="delivery"
                value="pickup"
                checked={selectedPayment === 'pickup'}
                onChange={(e) => {
                  console.log('Pickup selected:', e.target.value);
                  setSelectedPayment(e.target.value);
                }}
                className="mr-3 w-4 h-4 text-blue-600"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Pickup</div>
                <div className="text-sm text-gray-500">Pick up cash from vendor location (fee calculated by distance)</div>
              </div>
            </div>
            <div 
              onClick={() => setSelectedPayment('delivery')}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPayment === 'delivery' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="delivery"
                value="delivery"
                checked={selectedPayment === 'delivery'}
                onChange={(e) => {
                  console.log('Delivery selected:', e.target.value);
                  setSelectedPayment(e.target.value);
                }}
                className="mr-3 w-4 h-4 text-blue-600"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Home Delivery</div>
                <div className="text-sm text-gray-500">Cash delivered to your address (fee calculated by distance)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pickup Location and Phone */}
        {selectedPayment === 'pickup' && (
          <>
            <LocationSelector
              selectedLocation={pickupLocation}
              onLocationChange={setPickupLocation}
            />
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Phone Number</h3>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your phone number"
              />
            </div>
          </>
        )}

        {/* Delivery Address and Phone */}
        {selectedPayment === 'delivery' && (
          <DeliveryAddressForm
            deliveryAddress={deliveryAddress}
            phoneNumber={phoneNumber}
            onAddressChange={setDeliveryAddress}
            onPhoneChange={setPhoneNumber}
          />
        )}

        {/* Notes */}
        <NotesSection
          notes={notes}
          onNotesChange={setNotes}
        />

        {/* Security Notice */}
        <SecurityNotice />

        {/* Info Banner */}
        <AnimatedCard delay={0.5} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <FloatingElement intensity="low">
            <h4 className="font-medium text-yellow-800 mb-2">How it works:</h4>
          </FloatingElement>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• You deposit crypto into secure escrow first</li>
            <li>• After deposit, trade request goes to all users</li>
            <li>• Fastest user accepts and pays vendor</li>
            <li>• Vendor delivers cash to you</li>
            <li>• Crypto released to buyer</li>
          </ul>
        </AnimatedCard>

        {/* Send Trade Request Button */}
        {loading ? (
          <div className="w-full py-4 flex justify-center">
            <LoadingSpinner3D size="md" color="blue" text="Processing..." />
          </div>
        ) : (
          <Button3D
            onClick={handleSendTradeRequest}
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              (selectedPayment === 'delivery' && (!deliveryAddress.trim() || !phoneNumber.trim())) ||
              (selectedPayment === 'pickup' && (!pickupLocation.trim() || pickupLocation === 'Other (specify below)' || !phoneNumber.trim())) ||
              userCredits < getPlatformFee()
            }
            variant="primary"
            size="lg"
            className="w-full py-4 text-lg font-medium"
          >
            Continue to Escrow
          </Button3D>
        )}
      </div>
      </div>
    </PageTransition>
  );
};

export default SellForCash;