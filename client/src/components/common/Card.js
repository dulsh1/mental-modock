import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  onClick = null,
  padding = 'p-6'
}) => {
  const baseClasses = `card ${padding} ${className}`;
  
  if (hover || onClick) {
    return (
      <motion.div
        className={`${baseClasses} cursor-pointer`}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
};

export default Card;
