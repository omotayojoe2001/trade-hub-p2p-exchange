import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Shield, Smartphone, Key, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';
import QRCodeLib from 'qrcode';

const Premium2FA = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [backupCodes] = useState([
    'A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6',
    'Q7R8S9T0', 'U1V2W3X4', 'Y5Z6A7B8', 'C9D0E1F2'
  ]);

  const secretKey = 'JBSWY3DPEHPK3PXP';
  const qrCodeUrl = `otpauth://totp/TradeHub%20Premium:user@example.com?secret=${secretKey}&issuer=TradeHub%20Premium`;

  // Generate QR code on component mount
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const dataUrl = await QRCodeLib.toDataURL(qrCodeUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [qrCodeUrl]);

  const handleEnable2FA = () => {
    setSetupStep(1);
  };

  const handleVerifyCode = () => {
    if (verificationCode.length === 6) {
      setIs2FAEnabled(true);
      setSetupStep(3);

      // Save 2FA enabled status to localStorage (in real app, this would be saved to backend)
      const userId = 'current_user_id'; // In real app, get from auth context
      localStorage.setItem(`2fa_enabled_${userId}`, 'true');

      toast({
        title: "2FA Enabled Successfully",
        description: "Your premium account is now secured with two-factor authentication",
      });
    } else {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code",
        variant: "destructive"
      });
    }
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    setSetupStep(1);

    // Remove 2FA enabled status from localStorage
    const userId = 'current_user_id'; // In real app, get from auth context
    localStorage.removeItem(`2fa_enabled_${userId}`);

    toast({
      title: "2FA Disabled",
      description: "Two-factor authentication has been disabled",
      variant: "destructive"
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-settings" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <Shield size={24} className="mr-2 text-gray-600" />
                Two-Factor Authentication
              </h1>
              <p className="text-gray-600 text-sm">Enhanced premium security</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status Card */}
        <Card className="p-4 bg-white border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                is2FAEnabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Shield size={24} className={is2FAEnabled ? 'text-green-600' : 'text-gray-600'} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600">
                  {is2FAEnabled ? 'Enabled and protecting your account' : 'Add an extra layer of security'}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              is2FAEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {is2FAEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </Card>

        {/* Setup Process */}
        {!is2FAEnabled && setupStep === 1 && (
          <Card className="p-4 bg-white border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Enable 2FA Protection</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <div className="font-medium text-gray-900">Download an authenticator app</div>
                  <div className="text-sm text-gray-600">Google Authenticator, Authy, or similar</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <div className="font-medium text-gray-900">Scan QR code or enter secret key</div>
                  <div className="text-sm text-gray-600">Add TradeHub Premium to your app</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <div className="font-medium text-gray-900">Enter verification code</div>
                  <div className="text-sm text-gray-600">Confirm setup with 6-digit code</div>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setSetupStep(2)}
              className="w-full mt-6 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Crown size={16} className="mr-2" />
              Start Premium 2FA Setup
            </Button>
          </Card>
        )}

        {/* QR Code Setup */}
        {!is2FAEnabled && setupStep === 2 && (
          <Card className="p-4 bg-white border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Scan QR Code</h3>
            
            <div className="text-center mb-6">
              <div className="w-64 h-64 bg-white border-2 border-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center p-4">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="2FA QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-500">Generating QR Code...</div>
                )}
              </div>
              <p className="text-sm text-gray-600">Scan this QR code with your authenticator app</p>
              <p className="text-xs text-gray-500 mt-1">
                Recommended apps: Google Authenticator, Authy, Microsoft Authenticator
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Or enter this secret key manually:</label>
              <div className="flex space-x-2">
                <Input
                  value={secretKey}
                  readOnly
                  className="flex-1 bg-gray-50 font-mono text-sm"
                />
                <Button 
                  onClick={() => copyToClipboard(secretKey)}
                  variant="outline"
                  size="sm"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-digit verification code:</label>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg font-mono"
                maxLength={6}
              />
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleVerifyCode}
                disabled={verificationCode.length !== 6}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <CheckCircle size={16} className="mr-2" />
                Verify and Enable 2FA
              </Button>
              <Button 
                onClick={() => setSetupStep(1)}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            </div>
          </Card>
        )}

        {/* Backup Codes */}
        {is2FAEnabled && setupStep === 3 && (
          <Card className="p-4 bg-white border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Key size={20} className="mr-2 text-yellow-600" />
              Backup Recovery Codes
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800 text-sm">Important!</div>
                  <div className="text-yellow-700 text-sm">Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg text-center font-mono text-sm">
                  {code}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                variant="outline"
                className="w-full"
              >
                <Copy size={16} className="mr-2" />
                Copy All Codes
              </Button>
              <Button 
                onClick={() => setSetupStep(4)}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                I've Saved My Backup Codes
              </Button>
            </div>
          </Card>
        )}

        {/* 2FA Enabled */}
        {is2FAEnabled && setupStep === 4 && (
          <Card className="p-4 bg-white border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2FA Successfully Enabled!</h3>
              <p className="text-gray-600">Your premium account is now protected with two-factor authentication.</p>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Premium Security Features:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Enhanced login protection</li>
                  <li>• Priority security monitoring</li>
                  <li>• Instant security alerts</li>
                  <li>• Premium support for security issues</li>
                </ul>
              </div>

              <Button 
                onClick={handleDisable2FA}
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
              >
                Disable 2FA
              </Button>
            </div>
          </Card>
        )}

        {/* Premium Security Tips */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Crown size={20} className="mr-2 text-yellow-600" />
            Premium Security Tips
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Smartphone size={16} className="text-gray-600 mt-1" />
              <div>
                <div className="font-medium text-gray-900 text-sm">Use a dedicated device</div>
                <div className="text-gray-600 text-sm">Keep your authenticator on a secure device</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Key size={16} className="text-gray-600 mt-1" />
              <div>
                <div className="font-medium text-gray-900 text-sm">Store backup codes safely</div>
                <div className="text-gray-600 text-sm">Keep backup codes in a secure, offline location</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield size={16} className="text-gray-600 mt-1" />
              <div>
                <div className="font-medium text-gray-900 text-sm">Regular security checkups</div>
                <div className="text-gray-600 text-sm">Review your security settings monthly</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default Premium2FA;
