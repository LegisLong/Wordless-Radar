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

export type Language = 'en' | 'vi';

export interface TranslationDictionary {
  mission: string;
  score: string;
  timer: string;
  signalVerified: string;
  errorInvalid: string;
  ruleViolation: string;
  awaitingInput: string;
  manual: string;
  top: string;
  rescan: string;
  refreshSignal: string;
  missionBriefing: string;
  startMission: string;
  levelComplete: string;
  nextFreq: string;
  secAdded: string;
  signalLost: string;
  finalScore: string;
  levelReached: string;
  newHighScore: string;
  reInitialize: string;
  scanning: string;
  validSignal: string;
  validDesc: string;
  noiseError: string;
  noiseDesc: string;
  controls: string;
  controlsDesc: string;
  resume: string;
  briefingText: string;
  settings: string;
  volume: string;
  quit: string;
  restart: string;
  close: string;
  menu: string;
}