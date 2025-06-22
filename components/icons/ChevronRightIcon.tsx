
import React from 'react';

interface IconProps {
  className?: string;
}

const ChevronRightIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={`w-5 h-5 ${className}`}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="m8.25 4.5 7.5 7.5-7.5 7.5" 
    />
  </svg>
);

export default ChevronRightIcon;