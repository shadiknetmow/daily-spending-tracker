// Budgeting Feature
export interface BudgetCategory {
  id: string;
  userId: string;
  name: string;
  createdAt: string; // ISO Date string
  lastModified: string; // ISO Date string
  associatedSuggestions?: string[]; // Array of expense suggestion strings
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
  startDate: string; // ISO Date string
  endDate: string;   // ISO Date string
  createdAt: string; // ISO Date string
  lastModified: string; // ISO Date string
}