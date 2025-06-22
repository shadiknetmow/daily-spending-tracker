
import { BN_UI_TEXT } from '../constants';

let synthesis: SpeechSynthesis | null = null;
let voices: SpeechSynthesisVoice[] = [];

const initializeSpeechSynthesis = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    synthesis = window.speechSynthesis;
    const loadVoices = () => {
      voices = synthesis?.getVoices() || [];
      // console.log("SpeechService: Available voices:", voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
    };
    
    loadVoices(); // Initial load
    if (synthesis?.onvoiceschanged !== undefined) { // If voices load asynchronously
      synthesis.onvoiceschanged = loadVoices;
    }
  } else {
    console.warn(BN_UI_TEXT.SPEECH_SYNTHESIS_NOT_SUPPORTED);
  }
};

initializeSpeechSynthesis(); // Call on script load

export const speakText = (text: string, lang: string = 'bn-BD'): Promise<void> => {
  console.log('[SpeechService Debug] speakText - Attempting to speak. Text:', `"${text.substring(0,70)}..."`, 'Requested Lang:', lang);
  return new Promise((resolve, reject) => {
    if (!synthesis) {
      console.error('[SpeechService Debug] Speech synthesis not initialized.');
      reject(new Error(BN_UI_TEXT.SPEECH_SYNTHESIS_NOT_INITIALIZED));
      return;
    }
    if (synthesis.speaking) {
      synthesis.cancel(); 
      console.log("[SpeechService Debug] Cancelled ongoing speech.");
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang; 

    let chosenVoice: SpeechSynthesisVoice | undefined = undefined;

    if (voices.length > 0) {
      const langSpecificVoices = voices.filter(voice => voice.lang === lang);
      if (langSpecificVoices.length > 0) {
        chosenVoice = langSpecificVoices.find(voice => voice.default) || langSpecificVoices[0];
      }

      if (!chosenVoice && lang.includes('-')) {
        const genericLang = lang.split('-')[0];
        const langGenericVoices = voices.filter(voice => voice.lang.startsWith(genericLang));
        if (langGenericVoices.length > 0) {
          chosenVoice = langGenericVoices.find(voice => voice.default) || langGenericVoices[0];
        }
      }
      
      if (!chosenVoice && lang.startsWith('bn')) { // If Bengali was requested but not found
        const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
        if (englishVoices.length > 0) {
          chosenVoice = englishVoices.find(voice => voice.lang === 'en-US' && voice.default) || 
                        englishVoices.find(voice => voice.default) || 
                        englishVoices[0];
        }
      }
       // Fallback for en-US if the requested lang was en-US and specific voice wasn't found (should be rare)
      if (!chosenVoice && lang === 'en-US') {
        const englishUSVoices = voices.filter(voice => voice.lang === 'en-US');
        if (englishUSVoices.length > 0) {
          chosenVoice = englishUSVoices.find(voice => voice.default) || englishUSVoices[0];
        }
      }

      if (!chosenVoice) {
        const defaultVoice = voices.find(voice => voice.default);
        if (defaultVoice) chosenVoice = defaultVoice;
      }
      
      if (!chosenVoice && voices.length > 0) {
        chosenVoice = voices[0];
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang; 
      }
    }
    
    console.log('[SpeechService Debug] speakText - Final voice choice:', utterance.voice ? `${utterance.voice.name} (${utterance.voice.lang})` : 'Browser Default', 'Utterance lang:', utterance.lang);
    
    utterance.pitch = 1;
    utterance.rate = (utterance.lang && utterance.lang.startsWith('bn')) ? 0.9 : 1.0; // Slower for Bengali, normal for English
    utterance.volume = 1;

    utterance.onend = () => {
      console.log("[SpeechService Debug] Speech synthesis ended successfully.");
      resolve();
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error('[SpeechService Debug] Speech synthesis error:', event.error, `Utterance: ${event.utterance.text.substring(0,50)}... Lang: ${event.utterance.lang}, Voice: ${event.utterance.voice?.name}`);
      reject(event); 
    };
    
    try {
      synthesis.speak(utterance);
    } catch (e: any) {
        console.error("[SpeechService Debug] Error calling synthesis.speak:", e);
        reject(e);
    }
  });
};

export const isSpeechSynthesisAvailable = (): boolean => !!synthesis;

export const cancelSpeech = () => {
  if (synthesis && synthesis.speaking) {
    // console.log("[SpeechService Debug] Cancelling current speech via cancelSpeech()."); // Redundant; speakText handles this.
    synthesis.cancel();
  }
};
