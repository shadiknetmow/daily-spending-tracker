
import bcrypt from 'bcryptjs';
import { User } from '../types';
import { BN_UI_TEXT, APP_TITLE_FOR_EMAIL } from '../constants';
import * as apiService from '../apiService';

const SALT_ROUNDS = 10;

export const signupUser = async (name: string, email: string, password: string): Promise<User> => {
  const normalizedEmail = email.toLowerCase();
  try {
    const existingUsers = await apiService.fetchRecords<User>('users', normalizedEmail, `email = '${normalizedEmail.replace(/'/g, "''")}'`);
    if (existingUsers && existingUsers.length > 0) {
      throw new Error(BN_UI_TEXT.AUTH_ERROR_EMAIL_EXISTS);
    }

    const hashedPasswordValue = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = 'user_' + Date.now().toString() + Math.random().toString(36).substring(2, 9);

    const newUser: User = {
      id: userId,
      name,
      email: normalizedEmail,
      hashed_password: hashedPasswordValue,
    };

    const response = await apiService.insertRecord('users', normalizedEmail, newUser);

    if (response.success) {
      return { id: newUser.id, name: newUser.name, email: newUser.email };
    } else {
      if (typeof response.error === 'string' &&
          (
            (response.error.includes("Duplicate entry") && response.error.toLowerCase().includes("for key") && response.error.toLowerCase().includes("email")) ||
            response.error.includes("1062")
          )
      ) {
        throw new Error(BN_UI_TEXT.AUTH_ERROR_EMAIL_EXISTS);
      }
      throw new Error(response.error || "User registration failed via tableInsert.");
    }

  } catch (error: any) {
    // console.error("Signup error in authService:", error); // Retained for diagnosing signup-specific issues if needed
    if (error.message === BN_UI_TEXT.AUTH_ERROR_EMAIL_EXISTS) {
        throw error;
    }
    if (typeof error.message === 'string' &&
        (
          (error.message.includes("Duplicate entry") && error.message.toLowerCase().includes("for key") && error.message.toLowerCase().includes("email")) ||
          error.message.includes("1062")
        )
    ) {
        throw new Error(BN_UI_TEXT.AUTH_ERROR_EMAIL_EXISTS);
    }
    throw new Error(error.message || BN_UI_TEXT.AUTH_ERROR_GENERAL);
  }
};

