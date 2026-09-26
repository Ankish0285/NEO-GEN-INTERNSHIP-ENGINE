import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const MotionReveal = ({
  children,
  className = '',
  delay = 0,
  y = 24,
  scale = 1,
  duration = 0.6,
  as = 'div',
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  return (
    <Component
      className={className}
      {...props}
      initial={prefersReducedMotion ? false : { opacity: 0, y, scale }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: prefersReducedMotion ? 0.25 : duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
};

export default MotionReveal;
