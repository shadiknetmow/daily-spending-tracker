
import React from 'react';

interface IconProps {
  className?: string;
}

const KeyboardIcon: React.FC<IconProps> = ({ className }) => (
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
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    />
     <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75h.008v.008h-.008V6.75Zm.75 0V12m0 2.25h.008v.008h-.008v-.008Zm0 0V12m2.25-5.25h.008v.008H18.75V6.75Zm.75 0V12m0 2.25h.008v.008h-.008v-.008Zm0 0V12m-2.25 5.25h.008v.008H18.75V17.25Zm.75 0V12M15 6.75H9.75M15 12H9.75M15 17.25H9.75M9 6.75H6.75M9 12H6.75M9 17.25H6.75M6 6.75V12m0 5.25V12" />
  </svg>
);

export default KeyboardIcon;
