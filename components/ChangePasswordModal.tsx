
import React, { useState, FormEvent } from 'react';
import { BN_UI_TEXT } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon'; // For displaying errors

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [localError, setLocalError] = useState<string | null>(null); // For client-side validation errors

  const { changePassword, isAuthLoading, authError, clearAuthError } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError(); // Clear previous context errors

    if (newPassword.length < 6) {
      setLocalError(BN_UI_TEXT.NEW_PASSWORD_LABEL);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setLocalError(BN_UI_TEXT.PASSWORDS_DONT_MATCH);
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      // AuthContext will show success notification
      onClose(); // Close modal on success
    } catch (err: any) {
      // AuthContext sets authError and shows notification for backend errors like incorrect current password
      // If it's a different kind of error not handled by authError, display it locally
      if (!authError && err.message !== BN_UI_TEXT.ERROR_CURRENT_PASSWORD_INCORRECT) {
          setLocalError(err.message || BN_UI_TEXT.AUTH_ERROR_GENERAL);
      }
    }
  };

  const displayError = authError || localError;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[99]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-modal-title"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-5">
            <h2 id="change-password-modal-title" className="text-xl font-semibold text-slate-700">
            {BN_UI_TEXT.CHANGE_PASSWORD_MODAL_TITLE}
            </h2>
            <button
                onClick={() => { onClose(); clearAuthError(); setLocalError(null);}}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                aria-label={BN_UI_TEXT.CLOSE_BTN}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.CURRENT_PASSWORD_LABEL}
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>
          <div>
            <label htmlFor="newPasswordModal" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.NEW_PASSWORD_LABEL}
            </label>
            <input
              type="password"
              id="newPasswordModal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={BN_UI_TEXT.PASSWORD_PLACEHOLDER}
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 ${localError && localError.includes("পাসওয়ার্ড") ? 'border-red-500' : 'border-slate-300'}`}
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="confirmNewPasswordModal" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.CONFIRM_NEW_PASSWORD_LABEL}
            </label>
            <input
              type="password"
              id="confirmNewPasswordModal"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder={BN_UI_TEXT.PASSWORD_PLACEHOLDER}
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 ${localError && localError === BN_UI_TEXT.PASSWORDS_DONT_MATCH ? 'border-red-500' : 'border-slate-300'}`}
              required
              minLength={6}
            />
          </div>

          {displayError && (
            <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded-md flex items-start space-x-2" role="alert">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => { onClose(); clearAuthError(); setLocalError(null);}}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              disabled={isAuthLoading}
            >
              {BN_UI_TEXT.CANCEL}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isAuthLoading}
            >
              {isAuthLoading ? BN_UI_TEXT.LOADING : BN_UI_TEXT.RESET_PASSWORD_BTN}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
