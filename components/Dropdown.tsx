import React, { useState, useEffect, useRef, ReactNode, Children, isValidElement, cloneElement, ReactElement } from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  menuWidthClass?: string;
  menuMaxHeightClass?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ 
  trigger, 
  children, 
  menuWidthClass = 'w-56',
  menuMaxHeightClass = 'max-h-96' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={toggleDropdown} className="cursor-pointer h-full flex items-center" role="button" aria-haspopup="true" aria-expanded={isOpen}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`origin-top-right absolute right-0 mt-2 ${menuWidthClass} rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 transition-all duration-100 ease-out transform ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu" // Consider making this dynamic if trigger has an ID
        >
          <div className={`py-1 ${menuMaxHeightClass} overflow-y-auto custom-scrollbar-modal`} role="none">
            {Children.map(children, child => {
              if (isValidElement<{ onClick?: (event: React.MouseEvent) => void }>(child)) {
                const originalOnClick = child.props.onClick;
                return cloneElement(child as ReactElement<any>, { // Type assertion for cloneElement
                  onClick: (event: React.MouseEvent) => {
                    if (originalOnClick) {
                      originalOnClick(event);
                    }
                    setIsOpen(false);
                  }
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownButtonTriggerProps {
    text: string;
    className?: string;
    title?: string;
}
export const DropdownButtonTrigger: React.FC<DropdownButtonTriggerProps> = ({ text, className, title }) => (
    <button
        type="button"
        className={`inline-flex justify-center items-center w-full h-full rounded-md border border-transparent shadow-sm px-3 py-2 bg-transparent text-sm font-medium text-white hover:bg-teal-700/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-teal-600 focus:ring-teal-500 transition-colors duration-150 ${className}`}
        aria-haspopup="true"
        title={title || text}
    >
        {text}
        <ChevronDownIcon className="-mr-1 ml-1.5 h-4 w-4 text-white/80" />
    </button>
);

export default Dropdown;