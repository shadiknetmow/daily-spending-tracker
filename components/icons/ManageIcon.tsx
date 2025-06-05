
import React from 'react';

interface IconProps {
  className?: string;
}

const ManageIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={`w-4 h-4 ${className}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75m-9.75 6h9.75M3.75 6.75h1.5v1.5h-1.5v-1.5Zm0 5.25h1.5v1.5h-1.5v-1.5Zm0 5.25h1.5v1.5h-1.5v-1.5Z" />
  </svg>
);

export default ManageIcon;
