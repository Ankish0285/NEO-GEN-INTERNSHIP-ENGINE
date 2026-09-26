import React from 'react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';

const Card = ({ 
  children, 
  className, 
  noPadding = false, 
  title, 
  subtitle, 
  action,
  onClick,
  variant = 'default',
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div 
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      whileHover={onClick && !prefersReducedMotion ? { y: -3 } : undefined}
      transition={{ duration: prefersReducedMotion ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={clsx(
        'neo-glass overflow-hidden relative',
        onClick && 'cursor-pointer hover:shadow-lg transition-all duration-300',
        className
      )}
    >
      {(title || action) && (
        <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center">
          <div>
            {title && <h3 className="text-xl font-bold text-[#111827]">{title}</h3>}
            {subtitle && <p className="text-sm text-[#4B5563] mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={clsx(!noPadding && "p-6")}>
        {children}
      </div>
    </motion.div>
  );
};

export default Card;
