
import React, { useState } from 'react';
import { BN_UI_TEXT, GEMINI_PROMPT_LANG } from '../constants';
import { getFinancialTip, isGeminiAvailable } from '../services/geminiService';
import * as speechService from '../services/speechService'; // Import speechService
import LightBulbIcon from './icons/LightBulbIcon';
import { GeminiSettings } from '../types'; 

interface AITipCardProps {
  balance: number;
  geminiSettings: GeminiSettings; 
}

export const AITipCard: React.FC<AITipCardProps> = ({ balance, geminiSettings }) => {
  const [tip, setTip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const geminiReady = isGeminiAvailable();
  const speechReady = speechService.isSpeechSynthesisAvailable();

  const fetchTip = async () => {
    console.log('[AITipCard Debug] Fetch Tip button clicked.');
    if (!geminiReady) {
        const apiKeyErrorMsg = BN_UI_TEXT.API_KEY_NOT_CONFIGURED;
        setError(apiKeyErrorMsg);
        console.error('[AITipCard Debug] Gemini not ready:', apiKeyErrorMsg);
        return;
    }
    speechService.cancelSpeech(); // Cancel any ongoing speech before fetching new tip
    setIsLoading(true);
    setError(null);
    setTip(null);
    console.log('[AITipCard Debug] Fetching financial tip. Balance:', balance, 'Settings:', geminiSettings);
    try {
      // Note: getFinancialTip in geminiService.ts will log the prompt.
      const fetchedTip = await getFinancialTip(balance, GEMINI_PROMPT_LANG, geminiSettings); 
      console.log('[AITipCard Debug] Fetched financial tip text:', fetchedTip);
      setTip(fetchedTip);

      if (speechReady && fetchedTip) {
        console.log('[AITipCard Debug] Attempting to speak financial tip in English: "' + fetchedTip.substring(0, 50) + '..."');
        try {
          await speechService.speakText(fetchedTip, 'en-US'); // Speak in English
          console.log('[AITipCard Debug] Financial tip speech synthesis initiated successfully.');
        } catch (speechError: any) {
          console.warn("[AITipCard Debug] AI Tip speech synthesis error:", speechError.message || speechError);
          // Optionally notify user about speech error, but tip is still displayed
        }
      } else if (!speechReady) {
        console.warn('[AITipCard Debug] Speech synthesis not available, so tip will not be spoken.');
      }
    } catch (e: any) {
      const errorMsg = e.message || BN_UI_TEXT.ADVICE_ERROR;
      setError(errorMsg);
      console.error("[AITipCard Debug] Error fetching or processing financial tip:", errorMsg, e);
    } finally {
      setIsLoading(false);
      console.log('[AITipCard Debug] Fetch tip process finished. isLoading:', false);
    }
  };

  return (
    <section aria-labelledby="ai-advice-heading" className="my-8 p-6 bg-white rounded-xl shadow-lg">
      <h2 id="ai-advice-heading" className="text-2xl font-semibold text-slate-700 mb-4 text-center flex items-center justify-center">
        <LightBulbIcon className="w-7 h-7 mr-2 text-yellow-500" />
        {BN_UI_TEXT.FINANCIAL_ADVICE_SECTION_TITLE}
      </h2>
      
      {!geminiReady && (
        <p className="text-center text-orange-600 bg-orange-50 p-3 rounded-md">{BN_UI_TEXT.API_KEY_NOT_CONFIGURED}</p>
      )}

      {geminiReady && (
        <div className="text-center">
          <button
            onClick={fetchTip}
            disabled={isLoading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? BN_UI_TEXT.LOADING : BN_UI_TEXT.GET_ADVICE_BTN}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="mt-4 text-center text-slate-500">
            <div role="status" className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-yellow-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2">{BN_UI_TEXT.LOADING}</p>
        </div>
      )}

      {error && <p className="mt-4 text-center text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
      
      {tip && !isLoading && (
        <div className="mt-6 p-4 bg-sky-50 border border-sky-200 rounded-lg shadow">
          <h3 className="text-lg font-medium text-sky-700 mb-2">{BN_UI_TEXT.ADVICE_FROM_GEMINI}</h3>
          <p className="text-slate-600 leading-relaxed">{tip}</p>
        </div>
      )}
    </section>
  );
};

// Removed default export
// export default AITipCard;
