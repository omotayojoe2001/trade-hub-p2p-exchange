import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover3D?: boolean;
  onClick?: () => void;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  className = '', 
  delay = 0, 
  hover3D = true,
  onClick 
}) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 20,
        rotateX: -15,
        scale: 0.95
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        rotateX: 0,
        scale: 1
      }}
      transition={{ 
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={hover3D ? {
        scale: 1.02,
        rotateX: 5,
        rotateY: 5,
        z: 50,
        transition: { duration: 0.3 }
      } : { scale: 1.02 }}
      whileTap={{ 
        scale: 0.98,
        rotateX: -2,
        transition: { duration: 0.1 }
      }}
      className={`transform-gpu ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;