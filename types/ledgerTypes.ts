// Person Ledger System
export enum PersonLedgerEntryType {
  DEBIT = 'DEBIT', // Person owes user more / User paid person or recorded expense against person
  CREDIT = 'CREDIT', // Person paid user / User owes person more or recorded income from person
}

export interface PersonLedgerEntry {
  id: string;
  personId: string;
  userId: string; // The app user performing the entry
  date: string; // ISO Date string
  type: PersonLedgerEntryType;
  amount: number;
  description: string;
  balanceAfterEntry: number; // Net balance for this person after this entry from the user's perspective
                            // Positive if person owes user, negative if user owes person
}