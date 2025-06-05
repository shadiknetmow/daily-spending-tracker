






























export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface TransactionVersion {
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'restored'; 
  userId: string;
  snapshot: Omit<Transaction, 'id' | 'userId' | 'editHistory' | 'lastModified' | 'originalDate' | 'date' | 'description' | 'amount' | 'type' | 'linkedLedgerEntryId' | 'isDeleted' | 'deletedAt'> & { 
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    originalDate?: string;
    linkedLedgerEntryId?: string;
    isDeleted?: boolean;
    deletedAt?: string;
  };
}

export interface Transaction {
  id: string;
  date: string; 
  description: string;
  amount: number;
  type: TransactionType;
  originalDate?: string; 
  lastModified?: string; 
  userId?: string; 
  editHistory: TransactionVersion[];
  linkedLedgerEntryId?: string;
  isDeleted?: boolean;
  deletedAt?: string; 
}

export type EditableTransaction = Omit<Transaction, 'id' | 'date' | 'editHistory' | 'lastModified' | 'linkedLedgerEntryId' | 'isDeleted' | 'deletedAt'> & { date: string };


export enum DebtType {
  PAYABLE = 'PAYABLE', 
  RECEIVABLE = 'RECEIVABLE', 
}

export type ProfileImageAction = 'added' | 'updated' | 'removed' | 'none';

export interface PersonVersion {
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'restored'; 
  userId: string;
  snapshot: {
    name: string;
    mobileNumber?: string;
    address?: string;
    shopName?: string;
    email?: string;
    profileImageAction?: ProfileImageAction | null; 
    isDeleted?: boolean;
    deletedAt?: string;
    systemUserId?: string; 
    customAlias?: string;  
  };
}

export interface Person {
  id: string;
  name: string; 
  customAlias?: string; 
  mobileNumber?: string;
  address?: string;
  shopName?: string;
  email?: string; 
  profileImage?: string; 
  systemUserId?: string; 
  userId: string; 
  createdAt: string;
  lastModified: string;
  editHistory: PersonVersion[];
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface DebtVersion {
  timestamp: string;
  action: 'created' | 'updated'; 
  userId: string; 
  snapshot: { 
    personId: string;
    originalAmount: number;
    remainingAmount: number;
    description: string;
    type: DebtType;
    dueDate?: string;
    isSettled: boolean;
    creationDate: string; 
    settledDate?: string; 
  };
}


export interface Debt {
  id: string;
  personId: string;
  originalAmount: number;
  remainingAmount: number;
  description: string;
  type: DebtType;
  dueDate?: string; 
  isSettled: boolean;
  creationDate: string;
  settledDate?: string;
  userId?: string; 
  lastModified?: string; 
  editHistory: DebtVersion[]; 
}

// User Authentication
export interface User {
  id?: string; 
  email: string;
  name?: string; 
  hashed_password?: string; 
  reset_code?: string; 
  reset_token_expiry?: string; 
  mobileNumber?: string; 
  facebookProfileUrl?: string; 
}

export type AuthFormMode = 'login' | 'signup' | 'forgotPasswordRequest' | 'forgotPasswordReset';

export interface AuthContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  authError: string | null;
  login: (emailOrMobile: string, password: string, rememberMe: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearAuthError: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateCurrentUserData: (updatedDetails: Partial<Pick<User, 'name' | 'mobileNumber' | 'facebookProfileUrl'>>) => Promise<void>;
}

// Person Ledger System
export enum PersonLedgerEntryType {
  DEBIT = 'DEBIT', 
  CREDIT = 'CREDIT', 
}

export interface PersonLedgerEntry {
  id: string;
  personId: string;
  userId: string;
  date: string; 
  type: PersonLedgerEntryType;
  amount: number; 
  description: string;
  balanceAfterEntry: number; 
}


export enum FormPurpose {
  CREATE_PAYABLE = 'createPayable',
  CREATE_RECEIVABLE = 'createReceivable',
  RECORD_PERSON_PAYMENT = 'recordPersonPayment', 
  RECORD_USER_PAYMENT_TO_PERSON = 'recordUserPaymentToPerson', 
}


export interface DebtFormSubmitData {
  personNameValue: string; 
  explicitSelectedPersonId?: string | null; 
  amount: number; 
  description: string;
  formPurpose: FormPurpose;
  debtType?: DebtType; 
  dueDate?: string;    
  paymentDate?: string; 
}

// Budgeting Feature
export interface BudgetCategory {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  lastModified: string;
  associatedSuggestions?: string[]; // Made optional
}

export enum BudgetPeriod {
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number; 
  period: BudgetPeriod;
  startDate: string; 
  endDate: string; 
  createdAt: string;
  lastModified: string;
}

// Chat / Messaging Feature
export interface ImageMessageContent {
  type: 'image';
  base64Data: string; // Data URL (e.g., "data:image/png;base64,...")
  mimeType: string;
  fileName?: string;
}

export interface AudioMessageContent {
  type: 'audio';
  base64Data: string; // Data URL (e.g., "data:audio/webm;base64,...")
  mimeType: string;   // e.g., 'audio/webm', 'audio/ogg'
  duration?: number;  // Optional: duration in seconds
}

export interface MessageVersionSnapshot {
  content: string;
  imageContent?: ImageMessageContent;
  audioContent?: AudioMessageContent;
  isDeleted?: boolean;
  deletedAt?: string;
  // reactions are not typically versioned in this manner due to their dynamic nature.
  // The latest reaction state is usually what's important.
}

export interface MessageVersion {
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'restored' | 'history_deleted'; // 'updated' for future content edit
  userId: string; // User who performed the action (owner of the message copy)
  snapshot: MessageVersionSnapshot;
}

export interface Message {
  id: string;
  threadId: string; // Composite key: sorted(user1_id, user2_id)
  actualSenderId: string; // User.id of the sender
  actualReceiverId: string; // User.id of the receiver
  content: string; // For text messages or captions for images/audio
  imageContent?: ImageMessageContent; // For image data
  audioContent?: AudioMessageContent; // For audio data
  timestamp: string; // ISO 8601
  isRead: boolean; // Has the actualReceiverId read this message? (Relevant for the receiver's copy)
  userId: string; // The AppUser.id who owns this message record (for DB scoping/partitioning)
  reactions?: Record<string, string[]>; // Key: emoji (string), Value: array of User.id (string[])
  isDeleted?: boolean; // Indicates if the owner of this message copy has "deleted" it.
  deletedAt?: string;  // Timestamp of when it was "deleted" by the owner.
  editHistory: MessageVersion[]; // History of changes to this message copy.
}

// Suggestion Management
export type SuggestionType = 'income' | 'expense';

export interface UserSuggestion {
  id: string;
  userId: string;
  text: string;
  type: SuggestionType;
  createdAt?: string; // Optional
  lastModified?: string; // Optional
}

// Expense Form Field Requirements
export interface ExpenseFieldRequirements {
  quantityRequired: boolean;
  unitRequired: boolean;
  notesRequired: boolean;
}