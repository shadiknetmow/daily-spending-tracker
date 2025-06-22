import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { BN_UI_TEXT } from '../constants';
import Modal from './Modal';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext'; // To get/update currentUser

interface AppAdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppAdminSettingsModal: React.FC<AppAdminSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateCurrentUserData, isAuthLoading } = useAuth();
  const { addNotification } = useNotification();

  const [enableSchemaCheck, setEnableSchemaCheck] = useState(true);
  const [enableDataFetch, setEnableDataFetch] = useState(true);

  useEffect(() => {
    if (isOpen && currentUser) {
      setEnableSchemaCheck(currentUser.enableSchemaCheckOnStartup ?? true);
      setEnableDataFetch(currentUser.enableDataFetchOnStartup ?? true);
    }
  }, [isOpen, currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    
    const updates: Partial<User> = {};
    if (enableSchemaCheck !== (currentUser.enableSchemaCheckOnStartup ?? true)) {
        updates.enableSchemaCheckOnStartup = enableSchemaCheck;
    }
    if (enableDataFetch !== (currentUser.enableDataFetchOnStartup ?? true)) {
        updates.enableDataFetchOnStartup = enableDataFetch;
    }

    if (Object.keys(updates).length > 0) {
        try {
            await updateCurrentUserData(updates);
            addNotification(BN_UI_TEXT.ADMIN_SETTINGS_SAVED_SUCCESS, 'success');
        } catch (error: any) {
            addNotification(error.message || BN_UI_TEXT.AUTH_ERROR_GENERAL, 'error');
        }
    }
    onClose();
  };
  
  const checkboxLabelClass = "flex items-center space-x-3 cursor-pointer";
  const checkboxInputClass = "form-checkbox h-5 w-5 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer";
  const descriptionClass = "text-xs text-slate-500 ml-8 mt-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={BN_UI_TEXT.APP_ADMIN_SETTINGS_MODAL_TITLE} size="lg">
      <div className="space-y-6 p-1">
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={enableSchemaCheck}
              onChange={(e) => setEnableSchemaCheck(e.target.checked)}
              className={checkboxInputClass}
            />
            <span className="text-sm font-medium text-slate-700">{BN_UI_TEXT.ENABLE_SCHEMA_CHECK_LABEL}</span>
          </label>
          <p className={descriptionClass}>
            {BN_UI_TEXT.ENABLE_SCHEMA_CHECK_DESCRIPTION}
          </p>
        </div>

        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={enableDataFetch}
              onChange={(e) => setEnableDataFetch(e.target.checked)}
              className={checkboxInputClass}
            />
            <span className="text-sm font-medium text-slate-700">{BN_UI_TEXT.ENABLE_DATA_FETCH_LABEL}</span>
          </label>
          <p className={descriptionClass}>
            {BN_UI_TEXT.ENABLE_DATA_FETCH_DESCRIPTION}
          </p>
        </div>
        
        <div className="flex justify-end items-center pt-4 border-t border-slate-200 space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
            disabled={isAuthLoading}
          >
            {BN_UI_TEXT.CANCEL}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            disabled={isAuthLoading}
          >
            {isAuthLoading ? BN_UI_TEXT.LOADING : BN_UI_TEXT.SAVE_CHANGES}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AppAdminSettingsModal;