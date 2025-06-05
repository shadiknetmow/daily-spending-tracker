
import { PHONETIC_MAP_BN } from '../constants';

const BANGLA_STANDALONE_VOWELS = "অআইঈউঊঋএঐওঔ";
const BANGLA_CONSONANTS = "কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ৎংঃঁ";
const STANDALONE_VOWEL_TO_KAR_MAP: { [key: string]: string } = {
  'অ': '', // অ-kar is implicit or based on context (e.g., for 'o' sound after consonant if 'o' maps to 'অ')
  'আ': 'া',
  'ই': 'ি',
  'ঈ': 'ী',
  'উ': 'ু',
  'ঊ': 'ূ',
  'ঋ': 'ৃ',
  'এ': 'ে',
  'ঐ': 'ৈ',
  'ও': 'ো',
  'ঔ': 'ৌ',
};

// Refactored phonetic conversion logic
export function convertToBanglaPhonetic(inputText: string): string {
  const inputWords = inputText.split(/(\s+)/); // Split by space, keeping spaces
  let result = "";

  for (const currentWord of inputWords) {
    if (currentWord.match(/^\s+$/)) { // If it's purely whitespace
      result += currentWord;
      continue;
    }
    if (currentWord.length === 0) {
        continue;
    }

    const lowerWord = currentWord.toLowerCase();
    // Check for direct full-word match first (e.g., "amar" -> "আমার")
    // This check is case-insensitive for the key lookup in PHONETIC_MAP_BN
    if (PHONETIC_MAP_BN.hasOwnProperty(lowerWord) && PHONETIC_MAP_BN[lowerWord]) {
        // Heuristic: if the English key is longer than 1 char, or the Bangla value is longer than 1 char,
        // assume it's a "word" mapping rather than a single character phonetic unit.
        // This helps differentiate 'a' (single char) from 'ai' (diphthong) or 'amar' (word).
        if (lowerWord.length > 1 || PHONETIC_MAP_BN[lowerWord].length > 1 ) {
            result += PHONETIC_MAP_BN[lowerWord];
            continue; 
        }
    }
    
    // Character-by-character/segment conversion for the currentWord
    let charResultForWord = "";
    let i = 0;
    while (i < currentWord.length) {
      let foundMatch = false;
      // Check for longest possible match (e.g., 3 chars, then 2, then 1)
      for (let len = 3; len >= 1; len--) {
        if (i + len <= currentWord.length) {
          const segment = currentWord.substring(i, i + len);
          // Segment matching IS case-sensitive as map has entries like 'NG' vs 'ng', 'Sh' vs 'sh'
          if (PHONETIC_MAP_BN.hasOwnProperty(segment)) {
            const banglaEquivalent = PHONETIC_MAP_BN[segment];

            if (BANGLA_STANDALONE_VOWELS.includes(banglaEquivalent)) {
              // If the Bangla equivalent is a standalone vowel
              if (charResultForWord.length > 0 && BANGLA_CONSONANTS.includes(charResultForWord[charResultForWord.length - 1])) {
                // Preceded by a consonant, so use Kar form
                charResultForWord += STANDALONE_VOWEL_TO_KAR_MAP[banglaEquivalent as keyof typeof STANDALONE_VOWEL_TO_KAR_MAP] || '';
              } else {
                // Start of word or preceded by a vowel/non-consonant, use standalone vowel
                charResultForWord += banglaEquivalent;
              }
            } else {
              // It's a consonant, conjunct, or already a special form (like a pre-defined Kar or Hasant)
              charResultForWord += banglaEquivalent;
            }
            
            i += len;
            foundMatch = true;
            break; 
          }
        }
      }
      if (!foundMatch) {
        charResultForWord += currentWord[i]; // Keep original if no map for character/segment
        i += 1;
      }
    }
    result += charResultForWord;
  }
  return result;
}
