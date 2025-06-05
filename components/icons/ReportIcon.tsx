
import React from 'react';

interface IconProps {
  className?: string;
}

const ReportIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={`w-5 h-5 ${className}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 3c-.397 0-.789.026-1.175.073M12 3a8.966 8.966 0 0 1-6.284 2.288" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12c0 .082.002.164.005.245M3 12a9 9 0 0 1 2.977-6.739" />
  </svg>
);

export default ReportIcon;
