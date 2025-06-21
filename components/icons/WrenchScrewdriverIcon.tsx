import React from 'react';

interface IconProps {
  className?: string;
}

const WrenchScrewdriverIcon: React.FC<IconProps> = ({ className }) => (
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
      d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877m0 0L11.25 7.5M11.42 15.17l2.472-2.472a3.375 3.375 0 000-4.773L6.273 2.273a3.375 3.375 0 00-4.773 0L2.25 1.5l9.542 9.542L3 15.75l-2.25 2.25a4.482 4.482 0 006.338 6.338l2.25-2.25 5.173-5.173L11.42 15.17z" 
    />
  </svg>
);

export default WrenchScrewdriverIcon;