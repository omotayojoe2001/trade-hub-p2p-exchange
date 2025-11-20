import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface NativeButtonProps extends ButtonProps {
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
  ripple?: boolean;
}

export const NativeButton: React.FC<NativeButtonProps> = ({
  hapticFeedback = 'light',
  ripple = true,
  onClick,
  className = '',
  children,
  ...props
}) => {
  const { impact } = useHapticFeedback();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hapticFeedback !== 'none') {
      await impact(hapticFeedback);
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      className={`
        relative overflow-hidden transition-all duration-200 
        active:scale-95 active:brightness-95
        ${ripple ? 'ripple-effect' : ''}
        ${className}
      `}
    >
      {children}
    </Button>
  );
};