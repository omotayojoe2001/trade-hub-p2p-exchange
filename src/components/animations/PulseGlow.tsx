import React from 'react';
import { motion } from 'framer-motion';

interface PulseGlowProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const PulseGlow: React.FC<PulseGlowProps> = ({ 
  children, 
  className = '',
  color = 'blue',
  intensity = 'medium'
}) => {
  const getGlowIntensity = () => {
    switch (intensity) {
      case 'low':
        return { scale: [1, 1.02, 1], opacity: [0.7, 0.9, 0.7] };
      case 'high':
        return { scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] };
      default:
        return { scale: [1, 1.05, 1], opacity: [0.7, 0.95, 0.7] };
    }
  };

  const glowAnimation = getGlowIntensity();

  return (
    <motion.div
      animate={glowAnimation}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={`relative ${className}`}
      style={{
        filter: `drop-shadow(0 0 10px ${color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : color === 'red' ? '#ef4444' : '#8b5cf6'}40)`
      }}
    >
      {children}
    </motion.div>
  );
};

export default PulseGlow;