

import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { BN_UI_TEXT, LOCAL_STORAGE_KEYS } from '../constants'; // Updated path
import { useAuth } from '../contexts/AuthContext';
import { AuthFormMode } from '../types'; // Updated path
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';
import { useNotification } from "../contexts/NotificationContext";

interface AuthFormProps {
  mode: AuthFormMode; 
  initialEmail?: string; 
  onClose: () => void; 
  onSwitchMode: (newMode: AuthFormMode, emailPayload?: string) => void; 
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, initialEmail, onClose, onSwitchMode }) => {
  const [emailOrMobile, setEmailOrMobile] = useState(mode === 'forgotPasswordReset' && initialEmail ? initialEmail : '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  // Removed rememberMe state: const [rememberMe, setRememberMe] = useState(false);
  
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [formMessage, setFormMessage] = useState<string | null>(null); 
  const [passwordError, setPasswordError] = useState<string | null>(null); 
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null); 
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const { 
    login, 
    signup, 
    isAuthLoading, 
    authError, 
    clearAuthError, 
    requestPasswordReset,
    resetPasswordWithCode
  } = useAuth();
  const { addNotification } = useNotification();

  const prevModeRef = useRef<AuthFormMode | null>(null);
  const emailOrMobileInputRef = useRef<HTMLInputElement>(null); 


  useEffect(() => {
    // Simplified useEffect: No longer pre-fills email/password or sets rememberMe state for login mode.
    if (mode === 'forgotPasswordReset' && initialEmail) {
        if (emailOrMobile !== initialEmail) setEmailOrMobile(initialEmail);
        setPassword(''); 
    } else if (mode !== 'login') { // For signup, forgotPasswordRequest
        setEmailOrMobile('');
        setPassword('');
    } else { // For login mode, ensure fields are clear unless an initialEmail is specifically passed (e.g., from password reset flow)
        if (initialEmail && emailOrMobile !== initialEmail) {
             setEmailOrMobile(initialEmail);
        } else if (!initialEmail) {
            setEmailOrMobile('');
        }
        setPassword('');
    }
    
    if (mode !== 'signup') {
        if (name !== '') setName('');
    }

    if (mode !== 'forgotPasswordReset') {
      if (resetCodeInput !== '') setResetCodeInput('');
      if (newPassword !== '') setNewPassword('');
      if (confirmNewPassword !== '') setConfirmNewPassword('');
    }
    
    const isTransitioningToResetFromRequest = mode === 'forgotPasswordReset' && prevModeRef.current === 'forgotPasswordRequest';
    const isLoginErrorPage = mode === 'login' && authError === BN_UI_TEXT.AUTH_ERROR_INVALID_CREDENTIALS;

    if (!isTransitioningToResetFromRequest && !isLoginErrorPage) {
        clearAuthError();
    }
    
    setFormMessage(null);
    setPasswordError(null);
    setNewPasswordError(null);
    setConfirmPasswordError(null);

    prevModeRef.current = mode;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialEmail, clearAuthError]); 


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setPasswordError(null);
    setNewPasswordError(null);
    setConfirmPasswordError(null);
    let isValid = true;
    let authSuccessful = false;

    if (mode === 'login') {
      if (password.length < 6) {
        setPasswordError(BN_UI_TEXT.PASSWORD_PLACEHOLDER); 
        isValid = false;
      }
      if (isValid) {
        authSuccessful = await login(emailOrMobile, password, false); // Pass false for rememberMe
      }
    } else if (mode === 'signup') {
      if (!name.trim()) {
        setFormMessage(BN_UI_TEXT.NAME + " প্রয়োজন।"); 
        isValid = false;
      }
      if (password.length < 6) {
        setPasswordError(BN_UI_TEXT.PASSWORD_PLACEHOLDER); 
        isValid = false;
      }
      if (isValid) {
        authSuccessful = await signup(name, emailOrMobile, password);
      }
    } else if (mode === 'forgotPasswordRequest') {
      const currentEmailVal = emailOrMobileInputRef.current?.value || emailOrMobile; 
      if (!currentEmailVal) {
        setFormMessage("ইমেইল প্রয়োজন।");
        return;
      }
      const result = await requestPasswordReset(currentEmailVal);
      if (result.success) {
        addNotification(BN_UI_TEXT.RESET_CODE_SENT_SUCCESS, 'success', 7000);
        onSwitchMode('forgotPasswordReset', currentEmailVal); 
      } else {
        setFormMessage(result.message || BN_UI_TEXT.RESET_CODE_SENT_FAIL);
      }
    } else if (mode === 'forgotPasswordReset') {
      if (!emailOrMobile) { 
          setFormMessage("ইমেইল ঠিকানা পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
          isValid = false;
      }
      if (!resetCodeInput.trim()) {
        setFormMessage(BN_UI_TEXT.RESET_CODE_LABEL + " প্রয়োজন।");
        isValid = false;
      }
      if (newPassword.length < 6) {
        setNewPasswordError(BN_UI_TEXT.NEW_PASSWORD_LABEL); 
        isValid = false;
      }
      if (confirmNewPassword.length < 6) {
         setConfirmPasswordError(BN_UI_TEXT.CONFIRM_NEW_PASSWORD_LABEL);
         isValid = false;
      }
      if (newPassword !== confirmNewPassword) {
        setConfirmPasswordError(BN_UI_TEXT.PASSWORDS_DONT_MATCH);
        setNewPasswordError(BN_UI_TEXT.PASSWORDS_DONT_MATCH);
        isValid = false;
      }

      if (!isValid) return;
      
      try {
        await resetPasswordWithCode(emailOrMobile, resetCodeInput, newPassword);
        authSuccessful = true; 
        setResetCodeInput('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPassword(''); 
      } catch (err:any) {
        if (!authError && err.message) { 
             setFormMessage(err.message);
        } else if (!authError) {
             setFormMessage(BN_UI_TEXT.AUTH_ERROR_GENERAL);
        }
      }
    }

    if ((mode === 'login' || mode === 'signup' || mode === 'forgotPasswordReset') && authSuccessful) {
      if (mode === 'login') { // Password field is always cleared after login attempt now
          setPassword('');
      }
      onClose();
    }
  };
  
  return (
    <div className="bg-white rounded-lg w-full"> 
        
        {mode === 'forgotPasswordRequest' && (
            <p className="text-sm text-slate-600 mb-4 text-center">{BN_UI_TEXT.FORGOT_PASSWORD_INSTRUCTIONS}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">
                {BN_UI_TEXT.NAME}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={BN_UI_TEXT.NAME_PLACEHOLDER}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 transition duration-150"
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'forgotPasswordRequest') && (
            <div>
              <label htmlFor="emailOrMobile" className="block text-sm font-medium text-slate-600 mb-1">
                {mode === 'login' ? BN_UI_TEXT.EMAIL_OR_MOBILE : BN_UI_TEXT.EMAIL} 
              </label>
              <input
                ref={emailOrMobileInputRef} 
                type={mode === 'login' ? 'text' : 'email'} 
                id="emailOrMobile" 
                value={emailOrMobile} 
                onChange={(e) => setEmailOrMobile(e.target.value)}
                placeholder={mode === 'login' ? BN_UI_TEXT.EMAIL_PLACEHOLDER : BN_UI_TEXT.EMAIL_PLACEHOLDER.split(" অথবা ")[0]}
                className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 transition duration-150`}
                required
              />
            </div>
          )}
          
          {mode === 'forgotPasswordReset' && (
             <div>
              <label htmlFor="email-display" className="block text-sm font-medium text-slate-600 mb-1">
                {BN_UI_TEXT.EMAIL}
              </label>
              <input
                type="email"
                id="email-display"
                value={emailOrMobile} 
                className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm bg-slate-100 cursor-not-allowed`}
                readOnly 
              />
            </div>
          )}


          {(mode === 'login' || mode === 'signup') && (
            <div>
              <div className="flex justify-between items-baseline">
                <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">
                  {BN_UI_TEXT.PASSWORD}
                </label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => onSwitchMode('forgotPasswordRequest', emailOrMobile)} 
                    className="text-xs text-teal-600 hover:text-teal-700 hover:underline focus:outline-none"
                  >
                    {BN_UI_TEXT.FORGOT_PASSWORD_LINK}
                  </button>
                )}
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                placeholder={BN_UI_TEXT.PASSWORD_PLACEHOLDER}
                className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 transition duration-150 ${passwordError ? 'border-red-500' : 'border-slate-300'}`}
                required
                minLength={6}
                aria-describedby="password-error"
              />
              {passwordError && <p id="password-error" className="mt-1 text-xs text-red-600">{passwordError}</p>}
            </div>
          )}

          {/* Removed "Remember Me" checkbox */}

          {mode === 'forgotPasswordReset' && (
            <>
              <div>
                <label htmlFor="resetCode" className="block text-sm font-medium text-slate-600 mb-1">
                  {BN_UI_TEXT.RESET_CODE_LABEL}
                </label>
                <input
                  type="text"
                  id="resetCode"
                  value={resetCodeInput}
                  onChange={(e) => setResetCodeInput(e.target.value)}
                  placeholder={BN_UI_TEXT.RESET_CODE_PLACEHOLDER}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 transition duration-150"
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
                  onChange={(e) => { setNewPassword(e.target.value); setNewPasswordError(null); if(confirmPasswordError === BN_UI_TEXT.PASSWORDS_DONT_MATCH) setConfirmPasswordError(null); }}
                  placeholder={BN_UI_TEXT.PASSWORD_PLACEHOLDER}
                  className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 transition duration-150 ${newPasswordError ? 'border-red-500' : 'border-slate-300'}`}
                  required
                  minLength={6}
                  aria-describedby="new-password-error"
                />
                {newPasswordError && <p id="new-password-error" className="mt-1 text-xs text-red-600">{newPasswordError}</p>}
              </div>
              <div>
                <label htmlFor="confirmNewPasswordModal" className="block text-sm font-medium text-slate-600 mb-1">
                  {BN_UI_TEXT.CONFIRM_NEW_PASSWORD_LABEL}
                </label>
                <input
                  type="password"
                  id="confirmNewPasswordModal"
                  value={confirmNewPassword}
                  onChange={(e) => { setConfirmNewPassword(e.target.value); setConfirmPasswordError(null); if(newPasswordError === BN_UI_TEXT.PASSWORDS_DONT_MATCH) setNewPasswordError(null); }}
                  placeholder={BN_UI_TEXT.PASSWORD_PLACEHOLDER}
                  className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 transition duration-150 ${confirmPasswordError ? 'border-red-500' : 'border-slate-300'}`}
                  required
                  minLength={6}
                  aria-describedby="confirm-password-error"
                />
                {confirmPasswordError && <p id="confirm-password-error" className="mt-1 text-xs text-red-600">{confirmPasswordError}</p>}
              </div>
            </>
          )}
          
          <button
            type="submit"
            disabled={isAuthLoading}
            className={`w-full font-semibold py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isAuthLoading
                ? 'bg-slate-400 cursor-not-allowed'
                : (mode === 'forgotPasswordRequest' || mode === 'forgotPasswordReset')
                  ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500 text-white'
              }
            `}
          >
            {isAuthLoading ? BN_UI_TEXT.LOADING : (
              mode === 'login' ? BN_UI_TEXT.LOGIN :
              mode === 'signup' ? BN_UI_TEXT.SIGNUP :
              mode === 'forgotPasswordRequest' ? BN_UI_TEXT.SEND_RESET_CODE_BTN :
              BN_UI_TEXT.RESET_PASSWORD_BTN
            )}
          </button>

          {authError && (
            <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md text-sm flex items-start space-x-2" role="alert">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}
          {formMessage && !authError && ( 
            <div className={`mt-4 p-3 rounded-md text-sm flex items-start space-x-2 ${
               formMessage === BN_UI_TEXT.RESET_CODE_SENT_SUCCESS 
               ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
               : 'bg-red-100 border-l-4 border-red-500 text-red-700' 
            }`} role="status">
               <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" /> 
              <span>{formMessage}</span>
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm">
          {mode === 'login' && !authError?.includes(BN_UI_TEXT.MOCKED_AUTH_WARNING_TITLE) && (
             <span className="text-slate-600">
                {BN_UI_TEXT.DONT_HAVE_ACCOUNT}{' '}
                <button onClick={() => onSwitchMode('signup')} className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
                  {BN_UI_TEXT.SIGNUP}
                </button>
              </span>
          )}
          {mode === 'signup' && (
            <span className="text-slate-600">
              {BN_UI_TEXT.ALREADY_HAVE_ACCOUNT}{' '}
              <button onClick={() => onSwitchMode('login')} className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
                {BN_UI_TEXT.LOGIN}
              </button>
            </span>
          )}
           {(mode === 'forgotPasswordRequest' || mode === 'forgotPasswordReset') && (
            <button onClick={() => {
                onSwitchMode('login');
             }} 
             className="text-teal-600 hover:text-teal-700 hover:underline">
              {BN_UI_TEXT.BACK_TO_LOGIN_LINK}
            </button>
          )}
        </div>
    </div>
  );
};

export default AuthForm;