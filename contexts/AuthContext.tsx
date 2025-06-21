

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType } from '../types';
import { LOCAL_STORAGE_KEYS, BN_UI_TEXT } from '../constants';
import * as authService from '../services/authService';
import * as emailService from '../services/emailService';
import { useNotification } from './NotificationContext'; 
import { initializeSharedTablesIfNeeded } from '../apiService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { addNotification } = useNotification(); 

  useEffect(() => {
    const initAuthAndTables = async () => {
      console.log('AuthContext: Initializing authentication and tables...');
      setIsAuthLoading(true);
      setAuthError(null); 
      let loadedUser: User | null = null;
      try {
        // Attempt to load active session directly
        const storedUserJson = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
        if (storedUserJson) {
            try {
                const user: User = JSON.parse(storedUserJson);
                // Ensure admin settings have default values if missing (for users created before this feature)
                user.enableSchemaCheckOnStartup = user.enableSchemaCheckOnStartup === undefined ? true : user.enableSchemaCheckOnStartup;
                user.enableDataFetchOnStartup = user.enableDataFetchOnStartup === undefined ? true : user.enableDataFetchOnStartup;
                loadedUser = user;
                setCurrentUser(user);
                console.log('AuthContext: Successfully loaded active user session from localStorage.');
            } catch (parseError: any) {
                console.error("AuthContext: Failed to parse stored user data. Clearing stored session.", parseError);
                localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
                setCurrentUser(null);
            }
        } else {
            setCurrentUser(null);
        }
        
        // Pass the schema check preference from the loaded user, or true if no user (for initial setup)
        await initializeSharedTablesIfNeeded(); // Removed argument
        console.log('AuthContext: Shared tables initialized (or skipped based on setting).');


        // Clean up old "remember me" keys, as this functionality is being removed from login
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_EMAIL_OR_MOBILE);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_PASSWORD);
        console.log('AuthContext: Cleaned up legacy "remember me" keys from localStorage.');

      } catch (error: any) { 
        console.error("AuthContext: Error during app initialization (auth or tables):", error);
        const errorMsg = `অ্যাপ্লিকেশন শুরু করতে সমস্যা হয়েছে: ${error.message}. অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন অথবা পরে আবার চেষ্টা করুন।`;
        setAuthError(errorMsg);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_EMAIL_OR_MOBILE);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_PASSWORD);
        setCurrentUser(null); 
      } finally {
        setIsAuthLoading(false);
        console.log('AuthContext: Initialization complete. isAuthLoading set to false.');
      }
    };
    initAuthAndTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const login = async (emailOrMobile: string, password: string): Promise<boolean> => { // Removed rememberMe parameter
    console.log('AuthContext: login called. Email/Mobile:', emailOrMobile);
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const userFromDb = await authService.loginUser(emailOrMobile, password);
       // Ensure admin settings have default values if missing
      const userToStore: User = {
        ...userFromDb,
        enableSchemaCheckOnStartup: userFromDb.enableSchemaCheckOnStartup === undefined ? true : userFromDb.enableSchemaCheckOnStartup,
        enableDataFetchOnStartup: userFromDb.enableDataFetchOnStartup === undefined ? true : userFromDb.enableDataFetchOnStartup,
      };

      setCurrentUser(userToStore);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(userToStore));
      console.log(`AuthContext: User logged in and "${LOCAL_STORAGE_KEYS.USER}" set.`);
      
      addNotification(BN_UI_TEXT.LOGIN_SUCCESS, 'success');
      setIsAuthLoading(false);
      return true; 
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.message && error.message.includes("Initialization failed for table")) {
        errorMessage = `লগইন সফল হয়েছে, কিন্তু ডেটাবেস টেবিল সেটআপ করতে সমস্যা হয়েছে: ${error.message}`;
      }
      setAuthError(errorMessage);
      addNotification(errorMessage, 'error');
      setCurrentUser(null); 
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER); 
      console.log(`AuthContext: Login failed. Error:`, errorMessage);
      setIsAuthLoading(false);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const newUserFromService = await authService.signupUser(name, email, password);
      // Ensure admin settings have default values after signup service call
      const newUserToStore: User = {
        ...newUserFromService,
        enableSchemaCheckOnStartup: newUserFromService.enableSchemaCheckOnStartup === undefined ? true : newUserFromService.enableSchemaCheckOnStartup,
        enableDataFetchOnStartup: newUserFromService.enableDataFetchOnStartup === undefined ? true : newUserFromService.enableDataFetchOnStartup,
      };
      setCurrentUser(newUserToStore);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(newUserToStore));
      // Clear any remember me related keys as this is a new session
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER); 
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_EMAIL_OR_MOBILE);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_PASSWORD);
      console.log(`AuthContext: Signup successful. "${LOCAL_STORAGE_KEYS.USER}" set, and legacy "remember me" keys cleared.`);
      
      try {
         await emailService.sendWelcomeEmail(newUserToStore.email, newUserToStore.name || newUserToStore.email);
         addNotification(BN_UI_TEXT.SIGNUP_SUCCESS, 'success');
      } catch (emailError: any) {
        addNotification(BN_UI_TEXT.SIGNUP_SUCCESS + " (তবে স্বাগতম ইমেইল পাঠাতে সমস্যা হতে পারে।)", 'warning');
      }
      setIsAuthLoading(false);
      return true;
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.message && error.message.includes("Initialization failed for table")) {
        errorMessage = `সাইনআপ সফল হয়েছে, কিন্তু ডেটাবেস টেবিল সেটআপ করতে সমস্যা হয়েছে: ${error.message}`;
      }
      setAuthError(errorMessage);
      addNotification(errorMessage, 'error');
      setCurrentUser(null); 
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_EMAIL_OR_MOBILE);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_PASSWORD);
      console.log(`AuthContext: Signup failed. Cleared all relevant keys. Error:`, errorMessage);
      setIsAuthLoading(false);
      return false;
    }
  };

  const logout = () => {
    console.log('AuthContext: logout called.');
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER); 
    // Also ensure any legacy remember me keys are cleared on logout
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_EMAIL_OR_MOBILE);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_PASSWORD);
    console.log(`AuthContext: Logged out. Cleared active session and any legacy "remember me" keys.`);
    addNotification(BN_UI_TEXT.LOGOUT_SUCCESS, 'success');
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string }> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const emailExists = await authService.checkUserEmailExists(email);
      if (!emailExists) {
        setIsAuthLoading(false);
        return { success: false, message: BN_UI_TEXT.EMAIL_NOT_FOUND_ALERT };
      }
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await authService.storeResetCode(email, code);
      await authService.sendPasswordResetEmail(email, code);
      setIsAuthLoading(false);
      return { success: true };
    } catch (error: any) {
      let errorMessage = error.message || BN_UI_TEXT.RESET_CODE_SENT_FAIL;
      setAuthError(errorMessage); 
      setIsAuthLoading(false);
      return { success: false, message: errorMessage };
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string): Promise<void> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await authService.resetPasswordWithCode(email, code, newPassword);
      
      const userFromDb = await authService.loginUser(email, newPassword); 
      const userToStore: User = {
        ...userFromDb,
        enableSchemaCheckOnStartup: userFromDb.enableSchemaCheckOnStartup === undefined ? true : userFromDb.enableSchemaCheckOnStartup,
        enableDataFetchOnStartup: userFromDb.enableDataFetchOnStartup === undefined ? true : userFromDb.enableDataFetchOnStartup,
      };
      setCurrentUser(userToStore);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(userToStore));

      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_EMAIL_OR_MOBILE);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_PASSWORD);
      console.log(`AuthContext: Password reset and auto-login. User data stored, legacy "remember me" keys cleared.`);
      addNotification(BN_UI_TEXT.PASSWORD_RESET_SUCCESS_AUTO_LOGIN, 'success', 7000);

      await emailService.sendPasswordChangedEmail(email, userToStore.name);
      
    } catch (error: any) {
      let errorMessage = error.message || BN_UI_TEXT.AUTH_ERROR_GENERAL;
      setAuthError(errorMessage);
      addNotification(errorMessage, 'error');
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_PASSWORD); // Clear any potentially stored password
      throw error; 
    } finally {
      setIsAuthLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!currentUser || !currentUser.id || !currentUser.email) {
        addNotification("ব্যবহারকারী লগইন করা নেই।", 'error');
        throw new Error("User not logged in");
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
        await authService.changeUserPassword(currentUser.id, currentUser.email, currentPassword, newPassword);
        addNotification(BN_UI_TEXT.PASSWORD_CHANGE_SUCCESS, 'success');
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBERED_PASSWORD);
        await emailService.sendPasswordChangedEmail(currentUser.email, currentUser.name);
    } catch (error: any) {
        const errorMessage = error.message || BN_UI_TEXT.AUTH_ERROR_GENERAL;
        setAuthError(errorMessage); 
        addNotification(errorMessage, 'error'); 
        throw error; 
    } finally {
        setIsAuthLoading(false);
    }
  };

  const updateCurrentUserData = async (updatedDetails: Partial<User>): Promise<void> => {
    if (!currentUser || !currentUser.id) {
      addNotification("ব্যবহারকারী লগইন করা নেই।", 'error');
      throw new Error("User not logged in for profile update.");
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const updatedUserFromService = await authService.updateUserProfile(currentUser.id, currentUser.email!, updatedDetails);
      
      // Ensure admin settings default to true if they are somehow missing after update
      const newCurrentUserState: User = { 
        ...currentUser, 
        ...updatedUserFromService,
        enableSchemaCheckOnStartup: updatedUserFromService.enableSchemaCheckOnStartup === undefined ? (currentUser.enableSchemaCheckOnStartup === undefined ? true : currentUser.enableSchemaCheckOnStartup) : updatedUserFromService.enableSchemaCheckOnStartup,
        enableDataFetchOnStartup: updatedUserFromService.enableDataFetchOnStartup === undefined ? (currentUser.enableDataFetchOnStartup === undefined ? true : currentUser.enableDataFetchOnStartup) : updatedUserFromService.enableDataFetchOnStartup,
      };

      setCurrentUser(newCurrentUserState);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(newCurrentUserState));
      console.log('AuthContext: User profile updated. New data stored in localStorage for key:', LOCAL_STORAGE_KEYS.USER);
      addNotification(BN_UI_TEXT.PROFILE_UPDATE_SUCCESS, 'success');
    } catch (error: any) {
      const errorMessage = error.message || BN_UI_TEXT.AUTH_ERROR_GENERAL;
      setAuthError(errorMessage);
      addNotification(errorMessage, 'error');
      throw error;
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
        currentUser, 
        isAuthLoading, 
        authError, 
        login, 
        signup, 
        logout, 
        clearAuthError,
        requestPasswordReset,
        resetPasswordWithCode,
        changePassword,
        updateCurrentUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};