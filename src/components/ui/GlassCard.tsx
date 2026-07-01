import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/glassmorphism.css';

type GlassCardProps = React.ComponentProps<typeof motion.div> & {
  children: React.ReactNode;
  hoverEffect?: boolean;
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, hoverEffect = false, className = '', ...props }, ref) => {
    
    return (
      <motion.div
        ref={ref}
        whileHover={hoverEffect ? { y: -4, scale: 1.01, boxShadow: 'var(--shadow-hover)' } : undefined}
        className={`glass-card ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
