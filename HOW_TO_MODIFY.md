
# Customization Guide: Semantic Signal

This game is designed to be easily extensible. You can modify the game levels (difficulty, rules) and the fallback vocabulary (used when the AI API is unavailable or to supplement generation) by editing the files in the `data/` directory.

## 1. Modifying Levels

Open `data/levels.ts`.

The game uses an array of `LevelConfig` objects. To add a new level, append a new object to the `LEVELS` array.

### Level Structure

```typescript
{
  level: number;          // The level number displayed to the user
  name: string;           // A cool sci-fi name for the level
  targetScore: number;    // Points required to pass this level
  duration: number;       // Time (in seconds) added to the clock when reaching this level
  rules: {
    minLength?: number;   // (Optional) Word must be at least this long
    includeChar?: string; // (Optional) Word MUST contain this letter
    excludeChar?: string; // (Optional) Word must NOT contain this letter
    description: string;  // Text displayed on the yellow sticky note
  },
  promptContext: string;  // Instructions sent to the AI to generate specific types of words
}
```

### Example: Adding a "Hard Mode" Level

To add a level where words must be long and contain 'z':

```typescript
{
  level: 5,
  name: "DEEP SPACE",
  targetScore: 500,
  duration: 60,
  rules: {
    minLength: 7,
    includeChar: 'z',
    description: "Length > 6 & Contains 'Z'",
  },
  promptContext: "Words must be complex, scientific, and contain the letter 'z'."
}
```

---

## 2. Modifying Vocabulary

Open `data/vocabulary.ts`.

This file contains `SEMANTIC_VOCABULARY`, a simple array of strings.

*   **Purpose:** These words are used when the Gemini AI is unavailable, or to fill in gaps if the AI doesn't generate enough unique words.
*   **How to edit:** simply add, remove, or change strings in the array.
*   **Note:** These are treated as "Meaningful" words by the game logic.

```typescript
export const SEMANTIC_VOCABULARY = [
  "Galaxy", 
  "Nebula", 
  "MyNewWord", // <--- Added a new word
  // ...
];
```
