export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface TransactionVersion {
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'restored';
  userId: string; // User who performed the action
  // Snapshot of the transaction *after* the action
  snapshot: Omit<Transaction, 'id' | 'userId' | 'editHistory' | 'lastModified' | 'originalDate' | 'date' | 'description' | 'amount' | 'type' | 'linkedLedgerEntryId' | 'isDeleted' | 'deletedAt' | 'bankAccountId' | 'bankAccountName'> & {
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    originalDate?: string;
    linkedLedgerEntryId?: string; // If transaction was created due to a ledger entry
    isDeleted?: boolean;
    deletedAt?: string;
    bankAccountId?: string;
    bankAccountName?: string;
  };
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string for the transaction event
  description: string;
  amount: number;
  type: TransactionType;
  originalDate?: string; // The very first date this transaction was recorded, if date is edited
  lastModified?: string; // ISO Date string
  userId?: string; // ID of the user who owns this transaction
  editHistory: TransactionVersion[];
  linkedLedgerEntryId?: string; // Optional: if this transaction is linked to a PersonLedgerEntry
  bankAccountId?: string; // Optional: ID of the BankAccount this transaction is associated with
  bankAccountName?: string; // Optional: Denormalized name of the bank account for display
  isDeleted?: boolean;
  deletedAt?: string; // ISO Date string when soft deleted
}

// For forms, typically we don't need all fields
export type EditableTransaction = Omit<Transaction, 'id' | 'date' | 'editHistory' | 'lastModified' | 'linkedLedgerEntryId' | 'isDeleted' | 'deletedAt' | 'bankAccountId' | 'bankAccountName'> & { date: string, bankAccountId?: string };

export interface ExpenseFieldRequirements {
  quantityRequired: boolean;
  unitRequired: boolean;
  notesRequired: boolean;
}