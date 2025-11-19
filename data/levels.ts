
import { LevelConfig } from "../types";

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: "CALIBRATION",
    targetScore: 50,
    duration: 60,
    rules: {
      description: "ANY meaningful word",
    },
    promptContext: ""
  },
  {
    level: 2,
    name: "NARROW BAND",
    targetScore: 120,
    duration: 45,
    rules: {
      minLength: 5,
      description: "Meaningful & Length > 4",
    },
    promptContext: "Words must be at least 5 letters long."
  },
  {
    level: 3,
    name: "COMPLEX FILTER",
    targetScore: 200,
    duration: 45,
    rules: {
      minLength: 6,
      includeChar: 'r',
      description: "Length > 5 & Contains 'R'",
    },
    promptContext: "Words must be at least 6 letters long AND contain the letter 'r'."
  },
  {
    level: 4,
    name: "SILENT MODE",
    targetScore: 9999, // Endless for now
    duration: 45,
    rules: {
      minLength: 4,
      excludeChar: 'e',
      description: "Meaningful & NO letter 'E'",
    },
    promptContext: "Words must NOT contain the letter 'e'."
  }
];
