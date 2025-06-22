// This file can be used for types that are truly common across multiple features
// and don't fit neatly into a specific domain.

export interface AppContextData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalPayable: number;
  totalReceivable: number;
  activeTransactionsCount: number;
  personsCount: number;
  featureList: string[];
}

export {}; // Keep if no other types are added yet to make it a module