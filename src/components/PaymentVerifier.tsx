import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Search, Wallet } from 'lucide-react';
import { bitgoService } from '@/services/bitgoService';

interface PaymentVerifierProps {
  expectedAddress?: string;
  expectedAmount?: number;
  coin?: 'btc' | 'eth' | 'tbtc' | 'teth';
  onVerificationComplete?: (success: boolean, data?: any) => void;
}

const PaymentVerifier: React.FC<PaymentVerifierProps> = ({
  expectedAddress = '',
  expectedAmount = 0,
  coin = 'tbtc',
  onVerificationComplete
}) => {
  const [address, setAddress] = useState(expectedAddress);
  const [amount, setAmount] = useState(expectedAmount.toString());
  const [txId, setTxId] = useState('');
  const [selectedCoin, setSelectedCoin] = useState(coin);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<any>(null);

  const handleVerifyPayment = async () => {
    if (!address || !amount) {
      alert('Please enter address and amount');
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      const verification = await bitgoService.verifyPayment(
        selectedCoin,
        address,
        parseFloat(amount) * 100000000, // Convert to satoshis/wei
        txId || undefined
      );

      setResult(verification);
      onVerificationComplete?.(verification.success, verification);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleCheckBalance = async () => {
    try {
      const balance = await bitgoService.getWalletBalance(selectedCoin);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  };

  const formatAmount = (satoshis: number) => {
    return (satoshis / 100000000).toFixed(8);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          BitGo Payment Verifier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coin Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Cryptocurrency</label>
          <select
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value as any)}
            className="w-full p-2 border rounded-md"
          >
            <option value="tbtc">Bitcoin Testnet (TBTC)</option>
            <option value="teth">Ethereum Testnet (TETH)</option>
            <option value="btc">Bitcoin Mainnet (BTC)</option>
            <option value="eth">Ethereum Mainnet (ETH)</option>
          </select>
        </div>

        {/* Address Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Expected Address</label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter the address that should receive payment"
            className="font-mono text-sm"
          />
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Expected Amount ({selectedCoin.toUpperCase()})
          </label>
          <Input
            type="number"
            step="0.00000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00000000"
          />
        </div>

        {/* Transaction ID (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Transaction ID (Optional)
          </label>
          <Input
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder="Enter specific transaction ID to verify"
            className="font-mono text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleVerifyPayment}
            disabled={verifying || !address || !amount}
            className="flex-1"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Verify Payment
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCheckBalance}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Check Balance
          </Button>
        </div>

        {/* Wallet Balance */}
        {walletBalance && (
          <Alert>
            <Wallet className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div><strong>Total Balance:</strong> {formatAmount(walletBalance.balance)} {selectedCoin.toUpperCase()}</div>
                <div><strong>Confirmed:</strong> {formatAmount(walletBalance.confirmedBalance)} {selectedCoin.toUpperCase()}</div>
                <div><strong>Spendable:</strong> {formatAmount(walletBalance.spendableBalance)} {selectedCoin.toUpperCase()}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Verification Result */}
        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {result.success ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <AlertDescription>
              {result.success ? (
                <div className="space-y-2">
                  <div className="font-semibold text-green-800">✅ Payment Verified!</div>
                  <div className="text-sm space-y-1">
                    <div><strong>Amount Received:</strong> {formatAmount(result.actualAmount || 0)} {selectedCoin.toUpperCase()}</div>
                    <div><strong>Transaction ID:</strong> <code className="text-xs">{result.transaction?.txid}</code></div>
                    <div><strong>Confirmations:</strong> {result.confirmations || 0}</div>
                    <div><strong>Status:</strong> {result.transaction?.state}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-semibold text-red-800">❌ Payment Not Found</div>
                  <div className="text-sm text-red-700">{result.error}</div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Alert>
          <AlertDescription className="text-sm">
            <div className="space-y-2">
              <div><strong>How to use:</strong></div>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Enter the address where payment should be received</li>
                <li>Enter the expected amount in {selectedCoin.toUpperCase()}</li>
                <li>Optionally enter a specific transaction ID</li>
                <li>Click "Verify Payment" to check if payment arrived</li>
              </ol>
              <div className="mt-2 text-xs text-gray-600">
                <strong>Note:</strong> This checks your BitGo wallet for incoming payments. 
                Make sure you're using the correct testnet/mainnet and have the right wallet permissions.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PaymentVerifier;