
import React from 'react';
import { BN_UI_TEXT } from '../constants';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';

interface SimpleErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

const SimpleErrorModal: React.FC<SimpleErrorModalProps> = ({
  isOpen,
  onClose,
  message,
  title = "ত্রুটি", // Default title "Error"
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[101]" // Higher z-index
      role="dialog"
      aria-modal="true"
      aria-labelledby="simple-error-modal-title"
      onClick={onClose} 
    >
      <div
        className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm transform transition-all duration-150 ease-out scale-100"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInScaleUp 0.2s ease-out forwards' }}
      >
        <div className="flex items-start">
          <div className="mr-3 flex-shrink-0">
            <ExclamationCircleIcon className="h-6 w-6 text-red-500" aria-hidden="true" />
          </div>
          <div className="flex-grow">
            <h2 id="simple-error-modal-title" className="text-lg font-semibold text-slate-800 mb-2">
              {title}
            </h2>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {BN_UI_TEXT.CLOSE_BTN}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInScaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SimpleErrorModal;
