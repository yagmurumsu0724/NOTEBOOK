import React from 'react';
import { motion } from 'framer-motion';
import './ui.css';

type IconButtonProps = React.ComponentProps<typeof motion.button> & {
  icon: React.ReactNode;
  variant?: 'ghost' | 'glass' | 'solid';
  size?: 'sm' | 'md' | 'lg';
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'ghost', size = 'md', className = '', ...props }, ref) => {
    const classNames = `kw-icon-btn kw-icon-btn-${size} kw-icon-btn-${variant} ${className}`;
    
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={classNames}
        {...props}
      >
        {icon}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';
