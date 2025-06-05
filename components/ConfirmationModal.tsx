
import React from 'react';
import { BN_UI_TEXT } from '../constants';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string; 
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = BN_UI_TEXT.CONFIRM_BTN_YES_DELETE || "নিশ্চিত করুন",
  cancelButtonText = BN_UI_TEXT.CANCEL,
  confirmButtonColor = "bg-red-600 hover:bg-red-700 focus:ring-red-500",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[102]" // Ensure high z-index
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      onClick={onClose} // Close on overlay click
    >
      <div
        className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md transform transition-all duration-150 ease-out scale-100"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal content click
        style={{ animation: 'fadeInScaleUp 0.2s ease-out forwards' }}
      >
        <h2 id="confirmation-modal-title" className="text-xl font-semibold text-slate-800 mb-4">
          {title}
        </h2>
        <div className="text-sm text-slate-600 mb-6 whitespace-pre-wrap">
          {message}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              // onClose(); // The calling component should handle closing after confirm if needed
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${confirmButtonColor}`}
          >
            {confirmButtonText}
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

export default ConfirmationModal;
