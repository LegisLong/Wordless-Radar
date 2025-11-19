import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RadioMachine } from './components/RadioMachine';
import { SignalWordItem } from './components/SignalWord';
import { fetchSignalBatch } from './services/geminiService';
import { SignalWord, GameState, LevelConfig } from './types';
import { motion, AnimatePresence } from 'framer-motion';

const LEVELS: LevelConfig[] = [
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

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [words, setWords] = useState<SignalWord[]>([]);
  const [score, setScore] = useState(0);
  const [topScore, setTopScore] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [feedback, setFeedback] = useState<'idle' | 'success' | 'failure' | 'partial_failure'>('idle');
  const [message, setMessage] = useState<string>("");
  const radioRef = useRef<HTMLDivElement>(null);

  const currentLevelConfig = LEVELS[levelIndex];

  // Initialization
  useEffect(() => {
    const storedTopScore = localStorage.getItem('semantic-signal-top-score');
    if (storedTopScore) {
      setTopScore(parseInt(storedTopScore, 10));
    }
  }, []);

  // Timer Logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameState === GameState.PLAYING && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startGame = async () => {
    setWords([]);
    setScore(0);
    setLevelIndex(0);
    setTimeLeft(LEVELS[0].duration);
    setGameState(GameState.LOADING);
    await spawnWords(LEVELS[0], true); // Use replace=true for fresh start
    setGameState(GameState.PLAYING);
  };

  const nextLevel = async () => {
    if (levelIndex + 1 < LEVELS.length) {
        const nextIdx = levelIndex + 1;
        const nextConfig = LEVELS[nextIdx];
        
        setGameState(GameState.LEVEL_TRANSITION);
        setWords([]); // Clear old words
        
        // Wait a moment for visual transition
        setTimeout(async () => {
            setLevelIndex(nextIdx);
            setTimeLeft(prev => prev + nextConfig.duration); // Add bonus time
            await spawnWords(nextConfig, true);
            setGameState(GameState.PLAYING);
        }, 2000);
    }
  };

  const finishGame = () => {
    setGameState(GameState.GAME_OVER);
    if (score > topScore) {
      setTopScore(score);
      localStorage.setItem('semantic-signal-top-score', score.toString());
    }
  };

  // Modified to support replacing words entirely (for Rescan)
  const spawnWords = async (config: LevelConfig, replace: boolean = false) => {
    try {
        // Fetch 20 signals as requested
        const newWordsData = await fetchSignalBatch(20, config.promptContext, config.rules);
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        const formattedWords: SignalWord[] = newWordsData.map((w) => ({
            ...w,
            id: Math.random().toString(36).substr(2, 9),
            x: Math.random() * (screenW - 200) + 50,
            y: Math.random() * (screenH - 300) + 50,
            rotation: (Math.random() * 20) - 10
        }));
        
        // Collision avoidance with center radio
        const cleanWords = formattedWords.map(w => {
            const centerX = screenW / 2;
            const centerY = screenH / 2;
            const dist = Math.sqrt(Math.pow(w.x - centerX, 2) + Math.pow(w.y - centerY, 2));
            
            if (dist < 250) {
                return { ...w, x: w.x < centerX ? w.x - 200 : w.x + 200 };
            }
            return w;
        });

        setWords(prev => {
             if (replace) {
                 return cleanWords;
             }
             
             // Prevent overcrowding: if too many items, remove some old ones to maintain performance
             // Prioritize keeping words that are valid for the current level
             let current = prev;
             if (current.length > 25) {
                 const valid = current.filter(w => validateWord(w, config) === 'valid');
                 const others = current.filter(w => validateWord(w, config) !== 'valid');
                 // Keep all valid words, plus a few recent others to act as obstacles
                 current = [...valid, ...others.slice(-8)];
             }
             return [...current, ...cleanWords];
        });
    } catch (e) {
        console.error("Failed to spawn words", e);
    }
  };

  const handleRegenerate = async () => {
      if (gameState !== GameState.PLAYING) return;
      
      setGameState(GameState.LOADING);
      // Wait a minimal amount of time to let the UI show "SCANNING"
      // The await spawnWords will naturally take some time due to API/Processing
      await spawnWords(currentLevelConfig, true);
      setGameState(GameState.PLAYING);
      showMessage("FREQUENCY RESCANNED");
  };

  const validateWord = (word: SignalWord, config: LevelConfig): 'valid' | 'noise' | 'rule_break' => {
    if (!word.isMeaningful) return 'noise';
    
    const rules = config.rules;
    if (rules.minLength && word.text.length < rules.minLength) return 'rule_break';
    if (rules.includeChar && !word.text.toLowerCase().includes(rules.includeChar.toLowerCase())) return 'rule_break';
    if (rules.excludeChar && word.text.toLowerCase().includes(rules.excludeChar.toLowerCase())) return 'rule_break';

    return 'valid';
  };

  const handleWordDrop = (id: string, x: number, y: number) => {
    if (!radioRef.current) return;

    const radioRect = radioRef.current.getBoundingClientRect();
    const radioCenter = {
      x: radioRect.left + radioRect.width / 2,
      y: radioRect.top + radioRect.height / 2
    };

    const distance = Math.sqrt(Math.pow(x - radioCenter.x, 2) + Math.pow(y - radioCenter.y, 2));

    if (distance < 140) {
      const droppedWord = words.find(w => w.id === id);
      if (droppedWord) {
        processDrop(droppedWord);
      }
    }
  };

  const processDrop = (word: SignalWord) => {
    // 1. Update state to remove the processed word
    const remainingWords = words.filter(w => w.id !== word.id);
    setWords(remainingWords);

    const result = validateWord(word, currentLevelConfig);

    // 2. Scoring & Feedback
    if (result === 'valid') {
      setScore(s => {
          const newScore = s + 10;
          // Check level up condition immediately after score update
          if (newScore >= currentLevelConfig.targetScore && levelIndex < LEVELS.length - 1) {
              setTimeout(nextLevel, 500); // Slight delay so user sees the +10
          }
          return newScore;
      });
      setFeedback('success');
      showMessage("+10 SIGNAL MATCH");
    } else if (result === 'rule_break') {
      setScore(s => Math.max(0, s - 2));
      setFeedback('partial_failure');
      showMessage("-2 RULE VIOLATION");
    } else {
      setScore(s => Math.max(0, s - 5));
      setFeedback('failure');
      showMessage("-5 NOISE DETECTED");
    }

    setTimeout(() => setFeedback('idle'), 600);

    // 3. Check if we need to refill words
    // We refill if:
    // A) Total word count is low (standard behavior)
    // B) No VALID words are left on screen (anti-frustration feature)
    const validWordsLeft = remainingWords.filter(w => validateWord(w, currentLevelConfig) === 'valid').length;

    if ((remainingWords.length <= 3 || validWordsLeft === 0) && gameState === GameState.PLAYING) {
        spawnWords(currentLevelConfig);
    }
  };

  const showMessage = (msg: string) => {
      setMessage(msg);
      setTimeout(() => setMessage(""), 1500);
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-[#1a1a2e] relative select-none font-['VT323']">
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
        <div>
            <h1 className="pixel-font text-2xl text-yellow-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">SEMANTIC RADIO</h1>
            <div className="bg-black/50 p-2 mt-2 rounded border border-gray-600 backdrop-blur-sm inline-block">
                <div className="text-blue-300 text-lg">LEVEL {currentLevelConfig.level}: {currentLevelConfig.name}</div>
                <div className="w-48 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${Math.min(100, (score / currentLevelConfig.targetScore) * 100)}%` }}
                    />
                </div>
                <div className="text-xs text-gray-400 mt-1 text-right">{score} / {currentLevelConfig.targetScore} TO ADVANCE</div>
            </div>
        </div>
        <div className="text-right pointer-events-auto">
            <div className="pixel-font text-sm text-gray-500 mb-1">TOP: {topScore}</div>
            <div className="pixel-font text-5xl text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                {score}
            </div>
            {message && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xl font-bold mt-2 ${message.includes('+') ? 'text-green-400' : message.includes('RULE') ? 'text-yellow-400' : 'text-red-400'}`}
                >
                    {message}
                </motion.div>
            )}
        </div>
      </div>

      {/* Controls Bottom Right */}
      {gameState === GameState.PLAYING && (
        <div className="absolute bottom-6 right-6 z-50 pointer-events-auto flex flex-col gap-2 items-end">
            <button
                onClick={handleRegenerate}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg pixel-font border-4 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 group"
            >
                <span className="text-xl group-hover:rotate-180 transition-transform duration-300">↺</span> RESCAN
            </button>
            <span className="text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">REFRESH SIGNAL FEED</span>
        </div>
      )}

      {/* Center Radio */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div ref={radioRef} className="pointer-events-auto">
            <RadioMachine 
                feedback={feedback} 
                onDrop={() => {}} 
                timeLeft={timeLeft}
                currentLevel={currentLevelConfig.level}
                rules={currentLevelConfig.rules}
                score={score}
            />
        </div>
      </div>

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md"
          >
              <h2 className="pixel-font text-4xl text-blue-400 mb-6 leading-relaxed">MISSION<br/>BRIEFING</h2>
              <p className="font-mono text-lg text-gray-300 mb-8 text-left bg-black/50 p-6 border border-gray-600 rounded">
                  1. <strong>FILTER</strong> meaningful signals from noise.<br/>
                  2. <strong>OBEY</strong> the Level Rules (Length, Letters, etc).<br/>
                  3. <strong>RACE</strong> against the clock.<br/>
                  <br/>
                  <span className="text-green-400">MATCH</span> = +10 Points + Level Progress<br/>
                  <span className="text-yellow-400">BAD MATCH</span> = -2 Points<br/>
                  <span className="text-red-400">NOISE</span> = -5 Points
              </p>
              <button 
                onClick={startGame}
                className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xl pixel-font border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-1 active:shadow-none transition-all"
              >
                  START MISSION
              </button>
          </motion.div>
        </div>
      )}

      {/* Level Transition Screen */}
      {gameState === GameState.LEVEL_TRANSITION && (
          <div className="absolute inset-0 z-50 bg-green-900/90 flex flex-col items-center justify-center text-center backdrop-blur-md">
               <h2 className="pixel-font text-4xl text-white mb-4 animate-pulse">LEVEL COMPLETE</h2>
               <div className="text-2xl text-green-300 font-mono mb-8">TUNING TO NEXT FREQUENCY...</div>
               <div className="text-xl text-white">+ {LEVELS[levelIndex + 1]?.duration} SECONDS ADDED</div>
          </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="border-4 border-white p-8 bg-[#1a1a2e]"
            >
                <h2 className="pixel-font text-3xl text-red-500 mb-4">SIGNAL LOST</h2>
                <div className="flex flex-col gap-4 mb-8">
                    <div className="text-2xl text-white font-mono">FINAL SCORE: <span className="text-yellow-400">{score}</span></div>
                    <div className="text-xl text-gray-400 font-mono">LEVEL REACHED: {currentLevelConfig.level}</div>
                    {score >= topScore && score > 0 && (
                        <div className="text-green-400 pixel-font animate-pulse mt-2">NEW HIGH SCORE!</div>
                    )}
                </div>
                <button 
                    onClick={startGame}
                    className="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold text-lg pixel-font border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] active:translate-y-1 active:shadow-none"
                >
                    RE-INITIALIZE
                </button>
            </motion.div>
        </div>
      )}

      {/* Loading State */}
      {gameState === GameState.LOADING && (
           <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center">
               <div className="pixel-font text-2xl text-white animate-pulse">SCANNING ETHER...</div>
           </div>
      )}

      {/* Floating Words Area */}
      <div className="absolute inset-0 overflow-hidden z-20 pointer-events-none">
        <AnimatePresence>
            {words.map((word) => (
                <div key={word.id} className="pointer-events-auto inline-block">
                    <SignalWordItem word={word} onDragEnd={handleWordDrop} />
                </div>
            ))}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default App;