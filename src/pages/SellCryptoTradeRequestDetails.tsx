import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, Wallet, CheckCircle, Upload, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FireblocksEscrowService } from '@/services/fireblocksEscrowService';

const SellCryptoTradeRequestDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { tradeRequestId } = location.state || {};
  
  const [tradeRequest, setTradeRequest] = useState<any>(null);
  const [userBankAccount, setUserBankAccount] = useState<any>(null);
  const [merchantWalletAddress, setMerchantWalletAddress] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'payment' | 'completed'>('details');

  const fireblocksService = new FireblocksEscrowService();

  useEffect(() => {
    if (tradeRequestId) {
      fetchTradeRequestDetails();
    }
  }, [tradeRequestId]);

  const fetchTradeRequestDetails = async () => {
    try {
      // Get trade request details
      const { data: request, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('id', tradeRequestId)
        .single();

      if (error) throw error;
      
      // Get user profile and phone separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', request.user_id)
        .single();
      
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('phone')
        .eq('user_id', request.user_id)
        .single();
      
      (request as any).profiles = profile;
      (request as any).user_phone = userProfile?.phone;

      console.log('🔍 DEBUG: Trade request data:', request);
      console.log('🔍 DEBUG: Bank account ID:', (request as any).bank_account_id);
      console.log('🔍 DEBUG: Payment method:', request.payment_method);
      setTradeRequest(request);

      // For cash trades, get vendor bank details and delivery code
      if (request.payment_method === 'cash_delivery') {
        console.log('🔍 DEBUG: Fetching vendor details for cash trade');
        console.log('🔍 DEBUG: Trade request ID:', request.id);
        
        // Try to get vendor details and delivery code from cash_trades table
        const { data: cashTrade, error: cashTradeError } = await supabase
          .from('cash_trades')
          .select(`
            vendor_id,
            delivery_code,
            vendors!inner(bank_name, bank_account, account_name, display_name)
          `)
          .eq('trade_request_id', request.id)
          .maybeSingle();

        console.log('🔍 DEBUG: Cash trade query result:', { cashTrade, cashTradeError });
        console.log('🔍 DEBUG: Vendor data:', cashTrade?.vendors);
        
        // Check if cash trade exists at all
        const { data: allCashTrades } = await supabase
          .from('cash_trades')
          .select('*')
          .eq('trade_request_id', request.id);
        
        console.log('🔍 DEBUG: All cash trades for this request:', allCashTrades);
        
        // Skip creating cash trade here due to RLS issues - it should be created in CashEscrowFlow
        if (!cashTrade && (!allCashTrades || allCashTrades.length === 0)) {
          console.log('⚠️ DEBUG: No cash trade found - should be created in CashEscrowFlow');
        }

        if (cashTrade?.vendors) {
          console.log('✅ DEBUG: Vendor found, setting bank details');
          setUserBankAccount({
            account_name: cashTrade.vendors.account_name,
            bank_name: cashTrade.vendors.bank_name,
            account_number: cashTrade.vendors.bank_account,
            vendor_name: cashTrade.vendors.display_name
          });
          // Add delivery code to trade request for display
          request.delivery_code = cashTrade.delivery_code;
          console.log('🔍 DEBUG: Set bank account:', {
            account_name: cashTrade.vendors.account_name,
            bank_name: cashTrade.vendors.bank_name,
            account_number: cashTrade.vendors.bank_account,
            vendor_name: cashTrade.vendors.display_name
          });
        } else {
          console.log('❌ DEBUG: No vendor found, using placeholder');
          console.log('🔍 DEBUG: Checking if we need to assign a vendor...');
          
          // Try to assign a vendor if none exists
          const { data: availableVendors } = await supabase
            .from('vendors')
            .select('*')
            .eq('is_active', true)
            .limit(1);
          
          console.log('🔍 DEBUG: Available vendors:', availableVendors);
          
          if (availableVendors && availableVendors.length > 0) {
            const vendor = availableVendors[0];
            console.log('🔧 DEBUG: Assigning vendor:', vendor);
            
            // Update cash trade with vendor
            await supabase
              .from('cash_trades')
              .update({ 
                vendor_id: vendor.id,
                status: 'vendor_assigned'
              })
              .eq('trade_request_id', request.id);
            
            // Set vendor bank details
            setUserBankAccount({
              account_name: vendor.account_name,
              bank_name: vendor.bank_name,
              account_number: vendor.bank_account,
              vendor_name: vendor.display_name
            });
            
            console.log('✅ DEBUG: Vendor assigned and bank details set');
          } else {
            // No vendor assigned yet - use placeholder
            setUserBankAccount({
              account_name: 'Vendor will be assigned',
              bank_name: 'Please wait...',
              account_number: 'Vendor assignment in progress',
              vendor_name: 'TBD'
            });
          }
        }
      } else {
        // For regular trades, get user bank details
        if (request.bank_account_id) {
          const { data: bankAccount } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('id', request.bank_account_id)
            .single();
          
          setUserBankAccount(bankAccount);
        } else {
          setUserBankAccount({
            account_name: 'User Account',
            bank_name: 'User Bank',
            account_number: 'User Account Number'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching trade request:', error);
      toast({
        title: "Error",
        description: "Failed to load trade request details",
        variant: "destructive"
      });
    }
  };

  const handleSendCashPayment = async () => {
    if (!paymentProof || !merchantWalletAddress) {
      toast({
        title: "Missing Information",
        description: "Please upload payment proof and enter your wallet address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload payment proof with unique filename
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${tradeRequestId}_merchant_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      // First assign merchant to trade request
      const { error: assignError } = await supabase
        .from('trade_requests')
        .update({ merchant_id: user.id })
        .eq('id', tradeRequestId);

      if (assignError) throw assignError;

      // Then update with payment info
      const { error } = await supabase
        .from('trade_requests')
        .update({
          status: 'payment_sent',
          merchant_wallet_address: merchantWalletAddress,
          merchant_payment_proof: fileName
        })
        .eq('id', tradeRequestId);

      if (error) throw error;

      // For cash trades, notify VENDOR (not user) that payment was sent
      if (tradeRequest.payment_method === 'cash_delivery') {
        console.log('💰 DEBUG: Processing cash delivery payment notification');
        
        // Get vendor details from cash_trades
        const { data: cashTrade } = await supabase
          .from('cash_trades')
          .select('vendor_id, vendors!inner(user_id)')
          .eq('trade_request_id', tradeRequestId)
          .maybeSingle();

        console.log('💰 DEBUG: Cash trade for notification:', cashTrade);

        if (cashTrade?.vendors?.user_id) {
          // Update cash trade status to vendor_paid
          await supabase
            .from('cash_trades')
            .update({ 
              status: 'vendor_paid',
              buyer_id: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('trade_request_id', tradeRequestId);

          console.log('💰 DEBUG: Updated cash trade status to vendor_paid');
          
          // Send notification to VENDOR (not user)
          const vendorUserId = cashTrade.vendors.user_id;
          console.log('💰 DEBUG: Sending notification to vendor user_id:', vendorUserId);
          
          await supabase
            .from('notifications')
            .insert({
              user_id: vendorUserId, // Send to VENDOR
              type: 'payment_received',
              title: 'PAYMENT RECEIVED!',
              message: `Merchant paid ₦${(tradeRequest.amount_fiat || 0).toLocaleString()} for cash delivery. Confirm receipt in your dashboard.`,
              data: {
                cash_trade_id: cashTrade.vendor_id,
                trade_request_id: tradeRequestId,
                amount_fiat: tradeRequest.amount_fiat
              }
            });
            
          console.log('✅ DEBUG: Notification sent to vendor successfully');
        } else {
          console.log('❌ DEBUG: No vendor found for notification');
        }
      } else {
        // For regular trades, notify user
        await supabase
          .from('notifications')
          .insert({
            user_id: tradeRequest.user_id,
            type: 'payment_sent',
            title: 'Payment Sent',
            message: `Merchant has sent payment. Please confirm receipt.`,
            data: {
              trade_request_id: tradeRequestId,
              amount_fiat: tradeRequest.amount_fiat
            }
          });
      }

      toast({
        title: "Payment Sent!",
        description: "User will be notified to confirm receipt and release crypto to your wallet."
      });

      setStep('completed');
    } catch (error) {
      console.error('Error sending payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseCrypto = async () => {
    try {
      const result = await fireblocksService.releaseFunds(tradeRequestId, merchantWalletAddress);
      
      if (result.success) {
        await supabase
          .from('trade_requests')
          .update({ status: 'completed' })
          .eq('id', tradeRequestId);

        toast({
          title: "Trade Completed!",
          description: `${tradeRequest.amount_crypto} ${tradeRequest.crypto_type} has been sent to your wallet.`
        });

        navigate('/merchant-dashboard');
      }
    } catch (error) {
      console.error('Error releasing crypto:', error);
    }
  };

  if (!tradeRequest) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2">Sell Crypto Trade Request</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Crypto Already in Escrow Banner */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <p className="font-semibold text-green-900">Crypto Secured in Escrow</p>
                <p className="text-sm text-green-700">
                  {tradeRequest.amount_crypto} {tradeRequest.crypto_type} is already deposited and secured
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Details */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User:</span>
              <span className="font-semibold">{tradeRequest.profiles?.display_name || 'Anonymous User'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Crypto in Escrow:</span>
              <span className="font-semibold">{tradeRequest.amount_crypto} {tradeRequest.crypto_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">You Send Cash:</span>
              <span className="font-semibold text-primary">₦{tradeRequest.amount_fiat?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate:</span>
              <span className="font-semibold">₦{tradeRequest.rate?.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Vendor's Bank Account (for cash trades) */}
        <Card>
          <CardHeader>
            <CardTitle>
              {tradeRequest.payment_method === 'cash_delivery' 
                ? 'Send Payment to Vendor' 
                : 'Send Payment To User'
              }
            </CardTitle>
            {tradeRequest.payment_method === 'cash_delivery' && (
              <p className="text-sm text-muted-foreground">
                Pay the vendor who will deliver cash to the customer
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {userBankAccount?.vendor_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor Name:</span>
                <span className="font-semibold">{userBankAccount.vendor_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Name:</span>
              <span className="font-semibold">{userBankAccount?.account_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank:</span>
              <span className="font-semibold">{userBankAccount?.bank_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Number:</span>
              <span className="font-semibold">{userBankAccount?.account_number}</span>
            </div>
          </CardContent>
        </Card>



        {step === 'details' && (
          <Button 
            onClick={() => setStep('payment')} 
            className="w-full"
            size="lg"
          >
            I've Sent the Cash Payment
          </Button>
        )}

        {step === 'payment' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Payment & Get Your Crypto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="wallet-address">Your {tradeRequest.crypto_type} Wallet Address</Label>
                <Input
                  id="wallet-address"
                  value={merchantWalletAddress}
                  onChange={(e) => setMerchantWalletAddress(e.target.value)}
                  placeholder={`Enter your ${tradeRequest.crypto_type} wallet address`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Crypto will be released to this address after user confirms payment
                </p>
              </div>

              <div>
                <Label htmlFor="payment-proof">Upload Payment Proof</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                    className="hidden"
                    id="payment-proof"
                  />
                  <label htmlFor="payment-proof" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {paymentProof ? paymentProof.name : 'Upload bank transfer receipt'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleSendCashPayment}
                disabled={!paymentProof || !merchantWalletAddress || loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Processing...' : 'Confirm Payment Sent'}
              </Button>
              
              {/* Additional Actions */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Seller
                </Button>
                <Button variant="outline" size="sm">
                  Send Reminder
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-3 border-red-300 text-red-600 hover:bg-red-50"
                size="sm"
              >
                Cancel Trade
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'completed' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Confirmed!</h2>
              <p className="text-muted-foreground mb-4">
                User has been notified to confirm receipt. Crypto will be released to your wallet once confirmed.
              </p>
              <Button onClick={() => navigate('/trade-requests')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SellCryptoTradeRequestDetails;