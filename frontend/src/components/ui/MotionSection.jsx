import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const MotionSection = ({ children, className = '', delay = 0, id }) => (
  <MotionSectionContent className={className} delay={delay} id={id}>
    {children}
  </MotionSectionContent>
);

const MotionSectionContent = ({ children, className, delay, id }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={prefersReducedMotion ? undefined : { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
};

export default MotionSection;
