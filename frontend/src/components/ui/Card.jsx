import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className, 
  noPadding = false, 
  title, 
  subtitle, 
  action,
  onClick
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={clsx(
        "glass-card overflow-hidden relative",
        onClick && "cursor-pointer hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      {(title || action) && (
        <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center">
          <div>
            {title && <h3 className="heading-navy text-xl">{title}</h3>}
            {subtitle && <p className="text-sub text-sm mt-1">{subtitle}</p>}
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
