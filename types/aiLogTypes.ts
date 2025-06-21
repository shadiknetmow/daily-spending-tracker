// types/aiLogTypes.ts
export interface AILogEntry {
  id: string;
  timestamp: string; // ISO string
  type: 'command' | 'response' | 'error';
  commandText?: string; // User's transcript
  responseText?: string; // AI's textual response
  parsedIntent?: string;
  actionDetails?: any; // Parsed action details from AI
  errorMessage?: string;
  rawAIResponse?: string; // Raw JSON string from AI or full error object stringified
}

export type AILanguageCode = 'bn-BD' | 'en-US';

export const AILanguageOptions: { code: AILanguageCode; label: string; geminiLang: string }[] = [
  { code: 'bn-BD', label: 'বাংলা (Experimental)', geminiLang: 'Bengali' },
  { code: 'en-US', label: 'English', geminiLang: 'English' },
];

export const mapAILanguageCodeToGeminiLanguage = (code: AILanguageCode): string => {
  const option = AILanguageOptions.find(opt => opt.code === code);
  return option ? option.geminiLang : 'English'; // Default to English if somehow not found
};

export type AIScope = 'app' | 'global';
