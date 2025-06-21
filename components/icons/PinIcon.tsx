
import React from 'react';

interface IconProps {
  className?: string;
  isFilled?: boolean; 
}
const PinIcon: React.FC<IconProps> = ({ className, isFilled }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill={isFilled ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth={1.5} 
    className={`w-4 h-4 ${className}`} // Default size, can be overridden
  >
    {/* Simple Pin Icon Path - you can replace this with a more detailed one if needed */}
    {isFilled ? (
      // Filled Pin Path
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.374H8.958a1.313 1.313 0 01-1.242-1.528l.763-4.578a3.06 3.06 0 00-.716-2.539l-.008-.008a3.06 3.06 0 00-2.54-1.066H3.75V9.75a2.25 2.25 0 012.25-2.25h12a2.25 2.25 0 012.25 2.25v1.906a3.06 3.06 0 00-2.54 1.066l-.008.008a3.06 3.06 0 00-.716 2.539l.763 4.578a1.313 1.313 0 01-1.242 1.528zM12 3.375v6" />
    ) : (
      // Outline Pin Path
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.374H8.958a1.313 1.313 0 01-1.242-1.528l.763-4.578a3.06 3.06 0 00-.716-2.539l-.008-.008a3.06 3.06 0 00-2.54-1.066H3.75V9.75a2.25 2.25 0 012.25-2.25h12a2.25 2.25 0 012.25 2.25v1.906a3.06 3.06 0 00-2.54 1.066l-.008.008a3.06 3.06 0 00-.716 2.539l.763 4.578a1.313 1.313 0 01-1.242 1.528zM12 3.375v6" />
    )}
  </svg>
);
export default PinIcon;
