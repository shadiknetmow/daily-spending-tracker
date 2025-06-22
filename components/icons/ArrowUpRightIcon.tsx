// components/icons/ArrowUpRightIcon.tsx
import React from 'react';

interface IconProps {
  className?: string;
}

const ArrowUpRightIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={`w-4 h-4 ${className}`} // Default size, can be overridden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  </svg>
);

export default ArrowUpRightIcon;