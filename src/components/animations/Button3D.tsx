import React from 'react';
import { motion } from 'framer-motion';

interface Button3DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const Button3D: React.FC<Button3DProps> = ({ 
  children, 
  className = '',
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 text-gray-900 border-gray-200';
      case 'success':
        return 'bg-green-600 text-white border-green-700';
      case 'danger':
        return 'bg-red-600 text-white border-red-700';
      default:
        return 'bg-blue-600 text-white border-blue-700';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <motion.button
      initial={{ 
        rotateX: 0,
        rotateY: 0,
        scale: 1
      }}
      whileHover={!disabled ? {
        rotateX: -5,
        rotateY: 5,
        scale: 1.05,
        transition: { duration: 0.2 }
      } : {}}
      whileTap={!disabled ? {
        rotateX: 5,
        rotateY: -2,
        scale: 0.95,
        transition: { duration: 0.1 }
      } : {}}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${className}
        rounded-lg font-medium border-2 shadow-lg
        transform-gpu transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'}
      `}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: disabled ? 'none' : '0 8px 16px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)'
      }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <motion.span
        initial={{ z: 0 }}
        whileHover={!disabled ? { z: 10 } : {}}
        className="block transform-gpu"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

export default Button3D;