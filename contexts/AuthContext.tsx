
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
      setIsAuthLoading(true);
      setAuthError(null);
      try {
        await initializeSharedTablesIfNeeded();

        const rememberUser = localStorage.getItem(LOCAL_STORAGE_KEYS.REMEMBER_USER) === 'true';
        if (rememberUser) {
          const storedUserJson = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
          if (storedUserJson) {
            const user: User = JSON.parse(storedUserJson);
            setCurrentUser(user);
          } else {
            localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER);
          }
        } else {
           localStorage.removeItem(LOCAL_STORAGE_KEYS.USER); 
           localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER); 
        }
      } catch (error: any) {
        // console.error("Error during initial auth and/or table setup:", error); // Retained for this critical step
        const errorMsg = `অ্যাপ্লিকেশন শুরু করতে সমস্যা হয়েছে: ${error.message}`;
        setAuthError(errorMsg);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initAuthAndTables();
  }, []); 

  const login = async (emailOrMobile: string, password: string, rememberMe: boolean) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const user = await authService.loginUser(emailOrMobile, password);
      setCurrentUser(user);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.REMEMBER_USER, 'true');
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER);
      }
      addNotification(BN_UI_TEXT.LOGIN_SUCCESS, 'success');
    } catch (error: any) {
      // console.error("Login failed:", error); // Retained
      let errorMessage = error.message;
      if (error.message && error.message.includes("Initialization failed for table")) {
        errorMessage = `লগইন সফল হয়েছে, কিন্তু ডেটাবেস টেবিল সেটআপ করতে সমস্যা হয়েছে: ${error.message}`;
      }
      setAuthError(errorMessage);
      addNotification(errorMessage, 'error');
      setCurrentUser(null); 
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER); 
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER); 
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const newUser = await authService.signupUser(name, email, password);
      setCurrentUser(newUser);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(newUser));
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER); 
      
      try {
         await emailService.sendWelcomeEmail(newUser.email, newUser.name || newUser.email);
         addNotification(BN_UI_TEXT.SIGNUP_SUCCESS, 'success');
      } catch (emailError: any) {
        // console.warn("Signup successful, but welcome email might have failed (check console for backend response):", emailError.message); // Retained
        addNotification(BN_UI_TEXT.SIGNUP_SUCCESS + " (তবে স্বাগতম ইমেইল পাঠাতে সমস্যা হতে পারে।)", 'warning');
      }

    } catch (error: any) {
      // console.error("Signup failed:", error); // Retained
      let errorMessage = error.message;
      if (error.message && error.message.includes("Initialization failed for table")) {
        errorMessage = `সাইনআপ সফল হয়েছে, কিন্তু ডেটাবেস টেবিল সেটআপ করতে সমস্যা হয়েছে: ${error.message}`;
      }
      setAuthError(errorMessage);
      addNotification(errorMessage, 'error');
      setCurrentUser(null); 
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER); 
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
        return { success: false, message: BN_UI_TEXT.EMAIL_NOT_FOUND_ALERT };
      }
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await authService.storeResetCode(email, code);
      await authService.sendPasswordResetEmail(email, code);
      return { success: true };
    } catch (error: any) {
      // console.error("Request password reset failed:", error); // Retained
      let errorMessage = error.message || BN_UI_TEXT.RESET_CODE_SENT_FAIL;
      setAuthError(errorMessage); 
      return { success: false, message: errorMessage };
    } finally {
      setIsAuthLoading(false);
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string): Promise<void> => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await authService.resetPasswordWithCode(email, code, newPassword);
      
      const user = await authService.loginUser(email, newPassword); 
      setCurrentUser(user);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REMEMBER_USER); 
      addNotification(BN_UI_TEXT.PASSWORD_RESET_SUCCESS_AUTO_LOGIN, 'success', 7000);

      await emailService.sendPasswordChangedEmail(email, user.name);
      
    } catch (error: any) {
      // console.error("Reset password with code failed:", error); // Retained
      let errorMessage = error.message || BN_UI_TEXT.AUTH_ERROR_GENERAL;
      setAuthError(errorMessage);
      addNotification(errorMessage, 'error');
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
        await emailService.sendPasswordChangedEmail(currentUser.email, currentUser.name);
    } catch (error: any) {
        // console.error("Change password failed:", error); // Retained
        const errorMessage = error.message || BN_UI_TEXT.AUTH_ERROR_GENERAL;
        setAuthError(errorMessage); 
        addNotification(errorMessage, 'error'); 
        throw error; 
    } finally {
        setIsAuthLoading(false);
    }
  };

  const updateCurrentUserData = async (updatedDetails: Partial<Pick<User, 'name' | 'mobileNumber' | 'facebookProfileUrl'>>): Promise<void> => {
    if (!currentUser || !currentUser.id) {
      addNotification("ব্যবহারকারী লগইন করা নেই।", 'error');
      throw new Error("User not logged in for profile update.");
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const updatedUserFromService = await authService.updateUserProfile(currentUser.id, currentUser.email, updatedDetails);
      const newCurrentUserState = { ...currentUser, ...updatedUserFromService };
      setCurrentUser(newCurrentUserState);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(newCurrentUserState));
      addNotification(BN_UI_TEXT.PROFILE_UPDATE_SUCCESS, 'success');
    } catch (error: any) {
      // console.error("Update current user data failed:", error); // Retained
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
