import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TradeCountdownProps {
  startTime: Date;
  duration: number; // in minutes
  className?: string;
}

const TradeCountdown: React.FC<TradeCountdownProps> = ({ 
  startTime, 
  duration, 
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const endTime = start + (duration * 60 * 1000); // Convert minutes to milliseconds
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeLeft('Expired');
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }

      setIsExpired(false);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [startTime, duration]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Clock size={12} className={isExpired ? 'text-red-500' : 'text-orange-500'} />
      <span className={`text-xs font-medium ${
        isExpired ? 'text-red-500' : 'text-orange-500'
      }`}>
        {timeLeft}
      </span>
    </div>
  );
};

export default TradeCountdown;
