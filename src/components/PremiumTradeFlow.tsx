import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Phone, User, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { premiumTradeService, type PremiumTradeRequest, type PremiumTradeResponse } from '@/services/premiumTradeService';
import { usePremium } from '@/hooks/usePremium';

interface PremiumTradeFlowProps {
  onBack: () => void;
}

const PremiumTradeFlow: React.FC<PremiumTradeFlowProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tradeResponse, setTradeResponse] = useState<PremiumTradeResponse | null>(null);
  const { toast } = useToast();
  const { isPremium } = usePremium();

  // Form data
  const [amountUSD, setAmountUSD] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('delivery');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    phone: '',
    notes: ''
  });

  const handleCreateTrade = async () => {
    if (!isPremium) {
      toast({
        title: "Premium Required",
        description: "This feature requires a premium membership",
        variant: "destructive"
      });
      return;
    }

    if (!amountUSD || parseFloat(amountUSD) < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is $100",
        variant: "destructive"
      });
      return;
    }

    if (deliveryType === 'delivery' && (!address.street || !address.city || !address.phone)) {
      toast({
        title: "Address Required",
        description: "Please provide complete delivery address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const request: PremiumTradeRequest = {
        amount_usd: parseFloat(amountUSD),
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? address : undefined
      };

      const response = await premiumTradeService.createPremiumTrade(request);
      setTradeResponse(response);
      setStep(2);

      toast({
        title: "Trade Created Successfully",
        description: `Your ${deliveryType} request for $${amountUSD} has been assigned to a vendor`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Premium Cash Service</h1>
        </div>

        <div className="p-4 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Service Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount (USD)</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: $100 • Credits needed: {Math.ceil(parseFloat(amountUSD || '0') / 10)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Service Type</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    variant={deliveryType === 'pickup' ? 'default' : 'outline'}
                    onClick={() => setDeliveryType('pickup')}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <User className="h-5 w-5" />
                    <span>Cash Pickup</span>
                    <span className="text-xs text-muted-foreground">Meet at location</span>
                  </Button>
                  <Button
                    variant={deliveryType === 'delivery' ? 'default' : 'outline'}
                    onClick={() => setDeliveryType('delivery')}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <MapPin className="h-5 w-5" />
                    <span>Cash Delivery</span>
                    <span className="text-xs text-muted-foreground">Delivered to you</span>
                  </Button>
                </div>
              </div>

              {deliveryType === 'delivery' && (
                <Card className="p-4 bg-muted/50">
                  <h3 className="font-medium mb-3">Delivery Address</h3>
                  <div className="space-y-3">
                    <Input
                      placeholder="Street address"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="City"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      />
                      <Input
                        placeholder="State"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      />
                    </div>
                    <Input
                      placeholder="Phone number"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    />
                    <Input
                      placeholder="Delivery notes (optional)"
                      value={address.notes}
                      onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                    />
                  </div>
                </Card>
              )}
            </div>
          </Card>

          <Button 
            onClick={handleCreateTrade}
            disabled={loading || !amountUSD}
            className="w-full"
            size="lg"
          >
            {loading ? 'Creating...' : `Create ${deliveryType === 'pickup' ? 'Pickup' : 'Delivery'} Request`}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2 && tradeResponse) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Trade Confirmation</h1>
        </div>

        <div className="p-4 space-y-6">
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold text-green-600">Request Created Successfully</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Your Trade Code</div>
                <div className="text-2xl font-mono font-bold text-primary">
                  {tradeResponse.trade_code}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Show this code to the vendor
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="font-semibold">${amountUSD} USD</div>
                  <div className="text-sm text-muted-foreground">≈ ₦{tradeResponse.amount_naira.toLocaleString()}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Service</div>
                  <div className="font-semibold capitalize">{deliveryType}</div>
                  <Badge variant="secondary" className="mt-1">Premium</Badge>
                </Card>
              </div>

              <Card className="p-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Assigned Vendor
                </h3>
                <div className="space-y-1">
                  <div className="font-medium">{tradeResponse.vendor_info.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {tradeResponse.vendor_info.phone}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Estimated Completion
                </h3>
                <div className="text-sm text-muted-foreground">
                  {new Date(tradeResponse.estimated_delivery).toLocaleString()}
                </div>
              </Card>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="font-medium">Next Steps:</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                <div>Vendor will contact you to confirm details</div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                <div>Wait for vendor to arrive at your location</div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                <div>Show your trade code to the vendor</div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
                <div>Receive your cash and confirm completion</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PremiumTradeFlow;