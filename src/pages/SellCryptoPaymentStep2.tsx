import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, CheckCircle, Upload, Wallet, QrCode, Copy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


const SellCryptoPaymentStep2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { coinType, cryptoAmount, cashAmount, netAmount, selectedMerchant, selectedAccount } = location.state || {};
  
  const [escrowAddress, setEscrowAddress] = useState('');
  const [vaultId, setVaultId] = useState('');
  const [depositProof, setDepositProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [escrowCreated, setEscrowCreated] = useState(false);


  useEffect(() => {
    if (coinType && cryptoAmount) {
      createEscrowVault();
    }
  }, [coinType, cryptoAmount]);

  const createEscrowVault = async () => {
    setLoading(true);
    try {
      const { bitgoEscrow } = await import('@/services/bitgoEscrow');
      const tradeId = `trade_${Date.now()}`;
      const address = await bitgoEscrow.generateEscrowAddress(tradeId, coinType as 'BTC' | 'USDT' | 'XRP', parseFloat(cryptoAmount));
      
      setEscrowAddress(address);
      setVaultId(tradeId);
      setEscrowCreated(true);
      
      toast({
        title: "Escrow Ready",
        description: "Secure BitGo escrow address generated. You can now deposit your crypto."
      });
    } catch (error) {
      console.error('Error creating escrow:', error);
      toast({
        title: "Escrow Error",
        description: "Failed to create secure escrow. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDepositProof(event.target.files[0]);
    }
  };

  const handleConfirmDeposit = async () => {
    if (!depositProof) {
      toast({
        title: "Upload Required",
        description: "Please upload proof of crypto deposit",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload proof to storage
      const fileExt = depositProof.name.split('.').pop();
      const fileName = `${Date.now()}_deposit_proof.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, depositProof);

      if (uploadError) throw uploadError;

      // NOW create the trade request with crypto already deposited
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      const tradeRequestData = {
        user_id: user.id,
        trade_type: 'sell',
        crypto_type: coinType,
        amount_crypto: parseFloat(cryptoAmount),
        amount_fiat: netAmount,
        rate: netAmount / parseFloat(cryptoAmount),
        payment_method: 'bank_transfer',
        status: 'open',
        bank_account_id: selectedAccount.id,
        user_bank_name: selectedAccount.bank_name,
        user_account_number: selectedAccount.account_number,
        user_account_name: selectedAccount.account_name,
        escrow_address: escrowAddress,
        vault_id: vaultId,
        payment_proof_url: fileName,
        expires_at: expiresAt.toISOString()
      };

      console.log('Creating trade request:', tradeRequestData);
      
      const { data: tradeRequest, error } = await supabase
        .from('trade_requests')
        .insert(tradeRequestData)
        .select()
        .single();

      if (error) {
        console.error('Trade request creation error:', error);
        throw error;
      }
      
      console.log('Trade request created:', tradeRequest);

      // Notify ALL merchants about this sell crypto request
      const { data: merchants } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('is_merchant', true)
        .neq('user_id', user.id);

      if (merchants && merchants.length > 0) {
        const notifications = merchants.map(merchant => ({
          user_id: merchant.user_id,
          type: 'sell_crypto_request',
          title: 'New Sell Crypto Request',
          message: `User wants to sell ${cryptoAmount} ${coinType} for ₦${netAmount?.toLocaleString()}. Crypto is already secured in escrow.`,
          data: {
            trade_request_id: tradeRequest.id,
            crypto_amount: cryptoAmount,
            fiat_amount: netAmount,
            crypto_type: coinType
          }
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast({
        title: "Trade Request Sent!",
        description: "Your crypto is secured in escrow. Merchants have been notified."
      });

      navigate('/sell-crypto-waiting', {
        state: { 
          tradeRequestId: tradeRequest.id, 
          coinType, 
          cryptoAmount, 
          netAmount, 
          selectedAccount,
          selectedMerchant
        }
      });
    } catch (error) {
      console.error('Error confirming deposit:', error);
      toast({
        title: "Error",
        description: "Failed to confirm deposit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!coinType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Missing trade information</p>
            <Button onClick={() => navigate('/buy-sell')}>Start Over</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Poppins']">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#EAEAEA] p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900">Sell {coinType} - Step 2</h1>
        <div className="w-10" />
      </div>

      {/* Status Banner */}
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center justify-center">
          <Wallet className="w-5 h-5 text-blue-600 mr-2" />
          <span className="text-blue-800 font-semibold">
            Secure Escrow - Deposit Your Crypto
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Escrow Status */}
        <Card>
          <CardContent className="p-6 text-center">
            {loading ? (
              <>
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Setting Up Escrow</h2>
                <p className="text-muted-foreground">Creating secure BitGo escrow...</p>
              </>
            ) : escrowCreated ? (
              <>
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Escrow Ready</h2>
                <p className="text-muted-foreground">Deposit your crypto to the secure address below</p>
              </>
            ) : (
              <>
                <Wallet className="w-8 h-8 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Preparing Escrow</h2>
                <p className="text-muted-foreground">Please wait...</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Escrow Deposit Details */}
        {escrowCreated && escrowAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Deposit {coinType} to Escrow</CardTitle>
              <p className="text-xs text-muted-foreground">
                Send exactly {cryptoAmount} {coinType} to the address below
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Escrow Address</p>
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <p className="font-mono text-sm break-all text-gray-900">{escrowAddress}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(escrowAddress)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </Button>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">QR Code</p>
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${escrowAddress}`}
                          alt="QR Code"
                          className="w-32 h-32 mx-auto"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      <strong>Important:</strong> Send exactly {cryptoAmount} {coinType}. 
                      Any other amount will cause delays.
                    </p>
                  </div>
                </div>
              </div>



              {/* Upload Proof */}
              <div>
                <label className="text-sm font-medium mb-2 block">Upload Deposit Proof</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="deposit-proof"
                  />
                  <label htmlFor="deposit-proof" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {depositProof ? depositProof.name : 'Upload transaction screenshot'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleConfirmDeposit}
                  disabled={!depositProof || loading}
                  className="w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white rounded-xl"
                  size="lg"
                >
                  {loading ? 'Processing...' : 'Confirm Crypto Deposit & Send Trade Request'}
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm">
                    Send Reminder
                  </Button>
                  <Button variant="outline" size="sm">
                    Cancel Trade
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trade Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trade Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selling:</span>
              <span className="font-semibold">{cryptoAmount} {coinType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">You'll Receive:</span>
              <span className="font-semibold text-primary">{netAmount?.toLocaleString()} NGN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Merchant:</span>
              <span className="font-semibold">{selectedMerchant?.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment To:</span>
              <span className="font-semibold">{selectedAccount?.bank_name}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellCryptoPaymentStep2;