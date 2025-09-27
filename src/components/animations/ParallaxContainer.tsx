import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxContainerProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down';
}

const ParallaxContainer: React.FC<ParallaxContainerProps> = ({ 
  children, 
  className = '',
  speed = 0.5,
  direction = 'up'
}) => {
  const { scrollY } = useScroll();
  const [elementTop, setElementTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);

  const y = useTransform(
    scrollY,
    [elementTop - clientHeight, elementTop + clientHeight],
    direction === 'up' 
      ? [-speed * 100, speed * 100]
      : [speed * 100, -speed * 100]
  );

  useEffect(() => {
    const element = document.getElementById('parallax-container');
    if (element) {
      const onResize = () => {
        setElementTop(element.offsetTop);
        setClientHeight(window.innerHeight);
      };
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, []);

  return (
    <motion.div
      id="parallax-container"
      style={{ y }}
      className={`transform-gpu ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default ParallaxContainer;