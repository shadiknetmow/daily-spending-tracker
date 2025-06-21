
import React from 'react';

interface IconProps {
  className?: string;
}

const ListChecksIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-5 h-5 ${className}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068M15.75 21H9c-2.625 0-4.875-2.25-4.875-5V7.5c0-2.625 2.25-4.875 4.875-4.875h7.5c2.625 0 4.875 2.25 4.875 4.875v3.75M9 12h9m-9 3h4.5m-4.5 3h1.5" />
  </svg>
);

export default ListChecksIcon;
