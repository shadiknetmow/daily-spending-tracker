
import React, { useEffect, useState } from 'react';
import { BN_UI_TEXT } from '../constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' | 'screen';
  headerActions?: React.ReactNode; // Optional slot for actions like full-screen toggle
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', headerActions }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10); 
      
      document.body.style.overflow = 'hidden';
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (size !== 'screen') { // Only adjust padding if not full screen
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }


      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '0';
      };
    } else {
      setIsVisible(false);
      setTimeout(() => {
          if (!document.querySelector('.fixed.inset-0.bg-black.bg-opacity-70')) { 
             document.body.style.overflow = 'auto';
             document.body.style.paddingRight = '0';
          }
      }, 300); 
    }
  }, [isOpen, size]);

  if (!isOpen && !isVisible) return null;


  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-full h-full',
    screen: 'w-screen h-screen max-w-none max-h-none rounded-none shadow-none',
  };
  
  const overlayPaddingClass = size === 'screen' ? 'p-0' : 'p-4';
  const modalContentBaseClass = "bg-white flex flex-col transform transition-all duration-300 ease-out";
  const modalContentSizedClass = size === 'screen' 
    ? sizeClasses.screen 
    : `p-5 sm:p-6 rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh]`;


  return (
    <div
      className={`fixed inset-0 bg-black flex items-center justify-center z-[70] transition-opacity duration-300 ease-out ${overlayPaddingClass} ${isOpen && isVisible ? 'bg-opacity-70 opacity-100' : 'bg-opacity-0 opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={isOpen && isVisible ? onClose : undefined} 
    >
      <div
        className={`
          ${modalContentBaseClass} ${modalContentSizedClass}
          ${isOpen && isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
        onClick={(e) => e.stopPropagation()} 
      >
        <div className={`flex justify-between items-center mb-4 pb-3 border-b border-slate-200 ${size === 'screen' ? 'px-4 pt-4 sm:px-6 sm:pt-5' : ''}`}>
          <h2 id="modal-title" className="text-xl sm:text-2xl font-semibold text-slate-800 flex-grow truncate mr-2">
            {title}
          </h2>
          <div className="flex items-center space-x-2 flex-shrink-0"> {/* Added flex-shrink-0 */}
            {headerActions}
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label={BN_UI_TEXT.CLOSE_BTN}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className={`overflow-y-auto flex-grow custom-scrollbar-modal pr-1 ${size === 'screen' ? 'px-4 pb-4 sm:px-6 sm:pb-5' : ''}`}>
          {children}
        </div>
      </div>
      <style>{`
        .custom-scrollbar-modal::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar-modal::-webkit-scrollbar-track {
          background: #f8fafc; /* bg-slate-50 */
          border-radius: 10px;
        }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb {
          background: #e2e8f0; /* slate-200 */
          border-radius: 10px;
        }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1; /* slate-300 */
        }
      `}</style>
    </div>
  );
};

export default Modal;
