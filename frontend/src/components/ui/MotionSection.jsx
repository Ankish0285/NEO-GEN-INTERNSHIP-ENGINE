import React from 'react';
import { motion } from 'framer-motion';

const MotionSection = ({ children, className = '', delay = 0, id }) => (
  <motion.section
    id={id}
    className={className}
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.section>
);

export default MotionSection;
