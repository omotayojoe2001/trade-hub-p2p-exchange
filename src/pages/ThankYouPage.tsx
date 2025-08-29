import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Receipt, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ThankYouPageProps {
  type?: 'trade_completed' | 'trade_created' | 'payment_received' | 'profile_completed';
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({ type = 'trade_completed' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pageType = searchParams.get('type') || type;

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2,
        },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const getContent = () => {
    switch (pageType) {
      case 'trade_completed':
        return {
          title: 'Trade Successfully Completed!',
          description: 'Your cryptocurrency trade has been completed successfully. Both parties have received their assets.',
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          actions: [
            { label: 'Download Receipt', action: () => navigate('/trade-history'), icon: Receipt },
            { label: 'Rate Experience', action: () => navigate('/rate-merchant'), icon: Star },
            { label: 'Start New Trade', action: () => navigate('/'), icon: Home },
          ],
        };
      case 'trade_created':
        return {
          title: 'Trade Request Created!',
          description: 'Your trade request has been submitted successfully. We will notify you when a merchant accepts your request.',
          icon: <CheckCircle className="w-16 h-16 text-blue-500" />,
          actions: [
            { label: 'View My Trades', action: () => navigate('/trade-history'), icon: Receipt },
            { label: 'Create Another', action: () => navigate('/buy-sell'), icon: Home },
            { label: 'Go Home', action: () => navigate('/'), icon: Home },
          ],
        };
      case 'payment_received':
        return {
          title: 'Payment Confirmed!',
          description: 'We have confirmed the receipt of your payment. Your cryptocurrency will be released to your wallet shortly.',
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          actions: [
            { label: 'View Transaction', action: () => navigate('/trade-history'), icon: Receipt },
            { label: 'Go Home', action: () => navigate('/'), icon: Home },
          ],
        };
      case 'profile_completed':
        return {
          title: 'Profile Setup Complete!',
          description: 'Your profile has been successfully set up. You can now start trading cryptocurrencies on our platform.',
          icon: <CheckCircle className="w-16 h-16 text-purple-500" />,
          actions: [
            { label: 'Start Trading', action: () => navigate('/buy-sell'), icon: Home },
            { label: 'View Profile', action: () => navigate('/profile-settings'), icon: Receipt },
          ],
        };
      default:
        return {
          title: 'Success!',
          description: 'Your action has been completed successfully.',
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          actions: [
            { label: 'Go Home', action: () => navigate('/'), icon: Home },
          ],
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-2xl">
        <CardHeader className="space-y-6 pb-2">
          <div className="flex justify-center">
            {content.icon}
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {content.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-lg">
            {content.description}
          </p>

          <div className="space-y-3">
            {content.actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.action}
                className="w-full"
                variant={index === 0 ? 'default' : 'outline'}
              >
                <action.icon className="w-4 h-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>

          <div className="pt-4 text-xs text-muted-foreground">
            Thank you for using CryptoPay!
          </div>
        </CardContent>
      </Card>
    </div>
  );
};