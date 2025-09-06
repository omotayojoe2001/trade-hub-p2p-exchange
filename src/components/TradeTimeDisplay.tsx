import React from 'react';

interface TradeTimeDisplayProps {
  date: Date;
  className?: string;
}

const TradeTimeDisplay: React.FC<TradeTimeDisplayProps> = ({ date, className = "" }) => {
  return (
    <div className={`text-xs text-muted-foreground text-right ${className}`}>
      <div>{date.toLocaleDateString()}</div>
      <div>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  );
};

export default TradeTimeDisplay;