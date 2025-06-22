
import React from 'react';

interface IconProps {
  className?: string;
}

const BuildingOfficeIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={`w-5 h-5 ${className}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6M5.25 21v-3.375c0-.621.504-1.125 1.125-1.125h11.25c.621 0 1.125.504 1.125 1.125V21" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.75h.008v.008H6V6.75Zm0 4.5h.008v.008H6v-.008Zm0 4.5h.008v.008H6v-.008Zm0 4.5h.008v.008H6V20.25Zm12-13.5h.008v.008h-.008V6.75Zm0 4.5h.008v.008h-.008v-.008Zm0 4.5h.008v.008h-.008v-.008Zm0 4.5h.008v.008h-.008V20.25Z" />
  </svg>
);

export default BuildingOfficeIcon;
