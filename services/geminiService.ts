
import { GoogleGenAI, Type } from "@google/genai";
import { SignalWord, RuleSet } from "../types";
import { SEMANTIC_VOCABULARY } from "../data/vocabulary";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
    rules?: RuleSet
): Promise<Omit<SignalWord, 'id' | 'x' | 'y' | 'rotation'>[]> => {
  
  // We want a mix of approx 45% semantic words and 55% noise
  const semanticCount = Math.max(Math.floor(count * 0.45), 4); 
  const noiseCount = count - semanticCount;
  
  let items: Omit<SignalWord, 'id' | 'x' | 'y' | 'rotation'>[] = [];

  // 1. Try to get Semantic Words from Gemini with Context
  if (process.env.API_KEY) {
    try {
      const prompt = `Generate a JSON list of ${semanticCount} distinct, evocative English words related to science, space, technology, or nature. 
      ${promptContext ? `CRITICAL CONSTRAINT: ${promptContext}` : ''}
      They must be single words. No noise or gibberish, only real dictionary words.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              words: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
            },
            required: ['words'],
          },
        },
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        if (Array.isArray(data.words)) {
            const apiWords = data.words.map((text: string) => ({ text, isMeaningful: true }));
            // Validate API words against rules just in case
            const validApiWords = apiWords.filter((w: {text: string}) => meetsRules(w.text, rules));
            items = [...items, ...validApiWords];
        }
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
    }
  }

  // 2. Fill remaining semantic slots with vocabulary (Fallback logic)
  const shuffledVocab = [...SEMANTIC_VOCABULARY].sort(() => Math.random() - 0.5);
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

  // If we STILL don't have enough (e.g. very strict rules and no API), fill with random vocab
  // even if they break rules, so at least the game doesn't crash/hang.
  // The player will just have to avoid them.
  vocabIndex = 0;
  while (items.length < semanticCount) {
    const text = shuffledVocab[vocabIndex % shuffledVocab.length];
    if (!items.some(i => i.text === text)) {
        items.push({ text, isMeaningful: true });
    }
    vocabIndex++;
  }

  // 3. Generate Nasty Noise Words Locally
  for (let i = 0; i < noiseCount; i++) {
    items.push({
        text: generateNoiseWord(),
        isMeaningful: false
    });
  }

  // 4. Shuffle everything together
  return items.sort(() => Math.random() - 0.5);
};
