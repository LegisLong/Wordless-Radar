
import { SignalWord, RuleSet, Language } from "../types";
import { getVocabulary } from "../data/vocabulary";

// Helper to generate random "nasty" noise algorithmically
const generateNoiseWord = (): string => {
    const noiseTypes = [
        // Type 1: High entropy alphanumeric
        () => {
            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            const len = 5 + Math.floor(Math.random() * 6);
            let res = "";
            for(let i=0; i<len; i++) res += chars[Math.floor(Math.random() * chars.length)];
            return res;
        },
        // Type 2: Symbol heavy interference
        () => {
            const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
            const len = 4 + Math.floor(Math.random() * 5);
            let res = "";
            for(let i=0; i<len; i++) res += chars[Math.floor(Math.random() * chars.length)];
            return res;
        },
        // Type 3: Hex/Machine code snippets
        () => "0x" + Math.floor(Math.random() * 65535).toString(16).toUpperCase(),
        // Type 4: Corrupted system messages
        () => {
            const bases = ["ERR", "NULL", "VOID", "NaN", "404", "SEG", "DUMP", "FAIL"];
            const suffix = Math.floor(Math.random() * 99);
            return `${bases[Math.floor(Math.random() * bases.length)]}_${suffix}`;
        },
        // Type 5: Binary-like bursts
         () => {
            const chars = "01";
            const len = 6 + Math.floor(Math.random() * 4);
            let res = "";
            for(let i=0; i<len; i++) res += chars[Math.floor(Math.random() * chars.length)];
            return res;
        }
    ];

    // Pick a random noise generator
    const generator = noiseTypes[Math.floor(Math.random() * noiseTypes.length)];
    return generator();
};

// Helper to check if word meets rules
const meetsRules = (text: string, rules?: RuleSet): boolean => {
    if (!rules) return true;
    if (rules.minLength && text.length < rules.minLength) return false;
    if (rules.includeChar && !text.toLowerCase().includes(rules.includeChar.toLowerCase())) return false;
    if (rules.excludeChar && text.toLowerCase().includes(rules.excludeChar.toLowerCase())) return false;
    return true;
};

export const fetchSignalBatch = async (
    count: number = 20, 
    promptContext: string = "",
    rules: RuleSet | undefined,
    language: Language
): Promise<Omit<SignalWord, 'id' | 'x' | 'y' | 'rotation'>[]> => {
  
  // We want a mix of approx 45% semantic words and 55% noise
  const semanticCount = Math.max(Math.floor(count * 0.45), 4); 
  const noiseCount = count - semanticCount;
  
  let items: Omit<SignalWord, 'id' | 'x' | 'y' | 'rotation'>[] = [];

  // 1. Fill semantic slots with vocabulary (Local Logic)
  const vocabList = getVocabulary(language);
  const shuffledVocab = [...vocabList].sort(() => Math.random() - 0.5);
  let vocabIndex = 0;
  
  // Try to find words that match the rules
  while (items.length < semanticCount && vocabIndex < shuffledVocab.length) {
    const text = shuffledVocab[vocabIndex];
    vocabIndex++;
    
    if (items.some(i => i.text === text)) continue;
    
    if (meetsRules(text, rules)) {
        items.push({ text, isMeaningful: true });
    }
  }

  // If we STILL don't have enough (e.g. very strict rules), fill with random vocab
  // even if they break rules, so at least the game doesn't crash/hang.
  vocabIndex = 0;
  while (items.length < semanticCount) {
    const text = shuffledVocab[vocabIndex % shuffledVocab.length];
    if (!items.some(i => i.text === text)) {
        items.push({ text, isMeaningful: true });
    }
    vocabIndex++;
  }

  // 2. Generate Nasty Noise Words Locally (Noise is language agnostic usually, or purely machine code)
  for (let i = 0; i < noiseCount; i++) {
    items.push({
        text: generateNoiseWord(),
        isMeaningful: false
    });
  }

  // 3. Shuffle everything together
  return items.sort(() => Math.random() - 0.5);
};
