import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, CheckCircle, Upload, Wallet, QrCode, Copy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';


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
  const [sessionId, setSessionId] = useState('');
  
  const { saveSession, removeSession } = useSessionPersistence();


  useEffect(() => {
    // Check for existing session on page load
    const savedSession = sessionStorage.getItem('active_sell_crypto_escrow');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        // Only restore if trade parameters match exactly
        if (sessionData.data?.escrowAddress && 
            sessionData.data.coinType === coinType &&
            sessionData.data.cryptoAmount === cryptoAmount &&
            sessionData.data.selectedMerchant?.user_id === selectedMerchant?.user_id) {
          console.log('🔄 Restoring matching escrow session:', sessionData);
          setSessionId(sessionData.id);
          setEscrowAddress(sessionData.data.escrowAddress);
          setVaultId(sessionData.data.vaultId);
          setEscrowCreated(true);
          return;
        } else {
          console.log('🗑️ Clearing mismatched session - trade parameters changed');
          sessionStorage.removeItem('active_sell_crypto_escrow');
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        sessionStorage.removeItem('active_sell_crypto_escrow');
      }
    }
    
    if (coinType && cryptoAmount) {
      createEscrowVault();
    }
  }, [coinType, cryptoAmount, selectedMerchant]);

  const createEscrowVault = async () => {
    setLoading(true);
    try {
      const { bitgoEscrow } = await import('@/services/bitgoEscrow');
      const tradeId = `trade_${Date.now()}_${user?.id}_${Math.random().toString(36).substr(2, 9)}`;
      const address = await bitgoEscrow.generateEscrowAddress(tradeId, coinType as 'BTC' | 'USDT' | 'XRP', parseFloat(cryptoAmount));
      
      setEscrowAddress(address);
      setVaultId(tradeId);
      setEscrowCreated(true);
      
      // Generate session ID and save session
      const newSessionId = `sell_crypto_${Date.now()}_${user?.id}`;
      setSessionId(newSessionId);
      
      const sessionData = {
        id: newSessionId,
        type: 'sell_crypto_escrow' as const,
        data: {
          escrowAddress: address,
          vaultId: tradeId,
          coinType,
          cryptoAmount,
          cashAmount,
          netAmount,
          selectedMerchant,
          selectedAccount,
          timestamp: Date.now()
        }
      };
      
      saveSession(sessionData);
      sessionStorage.setItem('active_sell_crypto_escrow', JSON.stringify(sessionData));
      console.log('💾 Escrow session saved:', sessionData);
      
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

      // Clear session after successful trade creation
      sessionStorage.removeItem('active_sell_crypto_escrow');
      if (sessionId) {
        removeSession(sessionId);
      }
      console.log('🗑️ Session cleared after trade creation');
      
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

      <div className="p-4 space-y-4">
        {/* Save session on visibility change */}
        {React.useEffect(() => {
          const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && escrowAddress && sessionId) {
              const sessionData = {
                id: sessionId,
                type: 'sell_crypto_escrow' as const,
                data: {
                  escrowAddress,
                  vaultId,
                  coinType,
                  cryptoAmount,
                  cashAmount,
                  netAmount,
                  selectedMerchant,
                  selectedAccount,
                  timestamp: Date.now()
                }
              };
              
              saveSession(sessionData);
              sessionStorage.setItem('active_sell_crypto_escrow', JSON.stringify(sessionData));
              console.log('💾 Session saved on tab switch');
            }
          };
          
          document.addEventListener('visibilitychange', handleVisibilityChange);
          
          return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          };
        }, [escrowAddress, sessionId, vaultId, coinType, cryptoAmount, cashAmount, netAmount, selectedMerchant, selectedAccount]) && null}


        {/* Deposit Details */}
        {escrowCreated && escrowAddress && (
          <div className="space-y-3">
            <div className="bg-white border rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Send {cryptoAmount} {coinType} to:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-gray-50 rounded font-mono text-xs break-all">
                  {escrowAddress}
                </div>
                <button
                  onClick={() => copyToClipboard(escrowAddress)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-3 text-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${escrowAddress}`}
                alt="QR Code"
                className="w-20 h-20 mx-auto mb-2"
              />
              <p className="text-xs text-gray-600">Scan to send</p>
            </div>



            <div className="bg-white border rounded-lg p-3">
              <label className="text-sm font-medium mb-2 block">Upload Proof</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="deposit-proof"
              />
              <label htmlFor="deposit-proof" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400">
                  <Upload size={20} className="mx-auto mb-1 text-gray-500" />
                  <p className="text-sm text-gray-600">
                    {depositProof ? depositProof.name : 'Upload screenshot'}
                  </p>
                </div>
              </label>
            </div>

            <Button
              onClick={handleConfirmDeposit}
              disabled={!depositProof || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium"
            >
              {loading ? 'Processing...' : 'Confirm Deposit'}
            </Button>
          </div>
        )}

        {/* Trade Summary */}
        <div className="bg-white border rounded-lg p-3">
          <p className="text-sm font-medium mb-2">Trade Summary</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Selling:</span>
              <span className="font-medium">{cryptoAmount} {coinType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">You'll Receive:</span>
              <span className="font-medium text-green-600">{netAmount?.toLocaleString()} NGN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellCryptoPaymentStep2;