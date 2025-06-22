import { PersonLedgerEntryType } from './ledgerTypes'; // Assuming ledgerTypes.ts exists

export enum DebtType {
  PAYABLE = 'PAYABLE', // User owes money
  RECEIVABLE = 'RECEIVABLE', // User is owed money
}

export interface DebtVersion {
  timestamp: string;
  action: 'created' | 'updated'; // Debts are hard-deleted for now, not soft-deleted.
  userId: string;
  snapshot: {
    personId: string;
    originalAmount: number;
    remainingAmount: number;
    description: string;
    type: DebtType;
    dueDate?: string;
    isSettled: boolean;
    creationDate: string; // Date when the debt was initially created
    settledDate?: string; // Date when the debt was fully settled
  };
}

export interface Debt {
  id: string;
  personId: string;
  originalAmount: number;
  remainingAmount: number;
  description: string;
  type: DebtType;
  dueDate?: string; // Optional due date
  isSettled: boolean;
  creationDate: string; // ISO Date string when debt was created
  settledDate?: string; // ISO Date string when debt was settled
  userId?: string;
  lastModified?: string; // ISO Date string
  editHistory: DebtVersion[];
}

export enum FormPurpose {
  CREATE_PAYABLE = 'createPayable',
  CREATE_RECEIVABLE = 'createReceivable',
  RECORD_PERSON_PAYMENT = 'recordPersonPayment', // Person pays user (CREDIT to ledger for person)
  RECORD_USER_PAYMENT_TO_PERSON = 'recordUserPaymentToPerson', // User pays person (DEBIT to ledger for person)
}

export interface DebtFormSubmitData {
  personNameValue: string; // The name typed or selected by user
  explicitSelectedPersonId?: string | null; // ID if selected from existing list
  amount: number;
  description: string;
  formPurpose: FormPurpose;
  debtType?: DebtType; // Only for CREATE_PAYABLE/RECEIVABLE
  dueDate?: string;    // Only for CREATE_PAYABLE/RECEIVABLE
  paymentDate?: string; // Only for RECORD_PERSON_PAYMENT/RECORD_USER_PAYMENT_TO_PERSON
}