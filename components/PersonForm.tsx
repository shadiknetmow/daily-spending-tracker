
import React, { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { Person, User } from '../types';
import { BN_UI_TEXT } from '../constants';
import { useNotification } from '../contexts/NotificationContext'; 
import CameraIcon from './icons/CameraIcon'; 
import TrashIcon from './icons/TrashIcon'; 
import * as apiService from '../apiService'; 
import UserPlusIcon from './icons/UserPlusIcon'; 
import InformationCircleIcon from './icons/InformationCircleIcon';

export interface ImportedUserDetails {
  name: string;
  email?: string;
  mobileNumber: string; 
  profileImage?: string; 
  systemUserId: string; // Added systemUserId
}

interface PersonFormProps {
  onSave: (
    personData: Omit<Person, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'editHistory'>, 
    existingPersonId?: string,
    isImplicitAdd?: boolean, 
    forSelectionContext?: boolean 
  ) => void;
  initialData?: Person | null; 
  onCancel: () => void;
  allPersons: Person[]; 
  onUserDetailsImported?: (details: ImportedUserDetails) => void;
}

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

const PersonForm: React.FC<PersonFormProps> = ({ 
  onSave, 
  initialData, 
  onCancel, 
  allPersons,
  onUserDetailsImported 
}) => {
  const [name, setName] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState(''); 
  const [address, setAddress] = useState('');
  const [shopName, setShopName] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [linkedSystemUserId, setLinkedSystemUserId] = useState<string | undefined>(undefined);
  
  const [mobileError, setMobileError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>(''); 
  const [foundSystemUser, setFoundSystemUser] = useState<User | null>(null);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotification();
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const isSystemLinkedEditMode = !!(initialData && initialData.systemUserId);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCustomAlias(initialData.customAlias || '');
      setMobileNumber(initialData.mobileNumber || '');
      setEmail(initialData.email || ''); 
      setAddress(initialData.address || '');
      setShopName(initialData.shopName || '');
      setProfileImage(initialData.profileImage);
      setLinkedSystemUserId(initialData.systemUserId); 
    } else {
      setName('');
      setCustomAlias('');
      setMobileNumber('');
      setEmail(''); 
      setAddress('');
      setShopName('');
      setProfileImage(undefined);
      setLinkedSystemUserId(undefined); 
    }
    setMobileError(''); 
    setEmailError(''); 
    setFoundSystemUser(null);
    setIsCheckingMobile(false);
  }, [initialData]);


  const checkMobileNumberDetails = useCallback(async () => {
    if (isSystemLinkedEditMode) return; // Don't check if editing a linked user and mobile is read-only

    const currentMobile = mobileInputRef.current?.value.trim() || '';
    
    setIsCheckingMobile(true);
    setMobileError('');
    setFoundSystemUser(null);

    if (!currentMobile) {
        if (linkedSystemUserId) { 
            setLinkedSystemUserId(undefined); 
            addNotification(BN_UI_TEXT.SYSTEM_USER_UNLINKED_FORM_EDITABLE, 'info', 4000);
        }
        setIsCheckingMobile(false);
        return;
    }
    
    const mobileRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!mobileRegex.test(currentMobile)) {
      setMobileError(BN_UI_TEXT.INVALID_MOBILE_NUMBER_FORMAT);
      setIsCheckingMobile(false);
      return;
    }

    const duplicateInPersons = allPersons.find(p =>
      p.mobileNumber === currentMobile &&
      (!initialData || p.id !== initialData.id) 
    );

    if (duplicateInPersons) {
      const personNames = duplicateInPersons.name; 
      setMobileError(
        BN_UI_TEXT.MOBILE_NUMBER_DUPLICATE
          .replace('{mobileNumber}', currentMobile)
          .replace('{personNamesString}', personNames)
      );
      setIsCheckingMobile(false);
      return;
    }
    
    try {
      const systemUser = await apiService.fetchUserByMobile(currentMobile);
      if (systemUser && systemUser.id) { 
        if (linkedSystemUserId === systemUser.id && (initialData?.mobileNumber === currentMobile || mobileNumber === currentMobile)) {
            setFoundSystemUser(null);
        } else {
            setFoundSystemUser(systemUser);
        }
      } else { 
        if (linkedSystemUserId) { 
            setLinkedSystemUserId(undefined); 
            addNotification(BN_UI_TEXT.SYSTEM_USER_UNLINKED_FORM_EDITABLE, 'info', 4000);
        }
        setFoundSystemUser(null);
      }
    } catch (error) {
      console.error("Error fetching system user by mobile:", error);
      if (linkedSystemUserId) { 
          setLinkedSystemUserId(undefined);
          addNotification(BN_UI_TEXT.SYSTEM_USER_UNLINKED_FORM_EDITABLE, 'info', 4000);
      }
      setFoundSystemUser(null);
    } finally {
      setIsCheckingMobile(false);
    }
  }, [allPersons, initialData, linkedSystemUserId, addNotification, mobileNumber, isSystemLinkedEditMode]);


  useEffect(() => {
    if (isSystemLinkedEditMode && initialData?.email) { // If editing linked user, keep initial email and don't validate for duplicates against others
        setEmail(initialData.email);
        setEmailError('');
        return;
    }
    if (!email.trim()) {
      setEmailError('');
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError(BN_UI_TEXT.INVALID_EMAIL_FORMAT);
      return;
    }

    const duplicatePersonsByEmail = allPersons.filter(p =>
      p.email?.toLowerCase() === trimmedEmail &&
      (!initialData || p.id !== initialData.id)
    );

    if (duplicatePersonsByEmail.length > 0) {
      const personNames = duplicatePersonsByEmail.map(p => p.name).join(', ');
      setEmailError(
        BN_UI_TEXT.PERSON_EMAIL_DUPLICATE
          .replace('{email}', email.trim()) 
          .replace('{personNamesString}', personNames)
      );
    } else {
      setEmailError('');
    }
  }, [email, allPersons, initialData, isSystemLinkedEditMode]);


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isSystemLinkedEditMode) return;
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        addNotification(BN_UI_TEXT.IMAGE_SIZE_TOO_LARGE_ERROR, 'error');
        if(fileInputRef.current) fileInputRef.current.value = ""; 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    if (isSystemLinkedEditMode) return;
    setProfileImage(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const handleImportUserDetails = () => {
    if (isSystemLinkedEditMode) return; // Should not happen if UI is disabled

    if (foundSystemUser && foundSystemUser.mobileNumber && foundSystemUser.id) {
      const importedName = foundSystemUser.name || '';
      const importedEmail = foundSystemUser.email || '';
      
      setName(importedName); 
      setEmail(importedEmail);
      setLinkedSystemUserId(foundSystemUser.id); 
      setCustomAlias(''); 

      addNotification(BN_UI_TEXT.USER_DETAILS_IMPORTED, 'success');
      const userDetailsForConfirmation: ImportedUserDetails = {
          name: importedName,
          email: importedEmail || undefined,
          mobileNumber: foundSystemUser.mobileNumber,
          systemUserId: foundSystemUser.id,
      };
      
      setFoundSystemUser(null); 

      if (!initialData && onUserDetailsImported) { 
        onUserDetailsImported(userDetailsForConfirmation);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !isSystemLinkedEditMode) { 
      addNotification(BN_UI_TEXT.NAME + " আবশ্যক।", 'error'); 
      return;
    }
    if (mobileError && mobileError !== BN_UI_TEXT.IMPORT_SYSTEM_USER_PROMPT && !isSystemLinkedEditMode) { 
      addNotification(mobileError, 'error');
      return;
    }
    if (emailError && !isSystemLinkedEditMode) { 
      addNotification(emailError, 'error');
      return;
    }

    const personDataToSave: Omit<Person, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'editHistory'> = {
      name: name, 
      customAlias: customAlias.trim() || undefined,
      mobileNumber: mobileNumber.trim() || undefined,
      email: email.trim() || undefined, 
      address: address.trim() || undefined,
      shopName: shopName.trim() || undefined,
      profileImage: profileImage,
      systemUserId: linkedSystemUserId, 
    };
    onSave(personDataToSave, initialData?.id);
  };
  
  const readOnlyInputClasses = "bg-slate-100 text-slate-500 cursor-not-allowed";
  const editableInputClasses = "border-slate-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="person-name" className="block text-sm font-medium text-slate-600 mb-1">
          {isSystemLinkedEditMode ? BN_UI_TEXT.SYSTEM_LINKED_NAME_LABEL : BN_UI_TEXT.NAME}
          {!isSystemLinkedEditMode && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          id="person-name"
          value={name}
          onChange={(e) => !isSystemLinkedEditMode && setName(e.target.value)}
          placeholder={isSystemLinkedEditMode ? '' : BN_UI_TEXT.NAME_PLACEHOLDER}
          className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 ${isSystemLinkedEditMode ? readOnlyInputClasses : editableInputClasses}`}
          required={!isSystemLinkedEditMode}
          readOnly={isSystemLinkedEditMode}
        />
      </div>

      <div>
        <label htmlFor="person-custom-alias" className="block text-sm font-medium text-slate-600 mb-1">
          {BN_UI_TEXT.FIELD_NAME_CUSTOM_ALIAS}
        </label>
        <input
          type="text"
          id="person-custom-alias"
          value={customAlias}
          onChange={(e) => setCustomAlias(e.target.value)}
          placeholder={BN_UI_TEXT.CUSTOM_ALIAS_PLACEHOLDER}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
        />
         {isSystemLinkedEditMode && name !== customAlias && customAlias && (
          <p className="mt-1 text-xs text-slate-500 flex items-center">
            <InformationCircleIcon className="w-3 h-3 mr-1 text-sky-500"/>
            তালিকায় "<span className="font-medium mx-1">{customAlias}</span>" নামটি প্রথমে দেখানো হবে।
          </p>
        )}
      </div>


      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{BN_UI_TEXT.PERSON_PROFILE_IMAGE}</label>
        <div className="mt-1 flex items-center space-x-4">
          <span className="inline-block h-20 w-20 rounded-full overflow-hidden bg-slate-100 ring-2 ring-slate-200">
            {profileImage ? (
              <img src={profileImage} alt={BN_UI_TEXT.IMAGE_PREVIEW_ALT} className="h-full w-full object-cover" />
            ) : (
              <svg className="h-full w-full text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </span>
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${isSystemLinkedEditMode ? 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed' : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'}`}
              disabled={isSystemLinkedEditMode}
            >
              <CameraIcon className={`w-4 h-4 mr-1.5 ${isSystemLinkedEditMode ? 'text-slate-400' : 'text-slate-500'}`} />
              {profileImage ? BN_UI_TEXT.CHANGE_IMAGE_BTN : BN_UI_TEXT.UPLOAD_IMAGE_BTN}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              aria-label={BN_UI_TEXT.UPLOAD_IMAGE_BTN}
              disabled={isSystemLinkedEditMode}
            />
            {profileImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isSystemLinkedEditMode ? 'text-red-400 bg-red-50 cursor-not-allowed' : 'text-red-700 bg-red-100 hover:bg-red-200'}`}
                disabled={isSystemLinkedEditMode}
              >
                <TrashIcon className="w-4 h-4 mr-1.5" />
                {BN_UI_TEXT.REMOVE_IMAGE_BTN}
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="person-mobile" className="block text-sm font-medium text-slate-600 mb-1">
          {BN_UI_TEXT.PERSON_MOBILE_NUMBER}
        </label>
        <input
          ref={mobileInputRef}
          type="tel"
          id="person-mobile"
          value={mobileNumber}
          onChange={(e) => !isSystemLinkedEditMode && setMobileNumber(e.target.value)}
          onBlur={checkMobileNumberDetails}
          placeholder={BN_UI_TEXT.PERSON_MOBILE_PLACEHOLDER}
          className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 ${mobileError && !isSystemLinkedEditMode ? 'border-red-500' : (isSystemLinkedEditMode ? readOnlyInputClasses : editableInputClasses)}`}
          aria-describedby="mobile-error-message mobile-import-prompt"
          readOnly={isSystemLinkedEditMode}
        />
        {mobileError && !isSystemLinkedEditMode && (
          <p id="mobile-error-message" className="mt-1 text-xs text-red-600">
            {mobileError}
          </p>
        )}
        {isCheckingMobile && !isSystemLinkedEditMode && (
            <p className="mt-1 text-xs text-slate-500 animate-pulse">{BN_UI_TEXT.LOADING}</p>
        )}
        {foundSystemUser && !mobileError && !isCheckingMobile && !isSystemLinkedEditMode && (
          <div id="mobile-import-prompt" className="mt-2 p-2 bg-sky-50 border border-sky-200 rounded-md text-xs">
            <p className="text-sky-700">{BN_UI_TEXT.IMPORT_SYSTEM_USER_PROMPT}</p>
            <p className="text-slate-600">ব্যবহারকারী: <span className="font-medium">{foundSystemUser.name}</span>{foundSystemUser.email ? `, ইমেইল: ${foundSystemUser.email}` : ''}</p>
            <button
              type="button"
              onClick={handleImportUserDetails}
              className="mt-1.5 text-xs bg-sky-500 hover:bg-sky-600 text-white font-medium py-1 px-2.5 rounded-md flex items-center space-x-1"
            >
              <UserPlusIcon className="w-3 h-3"/>
              <span>{BN_UI_TEXT.IMPORT_USER_DETAILS_BTN}</span>
            </button>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="person-email" className="block text-sm font-medium text-slate-600 mb-1">
          {BN_UI_TEXT.PERSON_EMAIL_LABEL}
        </label>
        <input
          type="email"
          id="person-email"
          value={email}
          onChange={(e) => !isSystemLinkedEditMode && setEmail(e.target.value)}
          placeholder={BN_UI_TEXT.PERSON_EMAIL_PLACEHOLDER}
          className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 ${emailError && !isSystemLinkedEditMode ? 'border-red-500' : (isSystemLinkedEditMode ? readOnlyInputClasses : editableInputClasses)}`}
          readOnly={isSystemLinkedEditMode} 
        />
        {emailError && !isSystemLinkedEditMode && (
          <p id="email-error" className="mt-1 text-xs text-red-600">
            {emailError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="person-address" className="block text-sm font-medium text-slate-600 mb-1">
          {BN_UI_TEXT.PERSON_ADDRESS}
        </label>
        <textarea
          id="person-address"
          value={address}
          onChange={(e) => !isSystemLinkedEditMode && setAddress(e.target.value)}
          placeholder={BN_UI_TEXT.PERSON_ADDRESS_PLACEHOLDER}
          rows={2}
          className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 ${isSystemLinkedEditMode ? readOnlyInputClasses : editableInputClasses}`}
          readOnly={isSystemLinkedEditMode}
        />
      </div>
      <div>
        <label htmlFor="person-shopName" className="block text-sm font-medium text-slate-600 mb-1">
          {BN_UI_TEXT.PERSON_SHOP_NAME}
        </label>
        <input
          type="text"
          id="person-shopName"
          value={shopName}
          onChange={(e) => !isSystemLinkedEditMode && setShopName(e.target.value)}
          placeholder={BN_UI_TEXT.PERSON_SHOP_NAME_PLACEHOLDER}
          className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 ${isSystemLinkedEditMode ? readOnlyInputClasses : editableInputClasses}`}
          readOnly={isSystemLinkedEditMode}
        />
      </div>
      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {BN_UI_TEXT.CANCEL}
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-70"
          disabled={(!isSystemLinkedEditMode && ((!!mobileError && mobileError !== BN_UI_TEXT.IMPORT_SYSTEM_USER_PROMPT) || !!emailError || isCheckingMobile))}
        >
          {initialData ? BN_UI_TEXT.SAVE_CHANGES : BN_UI_TEXT.SAVE_PERSON_BTN}
        </button>
      </div>
    </form>
  );
};

export default PersonForm;
