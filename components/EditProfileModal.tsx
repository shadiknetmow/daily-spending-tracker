
import React, { useState, useEffect, FormEvent } from 'react';
import { BN_UI_TEXT } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateCurrentUserData, isAuthLoading, authError, clearAuthError } = useAuth();

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [facebookProfileUrl, setFacebookProfileUrl] = useState(''); // New state for Facebook URL
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setMobileNumber(currentUser.mobileNumber || '');
      setFacebookProfileUrl(currentUser.facebookProfileUrl || ''); // Initialize Facebook URL
    }
    setLocalError(null);
    if (authError) clearAuthError();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUser]);


  if (!isOpen || !currentUser) return null;

  const validateMobileNumber = (mobile: string): boolean => {
    if (mobile.trim() === '') return true; 
    const mobileRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    return mobileRegex.test(mobile);
  };

  const validateFacebookUrl = (url: string): boolean => {
    if (url.trim() === '') return true; // Allow empty URL
    // Basic regex for Facebook profile URLs. More complex validation might be needed for all cases.
    const facebookRegex = /^(https?:\/\/)?(www\.)?(m\.)?(facebook|fb)\.com\/[a-zA-Z0-9(\.\_\-?/=&\ S)]+$/i;
    return facebookRegex.test(url);
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!name.trim()) {
      setLocalError(BN_UI_TEXT.NAME_PLACEHOLDER + " আবশ্যক।");
      return;
    }
    
    if (mobileNumber.trim() && !validateMobileNumber(mobileNumber.trim())) {
        setLocalError(BN_UI_TEXT.INVALID_MOBILE_NUMBER_FORMAT);
        return;
    }

    if (facebookProfileUrl.trim() && !validateFacebookUrl(facebookProfileUrl.trim())) {
        setLocalError(BN_UI_TEXT.INVALID_FACEBOOK_URL);
        return;
    }

    const updates: Partial<Pick<User, 'name' | 'mobileNumber' | 'facebookProfileUrl'>> = {};
    if (name.trim() !== (currentUser.name || '')) {
      updates.name = name.trim();
    }
    if (mobileNumber.trim() !== (currentUser.mobileNumber || '')) {
      updates.mobileNumber = mobileNumber.trim() === '' ? undefined : mobileNumber.trim();
    } else if (!mobileNumber.trim() && currentUser.mobileNumber) { 
        updates.mobileNumber = undefined;
    }
    
    if (facebookProfileUrl.trim() !== (currentUser.facebookProfileUrl || '')) {
        updates.facebookProfileUrl = facebookProfileUrl.trim() === '' ? undefined : facebookProfileUrl.trim();
    } else if (!facebookProfileUrl.trim() && currentUser.facebookProfileUrl) {
        updates.facebookProfileUrl = undefined;
    }


    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }
    
    try {
      await updateCurrentUserData(updates);
      onClose();
    } catch (err: any) {
      if (!authError && err.message !== BN_UI_TEXT.MOBILE_NUMBER_ALREADY_IN_USE.replace('{mobileNumber}','')) {
          setLocalError(err.message || BN_UI_TEXT.AUTH_ERROR_GENERAL);
      }
    }
  };
  
  const displayError = authError || localError;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-5">
            <h2 id="edit-profile-modal-title" className="text-xl font-semibold text-slate-700">
            {BN_UI_TEXT.EDIT_PROFILE_MODAL_TITLE}
            </h2>
            <button
                onClick={() => { onClose(); clearAuthError(); setLocalError(null); }}
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
            <label htmlFor="profile-name" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.NAME} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>
          <div>
            <label htmlFor="profile-mobile" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.PERSON_MOBILE_NUMBER}
            </label>
            <input
              type="tel"
              id="profile-mobile"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder={BN_UI_TEXT.PERSON_MOBILE_PLACEHOLDER}
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 ${localError && (localError === BN_UI_TEXT.INVALID_MOBILE_NUMBER_FORMAT || localError.includes(BN_UI_TEXT.MOBILE_NUMBER_ALREADY_IN_USE.split(" ")[0]) ) ? 'border-red-500' : 'border-slate-300'}`}
            />
          </div>
           <div>
            <label htmlFor="profile-facebook" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.FACEBOOK_PROFILE_URL}
            </label>
            <input
              type="url"
              id="profile-facebook"
              value={facebookProfileUrl}
              onChange={(e) => setFacebookProfileUrl(e.target.value)}
              placeholder={BN_UI_TEXT.FACEBOOK_PROFILE_URL_PLACEHOLDER}
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 ${localError === BN_UI_TEXT.INVALID_FACEBOOK_URL ? 'border-red-500' : 'border-slate-300'}`}
            />
          </div>
           <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.EMAIL_NOT_EDITABLE}
            </label>
            <input
              type="email"
              id="profile-email"
              value={currentUser.email}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm bg-slate-100 text-slate-500 cursor-not-allowed"
              readOnly
              disabled
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
              onClick={() => { onClose(); clearAuthError(); setLocalError(null); }}
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
              {isAuthLoading ? BN_UI_TEXT.LOADING : BN_UI_TEXT.SAVE_CHANGES}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;