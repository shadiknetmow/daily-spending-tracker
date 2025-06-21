// Suggestion Management
export type SuggestionType = 'income' | 'expense';

export interface UserSuggestion {
  id: string;
  userId: string;
  text: string;
  type: SuggestionType;
  createdAt?: string; // ISO Date string
  lastModified?: string; // ISO Date string
}