
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_PROMPT_LANG } from '../constants'; 
import { GeminiSettings, AppContextData, AILanguageCode, mapAILanguageCodeToGeminiLanguage, AIScope } from "../types"; 

let API_KEY: string | undefined = undefined;

try {
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
  console.warn("Gemini API Key is not available. Gemini AI features will be unavailable. This could be due to process.env.API_KEY not being set or inaccessible in the current execution environment.");
}

export const isGeminiAvailable = (): boolean => !!ai;

export const getFinancialTip = async (
  balance: number, 
  language: string = GEMINI_PROMPT_LANG, // This is 'Bengali' by default from constants
  settings: GeminiSettings 
): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini AI service is not initialized. API Key might be missing or inaccessible.");
  }

  const modelToUse = settings.model; 
  
  const prompt = `Based on a current account balance of ${balance} BDT, provide one concise and practical financial tip in simple ${language}. The tip should be encouraging and easy to understand. If the balance is low, suggest a small saving habit. If the balance is good, suggest a wise investment or saving goal. Respond in ${language} only. Keep it under 150 characters.`;
  console.log('[GeminiService Debug] getFinancialTip - Prompt:', prompt, 'Language:', language);


  const generationConfig: Record<string, any> = {};
  if (settings.temperature !== undefined) generationConfig.temperature = settings.temperature;
  if (settings.topK !== undefined) generationConfig.topK = settings.topK;
  if (settings.topP !== undefined) generationConfig.topP = settings.topP;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelToUse,
        contents: prompt,
        ...(Object.keys(generationConfig).length > 0 && { config: generationConfig }), 
    });
    
    const text = response.text;
    console.log('[GeminiService Debug] getFinancialTip - Raw Gemini Response Text:', text);
    if (!text) {
        throw new Error("No text content in Gemini response.");
    }
    return text.trim();
  } catch (error) {
    console.error("Error fetching financial tip from Gemini:", error);
    if (error instanceof Error) {
        if (error.message.toLowerCase().includes("api key")) {
            throw new Error(`Gemini API error: ${error.message}`);
        }
        throw new Error(`Gemini API error during tip generation: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching financial tip.");
  }
};

export const processUserCommandViaAI = async (
  transcript: string,
  appContext: AppContextData,
  settings: GeminiSettings,
  languageCode: AILanguageCode = 'bn-BD', // Default to Bengali if not provided
  aiScope: AIScope = 'app' // Add aiScope parameter
): Promise<any> => {
  
  if (!ai) {
    throw new Error("Gemini AI service is not initialized for command processing.");
  }

  const modelToUse = settings.model;
  const targetLanguage = mapAILanguageCodeToGeminiLanguage(languageCode); 

  console.log('[GeminiService Debug] processUserCommandViaAI - Target Language:', targetLanguage, 'Code:', languageCode, 'Scope:', aiScope);

  let systemInstructionPart = `
    You are an AI assistant for the 'দৈনিক আয়-ব্যয় ট্র্যাকার' (Daily Spending & Earning Tracker) application.
    Your primary role is to assist users with managing their finances within this app.
    You can help create income/expense transactions, sales invoices, answer questions about their financial data (like transaction counts, sums for specific periods for income, expenses, payables, receivables), and explain app features.
    If the user asks for something outside the scope of this application, politely state that you can only assist with matters related to this application or that you are unable to answer that specific query.
  `;

  let possibleIntentsPart = `Possible intents are: "perform_action", "query_app_data", "explain_feature", "out_of_scope".`;

  let intentSpecificInstructions = `
    If intent is "perform_action":
      - actionType: "create_sales_invoice", "add_income", "add_expense".
      - entities:
        - For "create_sales_invoice": customerName (string), items (array of {productName, quantity, unitPrice, unit}), notes (string, optional).
        - For "add_income" or "add_expense": description (string), amount (number), date (string, optional, e.g., "আজকে", "গতকাল", "today", "yesterday").
      - responseText: A short confirmation that the action is being initiated.

    If intent is "query_app_data":
      - actionDetails:
        - dataType: "transactions" | "balance" | "debts" 
        - queryType: "count" | "sum_amount" | "get_balance"
        - filters: (object, optional)
          - type: "income" | "expense" (for transactions), or "payable" | "receivable" (for debts)
          - period: "today" | "current_week" | "current_month" | "all_time" (default if not specified for sums/counts)
          - status: "active" | "deleted" | "all" (for transaction counts), or "settled" | "unsettled" | "all" (for debt counts/sums)
      - responseText: A generic acknowledgment that the data is being fetched. Example: "তথ্য দেখছি..." or "Fetching data...". The application will provide the actual data.
        If the query is ambiguous (e.g., "how much debit"), try to infer the most likely dataType and filter. For "debit" or "দেনা", prefer dataType "debts" with filter type "payable". For "credit" or "পাওনা", prefer dataType "debts" with filter type "receivable". For "expense" or "খরচ", prefer dataType "transactions" with filter type "expense". For "income" or "আয়", prefer dataType "transactions" with filter type "income".

    If intent is "explain_feature":
      - responseText: Briefly explain the requested app feature in simple terms. If asked "what can you do?", list some key capabilities.
      
    If intent is "out_of_scope":
      - responseText: Politely state that you cannot assist with requests outside this application or that you are unable to answer that specific query. Example: "আমি দুঃখিত, এই অনুরোধে আমি সাহায্য করতে পারছি না।" or "I am unable to answer that query."
  `;
  
  if (aiScope === 'global') {
    systemInstructionPart = `
      You are a helpful AI assistant. You can answer general knowledge questions.
      Additionally, you can assist with the 'দৈনিক আয়-ব্যয় ট্র্যাকার' (Daily Spending & Earning Tracker) application for tasks like creating transactions, invoices, or querying financial data.
      If the user's query is clearly app-related, prioritize app-specific actions. Otherwise, provide a general answer.
    `;
    possibleIntentsPart = `Possible intents are: "perform_action", "query_app_data", "explain_feature", "general_query", "out_of_scope".
      - For app-related queries, try to match "perform_action", "query_app_data", or "explain_feature" first.
      - Use "general_query" if the user asks a general knowledge question not related to the app.
      - Use "out_of_scope" only if an app-related query cannot be understood or a general query is truly unanswerable.
    `;
    intentSpecificInstructions += `
    
    If intent is "general_query":
      - responseText: Provide a direct answer to the user's general knowledge question. The application will display this text.
    `;
  }

  const prompt = `
    ${systemInstructionPart}

    User's voice/text command: "${transcript.replace(/"/g, '\\"')}"

    Current application context (use this for general queries if specific data query is not matched for app-related tasks):
    - Balance: ${appContext.balance} BDT
    - Total Income (all time): ${appContext.totalIncome} BDT
    - Total Expense (all time): ${appContext.totalExpense} BDT
    - Total Receivable (all time, unsettled): ${appContext.totalReceivable} BDT
    - Total Payable (all time, unsettled): ${appContext.totalPayable} BDT
    - Active Transactions (current count): ${appContext.activeTransactionsCount}
    - Managed Persons (current count): ${appContext.personsCount}
    - Available Features: ${appContext.featureList.join(', ')}

    Based on the user's command and the app context, determine the intent and extract relevant information.
    ${possibleIntentsPart}

    ${intentSpecificInstructions}

    IMPORTANT LANGUAGE INSTRUCTION: You MUST provide your entire response, especially the "responseText" field, strictly in the ${targetLanguage} language. Do not use any other language in the "responseText" field.
    For example, if the target language is English and you are acknowledging a data query, a good responseText would be "Fetching that information for you...".

    Return the information in the following JSON format:
    {
      "intent": "string",
      "actionDetails": { 
        "actionType": "string | null", 
        "entities": {}, 
        "dataType": "string | null", 
        "queryType": "string | null", 
        "filters": {} 
      } | null,
      "responseText": "string", 
      "originalQuery": "${transcript.replace(/"/g, '\\"')}"
    }
    Ensure quantities and unit prices are numbers for app actions.
    Respond ONLY with the JSON object. Do not add any explanatory text before or after the JSON.
    For date parsing in "add_income"/"add_expense", if user says "আজকে" or "আজ", map to "today". If "গতকাল", map to "yesterday". If no date mentioned, it's optional.
  `;
  
  const generationConfig: Record<string, any> = {
    responseMimeType: "application/json", 
  };
  if (settings.temperature !== undefined) generationConfig.temperature = settings.temperature;
  if (settings.topK !== undefined) generationConfig.topK = settings.topK;
  if (settings.topP !== undefined) generationConfig.topP = settings.topP;
  
  try {
    console.log("[GeminiService Debug] processUserCommandViaAI - Sending prompt to Gemini for command processing. Language:", targetLanguage, "Prompt snippet:", prompt.substring(0,300) + "...");
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: generationConfig,
    });
    
    const rawJsonText = response.text;
    console.log('[GeminiService Debug] processUserCommandViaAI - Raw Gemini JSON Response:', rawJsonText);
    
    if (!rawJsonText) {
      console.warn("[GeminiService Debug] No text content (JSON) in Gemini response for command processing.");
      const defaultErrorText = targetLanguage === 'Bengali' ? "দুঃখিত, আমি আপনার অনুরোধ বুঝতে পারিনি। AI থেকে কোনো উত্তর আসেনি।" : "Sorry, I couldn't understand your request. No response from AI.";
      return { 
        intent: "out_of_scope", 
        responseText: defaultErrorText, 
        originalQuery: transcript, 
        error: "No text content from AI.",
        rawResponse: "EMPTY_RESPONSE_FROM_AI"
      };
    }
    
    let jsonStr = rawJsonText.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    try {
      const parsedData = JSON.parse(jsonStr);
      console.log("[GeminiService Debug] processUserCommandViaAI - Parsed data from Gemini:", parsedData);
      return { ...parsedData, rawResponse: rawJsonText }; 
    } catch (parseError) {
      console.error("[GeminiService Debug] Failed to parse JSON from Gemini for command processing:", jsonStr, parseError);
      const defaultParseErrorText = targetLanguage === 'Bengali' ? "দুঃখিত, AI থেকে একটি অপ্রত্যাশিত উত্তর এসেছে।" : "Sorry, an unexpected response was received from the AI.";
      return { 
        intent: "out_of_scope", 
        responseText: defaultParseErrorText, 
        originalQuery: transcript, 
        error: "Invalid JSON from AI.", 
        rawResponse: rawJsonText 
      };
    }
  } catch (error) {
    console.error("[GeminiService Debug] Error processing command via Gemini:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API error during command processing: ${error.message}`);
    }
    throw new Error("An unknown error occurred during command processing via Gemini.");
  }
};