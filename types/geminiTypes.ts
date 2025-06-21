// types/geminiTypes.ts
export interface GeminiSettings {
  model: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  // responseMimeType could be added here if needed in future
}
