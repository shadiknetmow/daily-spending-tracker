// components/icons/BuildingLibraryIcon.tsx
import React from 'react';

interface IconProps {
  className?: string;
}

const BuildingLibraryIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={`w-5 h-5 ${className}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6M5.25 10.5h13.5A2.25 2.25 0 0 1 21 12.75v5.25a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V12.75A2.25 2.25 0 0 1 5.25 10.5z" />
    {/* Simplified detail, original was too complex for a small icon */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h9" /> 
  </svg>
);

export default BuildingLibraryIcon;