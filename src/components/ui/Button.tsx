import React from 'react';
import { motion } from 'framer-motion';
import './ui.css';

type ButtonProps = React.ComponentProps<typeof motion.button> & {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', leftIcon, rightIcon, children, className = '', ...props }, ref) => {
    const classNames = `kw-btn kw-btn-${variant} kw-btn-${size} ${className}`;
    
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        className={classNames}
        {...props}
      >
        {leftIcon && <span className="kw-btn-icon-left">{leftIcon}</span>}
        {children as any}
        {rightIcon && <span className="kw-btn-icon-right">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