export const loginUser = async (emailOrMobile: string, password: string): Promise<User> => {
  const normalizedInput = emailOrMobile.includes('@') ? emailOrMobile.toLowerCase() : emailOrMobile;
  const isEmail = emailOrMobile.includes('@');
  
  let whereClause = '';
  if (isEmail) {
    whereClause = `email = '${normalizedInput.replace(/'/g, "''")}'`;
  } else {
    whereClause = `mobileNumber = '${emailOrMobile.replace(/'/g, "''")}'`;
  }
  
  const escapedNormalizedInput = normalizedInput.replace(/'/g, "''");
  const escapedEmailOrMobile = emailOrMobile.replace(/'/g, "''");

  const combinedWhereClause = `(email = '${escapedNormalizedInput}' OR mobileNumber = '${escapedEmailOrMobile}')`;

  try {
    const users = await apiService.fetchRecords<User>('users', emailOrMobile, combinedWhereClause);

    if (!users || users.length === 0) {
      throw new Error(BN_UI_TEXT.AUTH_ERROR_INVALID_CREDENTIALS);
    }

    const user = users[0];
    if (!user.hashed_password) {
        // console.error("User found but has no hashed password stored:", user); // Retained
        throw new Error(BN_UI_TEXT.AUTH_ERROR_GENERAL + " (User data incomplete)");
    }

    const isMatch = await bcrypt.compare(password, user.hashed_password);
    if (isMatch) {
      const { hashed_password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } else {
      throw new Error(BN_UI_TEXT.AUTH_ERROR_INVALID_CREDENTIALS);
    }
  } catch (error: any) {
    // console.error("Login error in authService:", error); // Retained
    if (error.message === BN_UI_TEXT.AUTH_ERROR_INVALID_CREDENTIALS || error.message.includes(BN_UI_TEXT.AUTH_ERROR_GENERAL)) {
        throw error;
    }
    throw new Error(BN_UI_TEXT.AUTH_ERROR_INVALID_CREDENTIALS);
  }
};


export const checkUserEmailExists = async (email: string): Promise<boolean> => {
  const normalizedEmail = email.toLowerCase();
  try {
    const response = await apiService.makeApiRequest({
      method: 'tableFetch',
      table: 'users',
      where: `email='${normalizedEmail.replace(/'/g, "''")}'`
    });
    return response.success && Array.isArray(response.data) && response.data.length > 0;
  } catch (error) {
    // console.error("Error checking user email:", error); // Retained
    return false; 
  }
};

export const storeResetCode = async (email: string, code: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase();
  const expiryDate = new Date(Date.now() + 10 * 60 * 1000); 

  try {
    const response = await apiService.makeApiRequest({
      method: 'tableUpdate',
      table: 'users',
      fields: {
        reset_code: code,
        reset_token_expiry: expiryDate.toISOString()
      },
      where: `email='${normalizedEmail.replace(/'/g, "''")}'`
    });
    if (!response.success) {
      throw new Error(response.error || "Failed to store reset code.");
    }
  } catch (error: any) {
    // console.error("Error storing reset code:", error); // Retained
    throw new Error(error.message || "Failed to store reset code due to an unexpected issue.");
  }
};

export const sendPasswordResetEmail = async (email: string, code: string): Promise<void> => {
  const subject = BN_UI_TEXT.RESET_CODE_EMAIL_SUBJECT;
  const messageHtml = BN_UI_TEXT.RESET_CODE_EMAIL_MESSAGE_HTML
    .replace("{CODE}", code)
    .replace("{APP_TITLE}", APP_TITLE_FOR_EMAIL);

  const headers = `From: "${APP_TITLE_FOR_EMAIL}" <no-reply@medha4u.com>\r\nContent-Type: text/html; charset=UTF-8\r\nMIME-Version: 1.0`;

  try {
    const response = await apiService.makeApiRequest({
      method: "sendEmail",
      to: email,
      subject: subject,
      message: messageHtml,
      headers: headers
    });

    if (!response.success) {
      throw new Error(response.message || response.error || "Failed to send reset email via backend.");
    }
  } catch (error: any) {
    // console.error("Error sending password reset email:", error); // Retained
    if (!(error.message && error.message.includes("API Request Failed"))) {
        // console.error("Caught error object in sendPasswordResetEmail:", error); // Retained
    }
    throw new Error(error.message || "Failed to send reset email due to an unexpected issue.");
  }
};

export const resetPasswordWithCode = async (email: string, code: string, newPassword: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase();
  try {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const response = await apiService.makeApiRequest({
      method: 'tableUpdate',
      table: 'users',
      fields: {
        hashed_password: hashedPassword,
        reset_code: null,
        reset_token_expiry: null
      },
      where: `email='${normalizedEmail.replace(/'/g, "''")}' AND reset_code='${code.replace(/'/g, "''")}'`
    });

    if (!response.success || (response.success && response.data?.affectedRows === 0)) {
      let errorMessage = BN_UI_TEXT.INVALID_RESET_CODE;
      if (!response.success && response.error) {
         if (response.error.toLowerCase().includes("expired")) {
             errorMessage = BN_UI_TEXT.INVALID_RESET_CODE;
         } else if (!response.error.toLowerCase().includes("invalid") && !response.error.toLowerCase().includes("no user found")) {
            errorMessage = response.error;
         }
      }
      // console.warn("Password reset: Update failed or 0 rows affected. Email:", normalizedEmail, "Code used:", code, "Response:", response); // Retained
      throw new Error(errorMessage);
    }

  } catch (error: any) {
    // console.error("Reset password with code error in authService:", error); // Retained
    if (error.message === BN_UI_TEXT.INVALID_RESET_CODE || error.message.includes(BN_UI_TEXT.AUTH_ERROR_GENERAL)){
        throw error;
    }
    throw new Error(BN_UI_TEXT.AUTH_ERROR_GENERAL + (error.message ? `: ${error.message}`: ''));
  }
};

export const changeUserPassword = async (userId: string, email: string, currentPassword: string, newPassword: string): Promise<void> => {
    const normalizedEmail = email.toLowerCase();
    try {
        const users = await apiService.fetchRecords<User>('users', normalizedEmail, `id = '${userId.replace(/'/g, "''")}' AND email = '${normalizedEmail.replace(/'/g, "''")}'`);
        if (!users || users.length === 0) {
            throw new Error(BN_UI_TEXT.AUTH_ERROR_GENERAL + " (ব্যবহারকারী খুঁজে পাওয়া যায়নি)");
        }
        const user = users[0];
        if (!user.hashed_password) {
            // console.error("User found but has no hashed password stored for password change:", user); // Retained
            throw new Error(BN_UI_TEXT.AUTH_ERROR_GENERAL + " (ব্যবহারকারীর তথ্য অসম্পূর্ণ)");
        }

        const isMatch = await bcrypt.compare(currentPassword, user.hashed_password);
        if (!isMatch) {
            throw new Error(BN_UI_TEXT.ERROR_CURRENT_PASSWORD_INCORRECT);
        }

        const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        const response = await apiService.updateRecord('users', normalizedEmail, { hashed_password: newHashedPassword }, `id = '${user.id}'`);
        
        if (!response.success) {
            throw new Error(response.error || "পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।");
        }
    } catch (error: any) {
        // console.error("Change user password error in authService:", error); // Retained
        if (error.message === BN_UI_TEXT.ERROR_CURRENT_PASSWORD_INCORRECT || error.message.includes(BN_UI_TEXT.AUTH_ERROR_GENERAL)) {
            throw error;
        }
        throw new Error(BN_UI_TEXT.AUTH_ERROR_GENERAL + (error.message ? `: ${error.message}` : ''));
    }
};

export const updateUserProfile = async (userId: string, userEmail: string, updates: Partial<Pick<User, 'name' | 'mobileNumber' | 'facebookProfileUrl'>>): Promise<Partial<User>> => {
  const fieldsToUpdate: Partial<User> = {};
  if (updates.name !== undefined) fieldsToUpdate.name = updates.name;
  
  if (updates.mobileNumber !== undefined) {
    fieldsToUpdate.mobileNumber = updates.mobileNumber.trim() === '' ? null : updates.mobileNumber.trim();
  }
  
  if (updates.facebookProfileUrl !== undefined) {
    fieldsToUpdate.facebookProfileUrl = updates.facebookProfileUrl.trim() === '' ? null : updates.facebookProfileUrl.trim();
  }


  if (Object.keys(fieldsToUpdate).length === 0) {
    return {}; 
  }

  try {
    if (fieldsToUpdate.mobileNumber) {
      const existingUsersWithMobile = await apiService.fetchRecords<User>(
        'users', 
        userEmail, 
        `mobileNumber = '${fieldsToUpdate.mobileNumber.replace(/'/g, "''")}' AND id != '${userId.replace(/'/g, "''")}'`
      );
      if (existingUsersWithMobile && existingUsersWithMobile.length > 0) {
        throw new Error(BN_UI_TEXT.MOBILE_NUMBER_ALREADY_IN_USE.replace('{mobileNumber}', fieldsToUpdate.mobileNumber));
      }
    }

    const response = await apiService.updateRecord('users', userEmail, fieldsToUpdate, `id = '${userId.replace(/'/g, "''")}'`);
    if (!response.success) {
       if (response.error && response.error.toLowerCase().includes("duplicate entry") && response.error.toLowerCase().includes("mobilenumber")) {
         throw new Error(BN_UI_TEXT.MOBILE_NUMBER_ALREADY_IN_USE.replace('{mobileNumber}', fieldsToUpdate.mobileNumber || ''));
       }
      throw new Error(response.error || "প্রোফাইল আপডেট করতে সমস্যা হয়েছে।");
    }
    return fieldsToUpdate; 
  } catch (error: any) {
    // console.error("Update user profile error in authService:", error); // Retained
    throw error; 
  }
};
