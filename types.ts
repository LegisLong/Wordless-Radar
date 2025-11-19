export interface SignalWord {
  id: string;
  text: string;
  isMeaningful: boolean;
  x: number;
  y: number;
  rotation: number;
}

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LOADING = 'LOADING',
  LEVEL_TRANSITION = 'LEVEL_TRANSITION'
}

export interface RuleSet {
  minLength?: number;
  includeChar?: string;
  excludeChar?: string;
  description: string;
}

export interface LevelConfig {
  level: number;
  name: string;
  targetScore: number; // Score needed to pass this level
  duration: number; // Seconds added to clock
  rules: RuleSet;
  promptContext: string; // Hint for AI generation
}

export interface GameConfig {
  spawnCount: number;
  difficultyMultiplier: number;
}