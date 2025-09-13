import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ArrowLeft, Crown, Wallet, QrCode, Copy, CheckCircle, Bitcoin, Gem, Coins, Upload, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import QRCodeLib from 'qrcode';
import { useToast } from '@/hooks/use-toast';
import { usePremium } from '@/hooks/usePremium';
import { PREMIUM_CONFIG } from '@/constants/premium';
import { cryptoService } from '@/services/cryptoService';

const COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: Bitcoin },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: Gem },
] as const;

type CoinId = typeof COINS[number]['id'];

// Real BitGo addresses will be generated dynamically



const PremiumPayment: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setPremium } = usePremium();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCoin, setSelectedCoin] = useState<CoinId>('bitcoin');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const [usdPrices, setUsdPrices] = useState<Record<CoinId, number>>(PREMIUM_CONFIG.CRYPTO_PRICES);

  const amountInCoin = useMemo(() => {
    const price = usdPrices[selectedCoin] || 1;
    return (PREMIUM_CONFIG.PRICE_USD / price).toFixed(8);
  }, [selectedCoin]);

  // Generate BitGo address when coin is selected
  useEffect(() => {
    loadCryptoPrices();
  }, []);

  useEffect(() => {
    if (selectedCoin) {
      generateBitGoAddress();
    }
  }, [selectedCoin]);

  const loadCryptoPrices = async () => {
    try {
      const prices = await cryptoService.getCryptoPrices();
      setUsdPrices(prices);
    } catch (error) {
      console.error('Error loading crypto prices:', error);
    }
  };

  const generateBitGoAddress = async () => {
    setLoadingAddress(true);
    try {
      const { bitgoEscrow } = await import('@/services/bitgoEscrow');
      const premiumId = `premium_${Date.now()}`;
      const coinType = selectedCoin === 'bitcoin' ? 'BTC' : 'ETH';
      const address = await bitgoEscrow.generateEscrowAddress(premiumId, coinType as 'BTC' | 'ETH');
      setWalletAddress(address);
    } catch (error) {
      console.error('Error generating BitGo address:', error);
      toast({
        title: "Address Generation Failed",
        description: "Failed to generate wallet address. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingAddress(false);
    }
  };

  const generateQR = async (text: string) => {
    try {
      const url = await QRCodeLib.toDataURL(text);
      setQrDataUrl(url);
    } catch (e) {
      console.error('QR generation failed', e);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > PREMIUM_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Please select a file smaller than ${PREMIUM_CONFIG.MAX_FILE_SIZE_MB}MB`,
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      const allowedTypes = PREMIUM_CONFIG.ALLOWED_FILE_TYPES;
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PNG, JPG, or PDF file",
          variant: "destructive"
        });
        return;
      }

      setUploadedFile(file);
    }
  };

  const handleUploadProof = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProofUploaded(true);
      toast({
        title: "Proof Uploaded",
        description: "Payment proof has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload payment proof. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const goSuccess = () => {
    setStep(3);
    // Set premium status
    setPremium(true);
    setTimeout(() => navigate('/premium-dashboard'), 2200);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-2">
          <Crown size={20} className="text-yellow-500" />
          <h1 className="text-lg font-semibold text-gray-900">Upgrade to Premium</h1>
        </div>
      </div>

      {step === 1 && (
        <div className="p-4 space-y-6">
          <Card className="p-6 bg-brand text-brand-foreground">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold">Premium Annual</h2>
                <p className="text-purple-100">Pay with crypto</p>
              </div>
              <Crown size={28} className="text-yellow-300" />
            </div>
            <div className="text-3xl font-bold">${PREMIUM_CONFIG.PRICE_USD}</div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Select Coin</h3>
            <div className="grid grid-cols-2 gap-3">
              {COINS.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => setSelectedCoin(coin.id)}
                  className={`border rounded-lg p-3 text-center ${
                    selectedCoin === coin.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                  }`}
                >
                  <coin.icon className="mx-auto mb-2 text-gray-700" size={18} />
                  <div className="text-sm font-medium text-gray-900">{coin.symbol}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Amount in {COINS.find(c=>c.id===selectedCoin)?.symbol}</span>
                <span className="font-semibold">{amountInCoin}</span>
              </div>
              <div className="flex justify-between text-gray-500 mt-1">
                <span>Price Reference</span>
                <span>${usdPrices[selectedCoin].toLocaleString()}</span>
              </div>
            </div>

            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setStep(2)}>
              Continue to Wallet
            </Button>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="p-4 space-y-6">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Send {COINS.find(c=>c.id===selectedCoin)?.symbol}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Network</span>
                <span className="font-semibold">{selectedCoin === 'bitcoin' ? 'Bitcoin Testnet' : 'Ethereum Testnet'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold">{amountInCoin} {COINS.find(c=>c.id===selectedCoin)?.symbol}</span>
              </div>
              <div className="pt-2 border-t text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Wallet Address</span>
                  {walletAddress && (
                    <button onClick={() => handleCopy(walletAddress)} className="text-blue-600 hover:underline flex items-center text-xs">
                      <Copy size={14} className="mr-1" /> {copied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                {loadingAddress ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-gray-600">Generating address...</span>
                  </div>
                ) : walletAddress ? (
                  <p className="font-mono break-all text-gray-900 mt-1">{walletAddress}</p>
                ) : (
                  <p className="text-red-600 mt-1">Failed to generate address</p>
                )}
              </div>
              {walletAddress && (
                <div className="flex flex-col items-center pt-2">
                  <button onClick={() => generateQR(walletAddress)} className="text-sm text-blue-600 hover:underline flex items-center">
                    <QrCode size={16} className="mr-1" /> Generate QR
                  </button>
                  {qrDataUrl && <img src={qrDataUrl} alt="Wallet QR" className="w-40 h-40 mt-2" loading="lazy" />}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start space-x-3">
              <Wallet size={20} className="text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Instructions</h4>
                <ul className="list-disc pl-5 text-sm text-gray-600 mt-2 space-y-1">
                  <li>Send exactly {amountInCoin} {COINS.find(c=>c.id===selectedCoin)?.symbol} to the address above.</li>
                  <li>Include network fees on top; do not underpay.</li>
                  <li>After sending, tap "I have paid" to continue.</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Upload Payment Proof */}
          <Card className="p-4">
            <div className="flex items-start space-x-3 mb-4">
              <Upload size={20} className="text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Upload Payment Proof</h4>
                <p className="text-sm text-gray-600">Upload a screenshot or receipt of your payment</p>
              </div>
            </div>

            {!uploadedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-1">Tap to upload payment proof</p>
                <p className="text-sm text-gray-500">PNG, JPG or PDF (Max {PREMIUM_CONFIG.MAX_FILE_SIZE_MB}MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Preview */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {uploadedFile.type.startsWith('image/') ? (
                        <Image size={20} className="text-blue-500 mr-2" />
                      ) : (
                        <FileText size={20} className="text-red-500 mr-2" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Upload Button */}
                {!proofUploaded && (
                  <Button
                    onClick={handleUploadProof}
                    disabled={isUploading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="mr-2" />
                        Upload Proof
                      </>
                    )}
                  </Button>
                )}

                {/* Upload Status */}
                {proofUploaded && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <CheckCircle size={20} className="text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">Proof uploaded successfully</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 space-y-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  toast({ 
                    title: "Payment Submitted", 
                    description: "We're monitoring for your payment. Premium access will be granted automatically once confirmed." 
                  });
                  navigate('/premium-pending');
                }}
                disabled={!proofUploaded}
              >
                {proofUploaded ? "Complete Payment" : "Upload proof to continue"}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <Card className="p-8 max-w-sm w-full text-center bg-white">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <Crown size={24} className="text-yellow-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Premium!</h2>
            <p className="text-gray-600 mb-4">Payment confirmed. Redirecting to your dashboard...</p>
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </Card>
        </div>
      )}

      {/* Only show premium navigation after payment is completed */}
      {step === 3 && <PremiumBottomNavigation />}
    </div>
  );
};

export default PremiumPayment;
