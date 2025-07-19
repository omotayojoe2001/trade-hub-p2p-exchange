import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { CurrencySelector } from "./CurrencySelector";

interface PaymentFormProps {
  className?: string;
}

export const PaymentForm = ({ className }: PaymentFormProps) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('Crypto Trading Fee');
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { convertCurrency, formatCurrency, rates } = useCurrencyConverter();

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          amount: parseFloat(amount),
          currency: currency,
          description: description || 'Payment',
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Payment",
          description: "Opening Stripe checkout in a new tab",
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertedAmount = amount ? convertCurrency(parseFloat(amount), currency, 'USD') : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💳 Make Payment
        </CardTitle>
        <CardDescription>
          Process secure payments via Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <CurrencySelector 
              value={currency}
              onValueChange={setCurrency}
            />
          </div>
        </div>

        {amount && convertedAmount > 0 && currency !== 'USD' && (
          <div className="text-sm text-muted-foreground">
            ≈ {formatCurrency(convertedAmount, 'USD')} USD
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Payment description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button 
          onClick={handlePayment}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="w-full"
        >
          {loading ? 'Creating Session...' : `Pay ${formatCurrency(parseFloat(amount || '0'), currency)}`}
        </Button>
      </CardContent>
    </Card>
  );
};