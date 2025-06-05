
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_TEXT, GEMINI_PROMPT_LANG } from '../constants';

let API_KEY: string | undefined = undefined;

try {
  // Safely try to access process.env.API_KEY
  // This prevents a ReferenceError if 'process' or 'process.env' is not defined.
  if (typeof process !== 'undefined' && process.env && typeof process.env.API_KEY === 'string') {
    API_KEY = process.env.API_KEY;
  }
} catch (e) {
  console.warn("Could not access process.env.API_KEY. This is expected if not in a Node-like environment or if the variable is not set.", e);
}

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    ai = null; 
  }
} else {
  // This warning will now also cover cases where process.env.API_KEY was inaccessible,
  // not just when it was explicitly undefined but accessible.
  console.warn(" API Key is not available. Gemini AI features will be unavailable. This could be due to process.env.API_KEY not being set or inaccessible in the current execution environment.");
}

export const isGeminiAvailable = (): boolean => !!ai;

export const getFinancialTip = async (balance: number, language: string = GEMINI_PROMPT_LANG): Promise<string> => {
  if (!ai) {
    // Updated error message to be more generic if API_KEY was simply not found/accessible
    throw new Error("Gemini AI service is not initialized. API Key might be missing or inaccessible.");
  }

  const model = GEMINI_MODEL_TEXT;
  
  const prompt = `Based on a current account balance of ${balance} BDT, provide one concise and practical financial tip in simple ${language}. The tip should be encouraging and easy to understand. If the balance is low, suggest a small saving habit. If the balance is good, suggest a wise investment or saving goal. Respond in ${language} only. Keep it under 150 characters.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    
    const text = response.text;
    if (!text) {
        throw new Error("No text content in Gemini response.");
    }
    return text.trim();
  } catch (error) {
    console.error("Error fetching financial tip from Gemini:", error);
    if (error instanceof Error) {
        // Check if the error message already indicates an API key issue from the SDK itself
        if (error.message.toLowerCase().includes("api key")) {
            throw new Error(` API error: ${error.message}`);
        }
        throw new Error(` API error during tip generation: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching financial tip.");
  }
};
