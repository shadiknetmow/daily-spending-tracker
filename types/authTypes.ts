// User Authentication
import { InvoicePaymentStatus, InvoicePaymentMethod } from './invoiceTypes';

export interface User {
  id?: string; // Made optional as it's not always present (e.g. before signup completion)
  email: string;
  name?: string;
  hashed_password?: string; // Should not be exposed to client after auth
  reset_code?: string;
  reset_token_expiry?: string;
  mobileNumber?: string;
  facebookProfileUrl?: string;
  
  // Admin App Settings
  enableSchemaCheckOnStartup?: boolean;
  enableDataFetchOnStartup?: boolean;

  // Sales Invoice Defaults
  defaultSalesPaymentStatus?: InvoicePaymentStatus | null;
  defaultSalesInvoiceDateOffset?: number | null; 
  defaultSalesDueDateOffset?: number | null; 
  defaultSalesCompanyProfileId?: string | null;
  defaultSalesDiscountType?: 'percentage' | 'fixed' | null;
  defaultSalesDiscountValue?: number | null; 
  defaultSalesTaxType?: 'percentage' | 'fixed' | null;
  defaultSalesTaxValue?: number | null; 
  defaultSalesPaymentMethod?: InvoicePaymentMethod | null;
  defaultSalesPaymentNotes?: string | null;
  defaultSalesInvoiceNotes?: string | null;

  // Purchase Bill Defaults
  defaultPurchaseBillDateOffset?: number | null;
  defaultPurchaseDueDateOffset?: number | null;
  defaultPurchaseCompanyProfileId?: string | null;
  defaultPurchaseDiscountType?: 'percentage' | 'fixed' | null;
  defaultPurchaseDiscountValue?: number | null; 
  defaultPurchaseTaxType?: 'percentage' | 'fixed' | null;
  defaultPurchaseTaxValue?: number | null; 

  // Bank Account Default
  defaultBankAccountId?: string | null;
}

export type AuthFormMode = 'login' | 'signup' | 'forgotPasswordRequest' | 'forgotPasswordReset';

export interface AuthContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  authError: string | null;
  login: (emailOrMobile: string, password: string, rememberMe: boolean) => Promise<boolean>; // Changed from Promise<void>
  signup: (name: string, email: string, password: string) => Promise<boolean>; // Changed from Promise<void>
  logout: () => void;
  clearAuthError: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateCurrentUserData: (updatedDetails: Partial<User>) => Promise<void>;
}