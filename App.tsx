import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RadioMachine } from './components/RadioMachine';
import { SignalWordItem } from './components/SignalWord';
import { fetchSignalBatch } from './services/geminiService';
import { audioService } from './services/audioService';
import { SignalWord, GameState, LevelConfig, Language } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevels } from './data/levels';
import { getTranslations } from './data/locales';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [words, setWords] = useState<SignalWord[]>([]);
  const [score, setScore] = useState(0);
  const [topScore, setTopScore] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [showHelp, setShowHelp] = useState(false); 
  const [language, setLanguage] = useState<Language>('en');

  const [feedback, setFeedback] = useState<'idle' | 'success' | 'failure' | 'partial_failure'>('idle');
  const [message, setMessage] = useState<string>("");
  const radioRef = useRef<HTMLDivElement>(null);

  // Derived Data based on Language
  const LEVELS = getLevels(language);
  const currentLevelConfig = LEVELS[levelIndex] || LEVELS[0];
  const t = getTranslations(language);

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
    if (gameState === GameState.PLAYING && timeLeft > 0 && !showHelp) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 10 && prev > 0) {
             audioService.playTick();
          }
          if (prev <= 1) {
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, showHelp]);

  const startGame = async () => {
    audioService.resume(); 
    audioService.playScan(); 

    setWords([]);
    setScore(0);
    setLevelIndex(0);
    setTimeLeft(LEVELS[0].duration);
    setGameState(GameState.LOADING);
    await spawnWords(LEVELS[0], true); 
    setGameState(GameState.PLAYING);
  };

  const nextLevel = async () => {
    if (levelIndex + 1 < LEVELS.length) {
        const nextIdx = levelIndex + 1;
        const nextConfig = LEVELS[nextIdx];
        
        audioService.playLevelUp();
        setGameState(GameState.LEVEL_TRANSITION);
        setWords([]); 
        
        setTimeout(async () => {
            setLevelIndex(nextIdx);
            setTimeLeft(prev => prev + nextConfig.duration); 
            await spawnWords(nextConfig, true);
            setGameState(GameState.PLAYING);
        }, 2000);
    }
  };

  const finishGame = () => {
    audioService.playGameOver();
    setGameState(GameState.GAME_OVER);
    if (score > topScore) {
      setTopScore(score);
      localStorage.setItem('semantic-signal-top-score', score.toString());
    }
  };

  const spawnWords = async (config: LevelConfig, replace: boolean = false) => {
    try {
        // Pass language to service
        const newWordsData = await fetchSignalBatch(20, config.promptContext, config.rules, language);
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        const formattedWords: SignalWord[] = newWordsData.map((w) => ({
            ...w,
            id: Math.random().toString(36).substr(2, 9),
            x: Math.random() * (screenW - 200) + 50,
            y: Math.random() * (screenH - 300) + 50,
            rotation: (Math.random() * 20) - 10
        }));
        
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
             let current = prev;
             if (current.length > 25) {
                 const valid = current.filter(w => validateWord(w, config) === 'valid');
                 const others = current.filter(w => validateWord(w, config) !== 'valid');
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
      
      audioService.playScan();
      setGameState(GameState.LOADING);
      await spawnWords(currentLevelConfig, true);
      setGameState(GameState.PLAYING);
      showMessage(t.rescan);
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
    const remainingWords = words.filter(w => w.id !== word.id);
    setWords(remainingWords);

    const result = validateWord(word, currentLevelConfig);

    if (result === 'valid') {
      audioService.playSuccess();
      setScore(s => {
          const newScore = s + 10;
          if (newScore >= currentLevelConfig.targetScore && levelIndex < LEVELS.length - 1) {
              setTimeout(nextLevel, 500); 
          }
          return newScore;
      });
      setFeedback('success');
      showMessage(`+10 ${t.signalVerified}`);
    } else if (result === 'rule_break') {
      audioService.playRuleViolation();
      setScore(s => Math.max(0, s - 2));
      setFeedback('partial_failure');
      showMessage(`-2 ${t.ruleViolation}`);
    } else {
      audioService.playFailure();
      setScore(s => Math.max(0, s - 5));
      setFeedback('failure');
      showMessage(`-5 ${t.noiseError}`);
    }

    setTimeout(() => setFeedback('idle'), 600);

    const validWordsLeft = remainingWords.filter(w => validateWord(w, currentLevelConfig) === 'valid').length;

    if ((remainingWords.length <= 3 || validWordsLeft === 0) && gameState === GameState.PLAYING) {
        spawnWords(currentLevelConfig);
    }
  };

  const showMessage = (msg: string) => {
      setMessage(msg);
      setTimeout(() => setMessage(""), 1500);
  };

  const toggleLanguage = () => {
      setLanguage(prev => prev === 'en' ? 'vi' : 'en');
      audioService.playDragStart(); // Re-use simple blip
  }

  // Dynamic font classes based on language
  const isVietnamese = language === 'vi';
  const bodyFontClass = isVietnamese ? "font-['Space_Mono']" : "font-['VT323']";
  const headerFontClass = isVietnamese ? "pixel-font-vi" : "pixel-font";

  return (
    <div className={`w-full h-screen overflow-hidden bg-[#1a1a2e] relative select-none ${bodyFontClass}`}>
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
        <div>
            <h1 className={`${headerFontClass} text-2xl text-yellow-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]`}>SEMANTIC RADIO</h1>
            <div className="bg-black/50 p-2 mt-2 rounded border border-gray-600 backdrop-blur-sm inline-block">
                <div className="text-blue-300 text-lg uppercase">{t.mission} {currentLevelConfig.level}: {currentLevelConfig.name}</div>
                <div className="w-48 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${Math.min(100, (score / currentLevelConfig.targetScore) * 100)}%` }}
                    />
                </div>
                <div className="text-xs text-gray-400 mt-1 text-right">{score} / {currentLevelConfig.targetScore}</div>
            </div>
        </div>
        <div className="text-right pointer-events-auto flex flex-col items-end">
            <div className="flex gap-4 items-start">
                <button
                    onClick={toggleLanguage}
                    className={`px-3 py-1 bg-gray-800 text-white ${headerFontClass} text-xs border-2 border-gray-600 hover:bg-gray-700 transition-all`}
                >
                    {language === 'en' ? 'LANG: EN' : 'LANG: VI'}
                </button>
                <button 
                    onClick={() => setShowHelp(true)}
                    className={`px-3 py-1 bg-blue-600 text-white ${headerFontClass} text-xs border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all`}
                >
                    ? {t.manual}
                </button>
                <div>
                    <div className={`${headerFontClass} text-sm text-gray-500 mb-1`}>{t.top}: {topScore}</div>
                    <div className={`${headerFontClass} text-5xl text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)]`}>
                        {score}
                    </div>
                </div>
            </div>
            {message && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xl font-bold mt-2 ${message.includes('+') ? 'text-green-400' : message.includes(t.ruleViolation) ? 'text-yellow-400' : 'text-red-400'}`}
                >
                    {message}
                </motion.div>
            )}
        </div>
      </div>

      {/* Controls Bottom Right */}
      {gameState === GameState.PLAYING && !showHelp && (
        <div className="absolute bottom-6 right-6 z-50 pointer-events-auto flex flex-col gap-2 items-end">
            <button
                onClick={handleRegenerate}
                className={`px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg ${headerFontClass} border-4 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 group`}
            >
                <span className="text-xl group-hover:rotate-180 transition-transform duration-300">↺</span> {t.rescan}
            </button>
            <span className="text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">{t.refreshSignal}</span>
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
                t={t}
                isVietnamese={isVietnamese}
            />
        </div>
      </div>

      {/* Help/Manual Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
             <div className="bg-[#1a1a2e] border-4 border-blue-500 p-6 max-w-lg w-full shadow-[0_0_50px_rgba(59,130,246,0.3)] relative">
                <button 
                    onClick={() => setShowHelp(false)}
                    className="absolute top-2 right-2 text-blue-500 hover:text-white font-bold text-xl px-2"
                >
                    X
                </button>
                <h2 className={`${headerFontClass} text-2xl text-blue-400 mb-4 border-b border-blue-800 pb-2`}>{t.manual}</h2>
                
                <div className="space-y-4 text-gray-300">
                    <div className="flex gap-4">
                         <div className="text-4xl">📡</div>
                         <div>
                            <h3 className="text-white font-bold">{t.mission}</h3>
                            <p className="text-sm text-gray-400 whitespace-pre-line">{t.briefingText}</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/30 p-3 border border-gray-700">
                            <div className="text-green-400 font-bold mb-1">{t.validSignal}</div>
                            <div className="text-xs">{t.validDesc}</div>
                            <div className="text-right text-green-500 font-bold mt-1">+10 PTS</div>
                        </div>
                        <div className="bg-black/30 p-3 border border-gray-700">
                            <div className="text-red-400 font-bold mb-1">{t.noiseError}</div>
                            <div className="text-xs">{t.noiseDesc}</div>
                            <div className="text-right text-red-500 font-bold mt-1">-5 PTS</div>
                        </div>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-700/50 p-3 text-sm">
                        <strong className="text-yellow-500">{t.controls}:</strong> {t.controlsDesc}
                    </div>
                </div>

                <button 
                    onClick={() => setShowHelp(false)}
                    className={`w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white ${headerFontClass} text-center border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none`}
                >
                    {t.resume}
                </button>
             </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md"
          >
              <h2 className={`${headerFontClass} text-4xl text-blue-400 mb-6 leading-relaxed whitespace-pre-line`}>{t.missionBriefing}</h2>
              <p className="text-lg text-gray-300 mb-8 text-left bg-black/50 p-6 border border-gray-600 rounded whitespace-pre-line">
                  {t.briefingText}
                  <br/><br/>
                  <span className="text-green-400">MATCH</span> = +10<br/>
                  <span className="text-yellow-400">BAD MATCH</span> = -2<br/>
                  <span className="text-red-400">NOISE</span> = -5
              </p>
              <div className="flex gap-4 justify-center">
                  <button 
                    onClick={startGame}
                    className={`px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xl ${headerFontClass} border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-1 active:shadow-none transition-all`}
                  >
                      {t.startMission}
                  </button>
                  <button 
                      onClick={toggleLanguage}
                      className={`px-4 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xl ${headerFontClass} border-4 border-black transition-all`}
                  >
                      {language === 'en' ? 'EN' : 'VI'}
                  </button>
              </div>
          </motion.div>
        </div>
      )}

      {/* Level Transition Screen */}
      {gameState === GameState.LEVEL_TRANSITION && (
          <div className="absolute inset-0 z-50 bg-green-900/90 flex flex-col items-center justify-center text-center backdrop-blur-md">
               <h2 className={`${headerFontClass} text-4xl text-white mb-4 animate-pulse`}>{t.levelComplete}</h2>
               <div className="text-2xl text-green-300 mb-8">{t.nextFreq}</div>
               <div className="text-xl text-white">+ {LEVELS[levelIndex + 1]?.duration} {t.secAdded}</div>
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
                <h2 className={`${headerFontClass} text-3xl text-red-500 mb-4`}>{t.signalLost}</h2>
                <div className="flex flex-col gap-4 mb-8">
                    <div className="text-2xl text-white">{t.finalScore}: <span className="text-yellow-400">{score}</span></div>
                    <div className="text-xl text-gray-400">{t.levelReached}: {currentLevelConfig.level}</div>
                    {score >= topScore && score > 0 && (
                        <div className="text-green-400 animate-pulse mt-2">{t.newHighScore}</div>
                    )}
                </div>
                <button 
                    onClick={startGame}
                    className={`px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold text-lg ${headerFontClass} border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] active:translate-y-1 active:shadow-none`}
                >
                    {t.reInitialize}
                </button>
            </motion.div>
        </div>
      )}

      {/* Loading State */}
      {gameState === GameState.LOADING && (
           <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center">
               <div className={`${headerFontClass} text-2xl text-white animate-pulse`}>{t.scanning}</div>
           </div>
      )}

      {/* Floating Words Area */}
      <div className="absolute inset-0 overflow-hidden z-20 pointer-events-none">
        <AnimatePresence>
            {words.map((word) => (
                <div key={word.id} className="pointer-events-auto inline-block">
                    <SignalWordItem word={word} onDragEnd={handleWordDrop} isVietnamese={isVietnamese} />
                </div>
            ))}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default App;