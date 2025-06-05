
import React from 'react';

interface IconProps {
  className?: string;
}

const ChatBubbleIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-4 h-4 ${className}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.861 8.25-8.625 8.25S3.75 16.556 3.75 12 7.611 3.75 12.375 3.75 21 7.444 21 12Zm-2.625 .065c.014-.09.021-.182.021-.275a2.625 2.625 0 0 0-4.645-1.9C13.001 9.53 12.36 9 11.625 9S10.25 9.53 9.506 10.065A2.625 2.625 0 0 0 4.86 11.79c.007.093.014.185.021.275L4.5 14.25l2.622-.751a9.004 9.004 0 0 0 1.378.562A9.004 9.004 0 0 0 11.625 15a8.963 8.963 0 0 0 3.13-.562l2.622.751L18.375 12.065Z" />
  </svg>
);

export default ChatBubbleIcon;