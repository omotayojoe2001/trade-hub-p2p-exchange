import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WalletAddressInputProps {
  cryptoType: string;
  onAddressSet: (address: string) => void;
  required?: boolean;
  className?: string;
}

export const WalletAddressInput: React.FC<WalletAddressInputProps> = ({
  cryptoType,
  onAddressSet,
  required = true,
  className = ''
}) => {
  const [address, setAddress] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(true);
  const { toast } = useToast();

  const validateAddress = (addr: string): boolean => {
    if (!addr) return false;
    
    // Basic validation patterns for different crypto types
    const patterns = {
      BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
      ETH: /^0x[a-fA-F0-9]{40}$/,
      USDT: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, // USDT on Solana (Base58)
    };
    
    const pattern = patterns[cryptoType as keyof typeof patterns];
    return pattern ? pattern.test(addr) : addr.length > 10; // Fallback
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    const isValid = validateAddress(value);
    setIsValidAddress(isValid);
    
    if (isValid) {
      onAddressSet(value);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleAddressChange(text);
      toast({
        title: "Address Pasted",
        description: "Wallet address pasted from clipboard",
      });
    } catch (error) {
      toast({
        title: "Paste Failed",
        description: "Could not paste from clipboard",
        variant: "destructive",
      });
    }
  };

  const getAddressFormat = () => {
    switch (cryptoType) {
      case 'BTC':
        return 'Bitcoin address (starts with 1, 3, or bc1)';
      case 'ETH':
        return 'Ethereum address (starts with 0x)';
      case 'USDT':
        return 'USDT address (Solana SPL, Base58 format)';
      default:
        return 'Valid crypto wallet address';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Receive {cryptoType} Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wallet-address">
            Your {cryptoType} Wallet Address {required && '*'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="wallet-address"
              type="text"
              placeholder={`Enter your ${cryptoType} wallet address`}
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              className={`flex-1 ${!isValidAddress && address ? 'border-destructive' : ''}`}
              required={required}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={pasteFromClipboard}
              title="Paste from clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          {!isValidAddress && address && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please enter a valid {getAddressFormat()}
              </AlertDescription>
            </Alert>
          )}
          
          {isValidAddress && address && (
            <Alert>
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Valid {cryptoType} address confirmed
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Make sure this address belongs to you and supports {cryptoType}. 
            Crypto sent to an incorrect address cannot be recovered.
          </AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground">
          <p>Expected format: {getAddressFormat()}</p>
          {cryptoType === 'USDT' && (
            <p className="text-xs text-blue-600 mt-1">
              Note: Using Solana USDT (SPL token), not Ethereum USDT
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};