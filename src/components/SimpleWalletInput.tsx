import React from 'react';
import { Input } from '@/components/ui/input';

interface SimpleWalletInputProps {
  coinType: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SimpleWalletInput: React.FC<SimpleWalletInputProps> = ({
  coinType,
  value,
  onChange,
  placeholder
}) => {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || `Enter your ${coinType} wallet address`}
    />
  );
};