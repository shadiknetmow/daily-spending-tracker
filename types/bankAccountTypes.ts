// types/bankAccountTypes.ts

export enum BankAccountType {
  SAVINGS = 'SAVINGS',
  CURRENT = 'CURRENT',
  MOBILE_BANKING = 'MOBILE_BANKING',
  CARD = 'CARD', // e.g., Credit Card, Debit Card used as an account
  CASH_IN_HAND = 'CASH_IN_HAND', // For tracking physical cash
  OTHER = 'OTHER',
}

export interface BankAccountVersionSnapshot {
  accountName: string;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  accountType: BankAccountType;
  initialBalance: number;
  balanceEffectiveDate: string; // ISO Date
  currency: string;
  notes?: string;
  isDefault?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface BankAccountVersion {
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'restored';
  userId: string;
  snapshot: BankAccountVersionSnapshot;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountName: string;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  accountType: BankAccountType;
  initialBalance: number;
  balanceEffectiveDate: string; // ISO Date
  // currentBalance: number; // This will be calculated or managed by transactions later
  currency: string; // Default 'BDT'
  notes?: string;
  isDefault?: boolean;
  createdAt: string; // ISO DateTime string
  lastModified: string; // ISO DateTime string
  isDeleted?: boolean;
  deletedAt?: string; // ISO DateTime string
  editHistory: BankAccountVersion[];
}