
import { PHONETIC_MAP_BN } from '../constants';

const BANGLA_STANDALONE_VOWELS = "অআইঈউঊঋএঐওঔ";
const BANGLA_CONSONANTS = "কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ৎংঃঁ"; // Includes ং ঃ ঁ ৎ
// Kar forms: া ি ী ু ূ ৃ ে ৈ ো ৌ
const STANDALONE_VOWEL_TO_KAR_MAP: { [key: string]: string } = {
  'অ': '', // অ-kar is implicit or handled by 'o' if 'o' maps to 'অ' and comes after a consonant
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

export function convertToBanglaPhonetic(inputText: string): string {
  const inputWords = inputText.split(/(\s+)/); // Split by space, preserving spaces
  let result = "";

  for (const currentWord of inputWords) {
    if (currentWord.match(/^\s+$/)) { // If it's purely whitespace
      result += currentWord;
      continue;
    }
    if (currentWord.length === 0) {
        continue;
    }
    
    // Check for direct full-word match first (e.g., "amar" -> "আমার")
    // Case-insensitive for the key lookup
    const lowerWordForFullMatch = currentWord.toLowerCase();
    if (PHONETIC_MAP_BN.hasOwnProperty(lowerWordForFullMatch) && PHONETIC_MAP_BN[lowerWordForFullMatch]) {
         // Heuristic: if the English key is longer than specific short phonetic units (like "ng", "sh")
         // or if the Bangla value is clearly a multi-character word, assume it's a "word" mapping.
         const phoneticUnitMaxLength = 3; // Max length of a phonetic unit like 'chh' or 'rN'
         if (lowerWordForFullMatch.length > phoneticUnitMaxLength || PHONETIC_MAP_BN[lowerWordForFullMatch].length > 1 || lowerWordForFullMatch === 'a' ) { // 'a' can be part of 'amar' but also standalone 'আ' based on map
            // For single char 'a' mapping to 'আ', it's likely a direct vowel mapping not a word.
            // But if "amar" is in map, it takes precedence. This logic might need refinement based on map contents.
            // The current PHONETIC_MAP_BN has "amar":"আমার". This length check should prioritize it.
            if(PHONETIC_MAP_BN[lowerWordForFullMatch].length > 1){ // if "amar" -> "আমার"
                result += PHONETIC_MAP_BN[lowerWordForFullMatch];
                continue;
            }
            // If it's something like 'a' -> 'আ', let character-by-character logic handle Kar forms.
        }
    }
    
    // Character-by-character/segment conversion for the currentWord
    let charResultForWord = "";
    let i = 0;
    while (i < currentWord.length) {
      let foundMatch = false;
      // Check for longest possible match (e.g., 3 chars for 'chh', then 2 for 'kh', 'sh', 'rN', then 1)
      // Order of check matters for some phonetic maps, e.g. 'chh' before 'ch'
      for (let len = 3; len >= 1; len--) {
        if (i + len <= currentWord.length) {
          const segment = currentWord.substring(i, i + len);
          // Segment matching IS case-sensitive for PHONETIC_MAP_BN (e.g. 'NG' vs 'ng', 'Sh' vs 'sh', 'O' vs 'o')
          if (PHONETIC_MAP_BN.hasOwnProperty(segment)) {
            const banglaEquivalent = PHONETIC_MAP_BN[segment];

            if (BANGLA_STANDALONE_VOWELS.includes(banglaEquivalent)) {
              // If the Bangla equivalent is a standalone vowel
              if (charResultForWord.length > 0 && BANGLA_CONSONANTS.includes(charResultForWord[charResultForWord.length - 1])) {
                // Preceded by a consonant, so use Kar form
                charResultForWord += STANDALONE_VOWEL_TO_KAR_MAP[banglaEquivalent as keyof typeof STANDALONE_VOWEL_TO_KAR_MAP] || '';
              } else {
                // Start of word or preceded by a vowel/non-consonant/non-Bangla char, use standalone vowel
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
        // If no phonetic map entry is found for the segment, append the original character.
        // This allows mixing Bangla phonetic typing with English or other characters.
        charResultForWord += currentWord[i];
        i += 1;
      }
    }
    result += charResultForWord;
  }
  return result;
}

