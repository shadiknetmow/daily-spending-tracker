
import React from 'react';

interface IconProps {
  className?: string;
}

const LightBulbIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={`w-6 h-6 ${className}`}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.354a15.055 15.055 0 0 1-3 0M12 3v2.25m0 0a6.01 6.01 0 0 0 1.5.189m-1.5-.189a6.01 6.01 0 0 1-1.5.189M15.75 5.25A6.01 6.01 0 0 0 12 4.5a6.01 6.01 0 0 0-3.75.75M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" 
    />
  </svg>
);

export default LightBulbIcon;
