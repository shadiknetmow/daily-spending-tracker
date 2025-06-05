
import React from 'react';

interface IconProps {
  className?: string;
}

const VideoCameraSlashIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-6 h-6 ${className}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5A2.25 2.25 0 012.25 16.5V7.5A2.25 2.25 0 014.5 5.25H12m3 13.5V12M12 12V5.25M12 12h3.75m0 0A2.25 2.25 0 0118 14.25v2.25M12 12h3.75m-3.75 0A2.25 2.25 0 009.75 14.25v2.25m0 0A2.25 2.25 0 017.5 18.75M12 5.25A2.25 2.25 0 009.75 7.5M12 5.25A2.25 2.25 0 0114.25 7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);

export default VideoCameraSlashIcon;
