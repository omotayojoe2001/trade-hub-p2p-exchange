import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinner3DProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
}

const LoadingSpinner3D: React.FC<LoadingSpinner3DProps> = ({ 
  size = 'md',
  color = 'blue',
  text = 'Loading...'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6';
      case 'lg':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'border-green-500';
      case 'red':
        return 'border-red-500';
      case 'purple':
        return 'border-purple-500';
      default:
        return 'border-blue-500';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        animate={{
          rotateX: [0, 360],
          rotateY: [0, 360],
          rotateZ: [0, 360]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
        className={`${getSizeClasses()} ${getColorClasses()} border-4 border-t-transparent border-r-transparent rounded-full`}
        style={{
          transformStyle: 'preserve-3d'
        }}
      />
      {text && (
        <motion.p
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-gray-600 mt-4 text-sm"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner3D;