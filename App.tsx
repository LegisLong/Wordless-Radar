
import React, { useState, useEffect, useRef } from 'react';
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
  const [showMenu, setShowMenu] = useState(false);
  const [volume, setVolume] = useState(30); // Default 30% (0.3 gain)
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
    // Pause timer if help or menu is open
    if (gameState === GameState.PLAYING && timeLeft > 0 && !showHelp && !showMenu) {
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
  }, [gameState, timeLeft, showHelp, showMenu]);

  const startGame = async () => {
    audioService.resume(); 
    audioService.playScan(); 

    setWords([]);
    setScore(0);
    setLevelIndex(0);
    setTimeLeft(LEVELS[0].duration);
    setGameState(GameState.LOADING);
    setShowMenu(false);
    await spawnWords(LEVELS[0], true); 
    setGameState(GameState.PLAYING);
  };

  const restartCurrentGame = async () => {
    audioService.playScan();
    // Just restart completely
    startGame();
  }

  const quitToTitle = () => {
    setGameState(GameState.START);
    setWords([]);
    setScore(0);
    setShowMenu(false);
    audioService.playFailure(); // Sound effect for abort
  }

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
        // Determine count based on device width
        const isMobile = window.innerWidth < 768;
        const spawnCount = isMobile ? 15 : 20;

        const newWordsData = await fetchSignalBatch(spawnCount, config.promptContext, config.rules, language);
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const centerX = screenW / 2;
        const centerY = screenH / 2;

        // Approximate Dimensions for boundary checks
        const CARD_WIDTH = 160;
        const CARD_HEIGHT = 60;
        const PADDING = 10; 

        // Helper to find safe position avoiding UI elements and Screen Edges
        const getSafePosition = () => {
            let x = 0, y = 0, valid = false, attempts = 0;
            
            // Screen Boundaries
            const minX = PADDING;
            const maxX = screenW - CARD_WIDTH - PADDING;
            const minY = PADDING + (isMobile ? 50 : 60); // Adjust for top bar
            const maxY = screenH - CARD_HEIGHT - PADDING - (isMobile ? 60 : 0); // Adjust for bottom controls

            // Dynamic Exclusion Zones based on Screen Size
            const centerRadius = isMobile ? 150 : 220; // Increased for bigger radio
            const uiTopLeftW = isMobile ? 200 : 360;
            const uiTopLeftH = isMobile ? 120 : 250; // Increased height for rescan button
            
            const uiTopRightW = isMobile ? 180 : 420;
            const uiTopRightH = isMobile ? 100 : 200;

            while (!valid && attempts < 100) {
                // Generate strictly within screen bounds
                x = Math.random() * (maxX - minX) + minX;
                y = Math.random() * (maxY - minY) + minY;
                valid = true;

                // 1. Center Exclusion (Radio Machine)
                if (Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) < centerRadius) {
                    valid = false;
                } 
                // 2. Top Left Exclusion (Mission Info + Rescan)
                else if (x < uiTopLeftW && y < uiTopLeftH) {
                    valid = false;
                }
                // 3. Top Right Exclusion (Menu/Score)
                else if (x > screenW - uiTopRightW && y < uiTopRightH) {
                    valid = false;
                }
                // 4. Bottom Right Exclusion (Old Rescan Button zone - kept safe just in case)
                else if (x > screenW - 200 && y > screenH - 100) {
                    valid = false;
                }
                // 5. Bottom Center Exclusion (Mobile sticky note area)
                else if (isMobile && y > screenH - 200 && x > centerX - 150 && x < centerX + 150) {
                    valid = false;
                }

                attempts++;
            }

            // Fallback
            if (!valid) {
                x = Math.random() * (maxX - minX) + minX;
                y = Math.random() * (maxY - minY) + minY;
                
                // Hard push from center if inside radius
                const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (dist < centerRadius) {
                     if (x < centerX) x = Math.max(minX, x - 200);
                     else x = Math.min(maxX, x + 200);
                }
            }
            return { x, y };
        };
        
        const formattedWords: SignalWord[] = newWordsData.map((w) => {
            const pos = getSafePosition();
            return {
                ...w,
                id: Math.random().toString(36).substr(2, 9),
                x: pos.x,
                y: pos.y,
                rotation: (Math.random() * 20) - 10
            };
        });

        setWords(prev => {
             if (replace) {
                 return formattedWords;
             }
             let current = prev;
             // Lower cap for mobile if needed, but the spawn count handles generation
             const maxWords = isMobile ? 20 : 25;
             if (current.length > maxWords) {
                 const valid = current.filter(w => validateWord(w, config) === 'valid');
                 const others = current.filter(w => validateWord(w, config) !== 'valid');
                 current = [...valid, ...others.slice(-8)];
             }
             return [...current, ...formattedWords];
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

    // Adjusted for bigger radio size (~1.2x bigger)
    const hitRadius = window.innerWidth < 768 ? 120 : 150;

    if (distance < hitRadius) {
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
      audioService.playDragStart(); 
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      setVolume(val);
      audioService.setVolume(val / 100);
  };

  // Dynamic font classes based on language - UNIFIED VT323
//   const isVietnamese = language === 'vi';
  const bodyFontClass = "font-['VT323',monospace]";
  const headerFontClass = "pixel-font"; // Maps to VT323 via CSS

  return (
    <div className={`w-full h-screen overflow-hidden bg-[#1a1a2e] relative select-none ${bodyFontClass}`}>
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-2 md:p-6 flex justify-between items-start z-50 pointer-events-none">
        {/* Left: Game Title & Progress & Rescan */}
        <div className="pointer-events-auto max-w-[50%] md:max-w-none flex flex-col items-start gap-2">
            <div className="flex flex-col md:block">
                <h1 className={`hidden md:block ${headerFontClass} text-3xl md:text-4xl text-yellow-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]`}>WORDLESS RADAR</h1>
                <div className="bg-black/60 p-2 md:mt-2 rounded border border-gray-600 backdrop-blur-sm inline-block shadow-md">
                    <div className="text-blue-300 text-xl md:text-2xl uppercase truncate">
                        {t.mission} {currentLevelConfig.level}: <span className="block md:inline">{currentLevelConfig.name}</span>
                    </div>
                    <div className="w-28 md:w-48 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${Math.min(100, (score / currentLevelConfig.targetScore) * 100)}%` }}
                        />
                    </div>
                    <div className="text-lg md:text-xl text-gray-400 mt-1 text-right">{score} / {currentLevelConfig.targetScore}</div>
                </div>
            </div>

            {/* Rescan Button - Moved Here (Top Left) */}
            {gameState === GameState.PLAYING && !showHelp && !showMenu && (
                <div className="mt-2">
                    <button
                        onClick={handleRegenerate}
                        className={`px-4 py-2 md:px-5 md:py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold text-2xl md:text-3xl ${headerFontClass} border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 group`}
                    >
                        <span className="text-2xl md:text-3xl group-hover:rotate-180 transition-transform duration-300">↺</span> 
                        {t.rescan}
                    </button>
                </div>
            )}
        </div>

        {/* Right: HUD Control Panel */}
        <div className="pointer-events-auto flex flex-col items-end">
            {/* Control Container */}
            <div className="flex items-stretch bg-slate-900/90 border-2 border-slate-600 rounded-lg backdrop-blur-md shadow-[4px_4px_0_rgba(0,0,0,0.6)] md:shadow-[6px_6px_0_rgba(0,0,0,0.6)] overflow-hidden">
                
                {/* Left Section: Buttons */}
                <div className="flex flex-col border-r border-gray-600">
                    {/* Top Row buttons */}
                    <div className="flex border-b border-gray-600 h-1/2">
                         <button
                            onClick={toggleLanguage}
                            className={`flex-1 px-4 py-2 md:px-5 md:py-3 bg-transparent hover:bg-white/10 text-white ${headerFontClass} text-2xl md:text-3xl border-r border-gray-600 transition-colors`}
                        >
                            {language === 'en' ? 'EN' : 'VI'}
                        </button>
                        <button 
                            onClick={() => setShowHelp(true)}
                            className={`flex-1 px-4 py-2 md:px-5 md:py-3 bg-transparent hover:bg-white/10 text-blue-300 ${headerFontClass} text-2xl md:text-3xl transition-colors`}
                        >
                            ?
                        </button>
                    </div>
                    
                    {/* Bottom Row: Pause/Settings Button */}
                    <button 
                        onClick={() => setShowMenu(true)}
                        className={`flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-black hover:text-black ${headerFontClass} text-2xl md:text-3xl font-bold py-2 md:py-3 transition-colors`}
                    >
                        <span className="font-sans font-black tracking-tighter text-xl md:text-2xl">||</span>
                        <span className="hidden md:inline">{t.menu}</span>
                    </button>
                </div>

                {/* Right Section: Score */}
                <div className="flex flex-col items-center justify-center px-4 md:px-6 py-2 md:py-3 min-w-[90px] md:min-w-[120px] bg-black/40">
                    <div className={`${headerFontClass} text-xl md:text-2xl text-gray-400 tracking-widest`}>{t.top}</div>
                    <div className={`${headerFontClass} text-xl md:text-2xl text-yellow-500`}>{topScore}</div>
                    <div className="w-full h-px bg-gray-700 my-1"></div>
                    <div className={`${headerFontClass} text-4xl md:text-5xl text-white leading-none`}>
                        {score}
                    </div>
                </div>
            </div>

            {/* Feedback Messages */}
            <div className="h-8 mt-2 min-w-[120px] md:min-w-[200px] flex justify-end">
                {message && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className={`text-lg md:text-2xl font-bold px-3 py-1 bg-black/80 border-l-4 rounded shadow-sm ${message.includes('+') ? 'border-green-500 text-green-400' : message.includes(t.ruleViolation) ? 'border-yellow-500 text-yellow-400' : 'border-red-500 text-red-400'}`}
                    >
                        {message}
                    </motion.div>
                )}
            </div>
        </div>
      </div>
      
      {/* Mission Note Overlay - Placed here to control positioning relative to screen */}
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-end items-center md:justify-center md:items-center">
          <AnimatePresence mode="wait">
            {gameState === GameState.PLAYING && (
                 <motion.div 
                    initial={{ opacity: 0, rotate: -5, y: 50 }}
                    animate={{ opacity: 1, rotate: -3, y: 0 }}
                    exit={{ opacity: 0 }}
                    key={currentLevelConfig.level}
                    className={`
                        pointer-events-auto
                        mb-24 md:mb-0 /* Mobile: Bottom positioning with spacing */
                        md:mr-[35rem] md:-mt-10 /* Desktop: Positioned to the left of center */
                        w-72 md:w-80 bg-yellow-100 text-black p-4 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] border border-gray-400
                        text-xl md:text-2xl ${bodyFontClass}
                        md:-rotate-6
                    `}
                  >
                    <div className="border-b border-red-500/50 mb-2 pb-1 font-bold text-red-800 uppercase text-2xl md:text-3xl">
                        {t.mission}: {currentLevelConfig.level}
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-lg md:text-xl font-bold text-gray-800 leading-tight">
                        <li>{currentLevelConfig.rules.description}</li>
                        {currentLevelConfig.rules.excludeChar && <li className="text-red-600">NO: "{currentLevelConfig.rules.excludeChar.toUpperCase()}"</li>}
                        <li className="text-blue-800 uppercase pt-2 text-xl md:text-2xl">{t.score}: {score}</li>
                    </ul>
                    <div className="absolute -top-2 left-1/2 w-3 h-3 rounded-full bg-red-500/50 shadow-inner" />
                  </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* Center Radio */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div ref={radioRef} className="pointer-events-auto transform scale-75 md:scale-100 transition-transform origin-center">
            <RadioMachine 
                feedback={feedback} 
                onDrop={() => {}} 
                timeLeft={timeLeft}
                t={t}
            />
        </div>
      </div>

      {/* Settings Menu - 2x BIGGER */}
      {showMenu && (
        <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#2d2d44] border-4 border-gray-400 p-6 md:p-10 max-w-xl md:max-w-2xl w-full shadow-[8px_8px_0px_rgba(0,0,0,1)] relative"
            >
                <button 
                    onClick={() => setShowMenu(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white font-bold text-2xl md:text-4xl px-4"
                >
                    X
                </button>
                
                <h2 className={`${headerFontClass} text-5xl md:text-6xl text-white mb-8 text-center border-b-2 border-gray-600 pb-4`}>
                    {t.settings}
                </h2>

                <div className="space-y-6 md:space-y-8">
                    {/* Volume Control */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                           <label className={`block text-yellow-400 ${headerFontClass} text-2xl md:text-3xl`}>
                              {t.volume}
                           </label>
                           <span className={`${headerFontClass} text-white text-2xl md:text-3xl`}>{volume}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={volume} 
                            onChange={handleVolumeChange}
                            className="w-full h-6 bg-black rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                        />
                    </div>

                    {/* Language Toggle in Menu */}
                    <div className="flex justify-between items-center bg-black/30 p-4 rounded border border-gray-600">
                        <span className={`text-gray-300 ${headerFontClass} text-2xl md:text-3xl`}>LANGUAGE</span>
                        <button 
                            onClick={toggleLanguage}
                            className={`px-6 py-2 bg-gray-700 text-white ${headerFontClass} text-xl md:text-2xl border border-gray-500 hover:bg-gray-600`}
                        >
                            {language === 'en' ? 'ENGLISH' : 'TIẾNG VIỆT'}
                        </button>
                    </div>

                    <div className="h-px bg-gray-600 my-6" />

                    {/* Game Controls */}
                    <div className="grid grid-cols-1 gap-4">
                         <button 
                            onClick={restartCurrentGame}
                            className={`w-full py-4 bg-blue-700 hover:bg-blue-600 text-white ${headerFontClass} text-2xl md:text-3xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none`}
                        >
                            {t.restart}
                        </button>
                        
                        <button 
                            onClick={quitToTitle}
                            className={`w-full py-4 bg-red-800 hover:bg-red-700 text-white ${headerFontClass} text-2xl md:text-3xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none`}
                        >
                            {t.quit}
                        </button>
                    </div>
                </div>

                <button 
                    onClick={() => setShowMenu(false)}
                    className={`w-full mt-8 py-4 bg-gray-200 hover:bg-white text-black font-bold ${headerFontClass} text-2xl md:text-3xl border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none`}
                >
                    {t.close}
                </button>
            </motion.div>
        </div>
      )}

      {/* Help/Manual Modal - 1.3x BIGGER */}
      {showHelp && (
        <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
             <div className="bg-[#1a1a2e] border-4 border-blue-500 p-6 md:p-8 max-w-xl md:max-w-2xl w-full shadow-[0_0_50px_rgba(59,130,246,0.3)] relative overflow-y-auto max-h-[90vh]">
                <button 
                    onClick={() => setShowHelp(false)}
                    className="absolute top-2 right-2 text-blue-500 hover:text-white font-bold text-2xl md:text-3xl px-2"
                >
                    X
                </button>
                <h2 className={`${headerFontClass} text-4xl md:text-5xl text-blue-400 mb-6 border-b border-blue-800 pb-2`}>{t.manual}</h2>
                
                <div className="space-y-6 text-gray-300">
                    <div className="flex gap-4">
                         <div className="text-5xl">📡</div>
                         <div>
                            <h3 className="text-white font-bold text-3xl md:text-4xl mb-1">{t.mission}</h3>
                            <p className="text-xl md:text-2xl text-gray-400 whitespace-pre-line leading-relaxed">{t.briefingText}</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-black/30 p-4 border border-gray-700">
                            <div className="text-green-400 font-bold mb-2 text-lg md:text-xl">{t.validSignal}</div>
                            <div className="text-base md:text-lg leading-tight">{t.validDesc}</div>
                            <div className="text-right text-green-500 font-bold mt-2 text-lg md:text-xl">+10 PTS</div>
                        </div>
                        <div className="bg-black/30 p-4 border border-gray-700">
                            <div className="text-red-400 font-bold mb-2 text-lg md:text-xl">{t.noiseError}</div>
                            <div className="text-base md:text-lg leading-tight">{t.noiseDesc}</div>
                            <div className="text-right text-red-500 font-bold mt-2 text-lg md:text-xl">-5 PTS</div>
                        </div>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 text-lg md:text-xl">
                        <strong className="text-yellow-500">{t.controls}:</strong> {t.controlsDesc}
                    </div>
                </div>

                <button 
                    onClick={() => setShowHelp(false)}
                    className={`w-full mt-8 py-4 bg-blue-600 hover:bg-blue-500 text-white ${headerFontClass} text-2xl md:text-3xl text-center border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none`}
                >
                    {t.resume}
                </button>
             </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-center p-4 md:p-8 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full"
          >
              <h2 className={`${headerFontClass} text-5xl md:text-6xl text-blue-400 mb-6 leading-relaxed whitespace-pre-line`}>{t.missionBriefing}</h2>
              <p className="text-base md:text-xl text-gray-300 mb-8 text-left bg-black/50 p-6 border border-gray-600 rounded whitespace-pre-line">
                  {t.briefingText}
                  <br/><br/>
                  <span className="text-green-400">MATCH</span> = +10<br/>
                  <span className="text-yellow-400">BAD MATCH</span> = -2<br/>
                  <span className="text-red-400">NOISE</span> = -5
              </p>
              <div className="flex gap-4 justify-center">
                  <button 
                    onClick={startGame}
                    className={`px-6 py-3 md:px-8 md:py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xl md:text-2xl ${headerFontClass} border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-1 active:shadow-none transition-all`}
                  >
                      {t.startMission}
                  </button>
                  <button 
                      onClick={toggleLanguage}
                      className={`px-3 py-3 md:px-4 md:py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xl md:text-2xl ${headerFontClass} border-4 border-black transition-all`}
                  >
                      {language === 'en' ? 'EN' : 'VI'}
                  </button>
              </div>
          </motion.div>
        </div>
      )}

      {/* Level Transition Screen */}
      {gameState === GameState.LEVEL_TRANSITION && (
          <div className="absolute inset-0 z-50 bg-green-900/90 flex flex-col items-center justify-center text-center backdrop-blur-md p-4">
               <h2 className={`${headerFontClass} text-4xl md:text-6xl text-white mb-4 animate-pulse`}>{t.levelComplete}</h2>
               <div className="text-2xl md:text-4xl text-green-300 mb-8">{t.nextFreq}</div>
               <div className="text-xl md:text-3xl text-white">+ {LEVELS[levelIndex + 1]?.duration} {t.secAdded}</div>
          </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center p-4 md:p-8 backdrop-blur-sm">
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="border-4 border-white p-6 md:p-8 bg-[#1a1a2e] w-full max-w-md"
            >
                <h2 className={`${headerFontClass} text-4xl md:text-5xl text-red-500 mb-4`}>{t.signalLost}</h2>
                <div className="flex flex-col gap-4 mb-8">
                    <div className="text-2xl md:text-3xl text-white">{t.finalScore}: <span className="text-yellow-400">{score}</span></div>
                    <div className="text-xl md:text-2xl text-gray-400">{t.levelReached}: {currentLevelConfig.level}</div>
                    {score >= topScore && score > 0 && (
                        <div className="text-green-400 animate-pulse mt-2">{t.newHighScore}</div>
                    )}
                </div>
                <button 
                    onClick={startGame}
                    className={`px-6 py-3 md:px-8 md:py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xl md:text-2xl ${headerFontClass} border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] active:translate-y-1 active:shadow-none`}
                >
                    {t.reInitialize}
                </button>
            </motion.div>
        </div>
      )}

      {/* Loading State */}
      {gameState === GameState.LOADING && (
           <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center">
               <div className={`${headerFontClass} text-2xl md:text-4xl text-white animate-pulse`}>{t.scanning}</div>
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
