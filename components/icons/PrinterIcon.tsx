
import React from 'react';

interface IconProps {
  className?: string;
}

const PrinterIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-5 h-5 ${className}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0c1.281.21 2.072 1.13 2.072 2.182V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5v-.14c0-1.052.79-1.972 2.072-2.182m11.318 0-1.895-1.895c-.342-.342-.342-.895 0-1.238l.444-.443c.34-.34.896-.34 1.237 0l1.896 1.896a.608.608 0 0 1 0 .858l-.443.443c-.343.343-.896.343-1.238 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
 </svg>
);

export default PrinterIcon;
