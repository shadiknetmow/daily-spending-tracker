import React from 'react';

interface IconProps {
  className?: string;
}

const MicrophoneIconSolid: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-5 h-5 ${className}`}
  >
    <path d="M11.999 14.942c2.066 0 3.75-1.683 3.75-3.75V6.017c0-2.067-1.684-3.75-3.75-3.75s-3.75 1.683-3.75 3.75v5.175c0 2.067 1.684 3.75 3.75 3.75Z" />
    <path d="M11.999 18.75c3.444 0 6.25-2.806 6.25-6.25h-1.5c0 2.615-2.135 4.75-4.75 4.75s-4.75-2.135-4.75-4.75h-1.5c0 3.444 2.806 6.25 6.25 6.25Z" />
    <path d="M11.249 21.75v-2.272a29.196 29.196 0 0 0-4.002-.432 1.072 1.072 0 0 1-.998-1.072V17.25a.75.75 0 0 1 1.5 0v.383c0 .088.07.16.157.171a27.807 27.807 0 0 0 6.587 0c.087-.01.157-.083.157-.172v-.383a.75.75 0 0 1 1.5 0v.723c0 .544-.408 1.005-.941 1.065a29.318 29.318 0 0 0-4.002.432V21.75a.75.75 0 0 1-1.5 0Z" />
  </svg>
);

export default MicrophoneIconSolid;