import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ 
        x: 20,
        opacity: 0.8
      }}
      animate={{ 
        x: 0,
        opacity: 1
      }}
      exit={{ 
        x: -20,
        opacity: 0.8
      }}
      transition={{
        duration: 0.15,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;