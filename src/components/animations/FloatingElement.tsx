import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const FloatingElement: React.FC<FloatingElementProps> = ({ 
  children, 
  className = '',
  intensity = 'medium'
}) => {
  const getFloatAnimation = () => {
    switch (intensity) {
      case 'low':
        return { y: [-2, 2, -2], duration: 4 };
      case 'high':
        return { y: [-8, 8, -8], duration: 2.5 };
      default:
        return { y: [-5, 5, -5], duration: 3 };
    }
  };

  const floatAnimation = getFloatAnimation();

  return (
    <motion.div
      animate={{
        y: floatAnimation.y,
        rotateZ: [-1, 1, -1]
      }}
      transition={{
        duration: floatAnimation.duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default FloatingElement;