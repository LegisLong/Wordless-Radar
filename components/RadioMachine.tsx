
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RuleSet, TranslationDictionary } from '../types';

interface RadioMachineProps {
  onDrop: (item: any) => void;
  feedback: 'idle' | 'success' | 'failure' | 'partial_failure';
  timeLeft: number;
  currentLevel: number;
  rules: RuleSet;
  score: number;
  t: TranslationDictionary;
  isVietnamese: boolean;
}

export const RadioMachine: React.FC<RadioMachineProps> = ({ feedback, timeLeft, currentLevel, rules, score, t, isVietnamese }) => {
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (feedback === 'failure' || feedback === 'partial_failure') {
      setShake(1);
      const t = setTimeout(() => setShake(0), 500);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const isSuccess = feedback === 'success';
  const isFailure = feedback === 'failure';
  const isPartial = feedback === 'partial_failure';
  
  const fontClass = isVietnamese ? "font-['Space_Mono']" : "font-mono";

  // Format time mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="relative flex flex-col items-center justify-center">
      
      {/* SUCCESS ANIMATION OVERLAYS */}
      <AnimatePresence>
        {isSuccess && (
          <>
            {/* Bright Flash Background */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.8, 0], scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 rounded-full bg-green-400/40 blur-2xl z-0 pointer-events-none"
            />
            {/* Expanding Shockwave Ring */}
            <motion.div
                initial={{ scale: 0.5, opacity: 1, borderWidth: "8px" }}
                animate={{ scale: 1.6, opacity: 0, borderWidth: "0px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border-green-300 z-50 pointer-events-none"
                style={{ borderStyle: "solid", borderColor: "#86efac" }}
            />
            {/* Particle Burst */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                    animate={{ 
                        opacity: 0, 
                        x: Math.cos(i * 60 * (Math.PI / 180)) * 120, 
                        y: Math.sin(i * 60 * (Math.PI / 180)) * 120,
                        scale: 1
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute w-2 h-2 bg-green-300 rounded-full z-50 pointer-events-none top-1/2 left-1/2"
                />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Level / Rules Sticky Note - Adjusted for compact size */}
      <motion.div 
        initial={{ opacity: 0, rotate: -5 }}
        animate={{ opacity: 1, rotate: -3 }}
        key={currentLevel}
        className={`
            absolute z-0
            w-40 bg-yellow-100 text-black p-2 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] border border-gray-400
            text-[10px] ${fontClass}
            /* Mobile: Position below */
            top-[95%] left-1/2 -translate-x-1/2
            /* Desktop: Position to left */
            md:top-10 md:left-[-10rem] md:translate-x-0 md:-rotate-6
        `}
      >
        <div className="border-b border-red-500/50 mb-1 pb-1 font-bold text-red-800 uppercase text-[10px]">
            {t.mission}: {currentLevel}
        </div>
        <ul className="list-disc pl-3 space-y-0.5 text-[9px] font-bold text-gray-800 leading-tight">
            <li>{rules.description}</li>
            {rules.excludeChar && <li className="text-red-600">NO: "{rules.excludeChar.toUpperCase()}"</li>}
            <li className="text-blue-800 uppercase pt-1">{t.score}: {score}</li>
        </ul>
        <div className="absolute -top-2 left-1/2 w-2 h-2 rounded-full bg-red-500/50 shadow-inner" />
      </motion.div>

      {/* Machine Construction Stack */}
      <div className="flex flex-col items-center relative z-10">
        
        {/* Antenna - Thinner & Sharper */}
        <div className="flex flex-col items-center -mb-3 z-0 relative translate-y-1">
            <div className={`w-2 h-2 rounded-full border border-black relative z-10 ${timeLeft < 10 ? 'bg-red-600 animate-ping' : 'bg-red-500'}`} />
            <motion.div 
                className="w-1 bg-gray-400 border-x border-black"
                style={{ height: 40 }}
                animate={{ 
                height: isSuccess ? [40, 60, 40] : 40 
                }}
                transition={{ duration: 0.2 }}
            />
        </div>

        {/* Dish/Receiver - Compact Radar Style */}
        <motion.div 
            className={`w-48 h-24 rounded-b-full border-4 border-gray-800 relative overflow-hidden z-10 shadow-lg
            ${isSuccess ? 'bg-green-500' : isFailure ? 'bg-red-500' : isPartial ? 'bg-yellow-500' : 'bg-gray-300'}
            `}
            animate={{
                rotate: isSuccess ? [0, 5, -5, 0] : 0,
                scale: isSuccess ? [1, 1.05, 1] : 1
            }}
            transition={{ duration: 0.3 }}
        >
            {/* Internal Rings */}
            <div className="absolute inset-0 rounded-b-full border-t-0 border-4 border-black/10 scale-75 origin-top"></div>
            <div className="absolute inset-0 rounded-b-full border-t-0 border-4 border-black/10 scale-50 origin-top"></div>
            <div className="absolute inset-0 rounded-b-full border-t-0 border-4 border-black/10 scale-25 origin-top"></div>
            
            {/* Gloss */}
            <div className="absolute top-0 left-4 w-32 h-10 bg-white/20 rounded-full blur-md"></div>
        </motion.div>

        {/* Body - Compact & Detailed */}
        <motion.div 
            className="w-48 h-auto bg-slate-700 border-4 border-gray-800 rounded-xl shadow-[0px_8px_0px_0px_rgba(0,0,0,0.3)] flex flex-col p-3 relative z-20 -mt-2"
            animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.3 }}
        >
            {/* Screws */}
            <div className="absolute top-2 left-2 w-1 h-1 bg-gray-900 rounded-full opacity-50"></div>
            <div className="absolute top-2 right-2 w-1 h-1 bg-gray-900 rounded-full opacity-50"></div>
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-gray-900 rounded-full opacity-50"></div>
            <div className="absolute bottom-2 right-2 w-1 h-1 bg-gray-900 rounded-full opacity-50"></div>

            {/* Main Screen */}
            <div className="w-full h-10 bg-black border-2 border-gray-600 rounded-sm mb-2 flex items-center justify-center overflow-hidden relative shadow-inner">
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[length:100%_2px] pointer-events-none" />
                <div className={`text-green-400 text-[10px] md:text-xs whitespace-nowrap ${fontClass} ${isSuccess || isFailure ? '' : 'animate-marquee'}`}>
                {isSuccess ? t.signalVerified : isFailure ? t.errorInvalid : isPartial ? t.ruleViolation : t.awaitingInput}
                </div>
            </div>

            {/* Info Panel (Timer + Status) */}
            <div className="flex justify-between items-center bg-gray-800/50 p-1.5 rounded border border-gray-600/50 mb-3">
                <div className="flex flex-col">
                    <span className="text-[7px] text-gray-400 uppercase tracking-wider">System Clock</span>
                    <div className={`text-red-500 text-base leading-none tracking-widest ${fontClass}`}>
                        {timeString}
                    </div>
                </div>
                
                {/* LED Status Lights */}
                <div className="flex gap-1.5">
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] transition-colors ${timeLeft % 2 === 0 ? 'bg-yellow-400 text-yellow-400' : 'bg-yellow-900 text-yellow-900'}`} />
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] transition-colors ${timeLeft % 2 !== 0 ? 'bg-green-400 text-green-400' : 'bg-green-900 text-green-900'}`} />
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-between items-end px-1">
                {/* Dial */}
                <div className="relative w-10 h-10 bg-gray-600 rounded-full border-2 border-gray-900 shadow-md flex items-center justify-center">
                    {/* Dial Tick Marks */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                         <div key={deg} className="absolute w-0.5 h-1 bg-gray-800 top-0.5 left-1/2 -translate-x-1/2 origin-[50%_18px]" style={{ transform: `translateX(-50%) rotate(${deg}deg)` }} />
                    ))}
                    <motion.div 
                        className="w-1 h-4 bg-black rounded-full origin-bottom absolute top-1" 
                        animate={{ rotate: isSuccess ? 180 : -45 }}
                    />
                </div>

                {/* Speaker Grille */}
                <div className="flex flex-col gap-1 items-end">
                     <div className="w-12 h-0.5 bg-black/60 rounded-full"></div>
                     <div className="w-12 h-0.5 bg-black/60 rounded-full"></div>
                     <div className="w-12 h-0.5 bg-black/60 rounded-full"></div>
                     <span className="text-[6px] text-gray-500 mt-0.5">MODEL-X4</span>
                </div>
            </div>
            
        </motion.div>
      </div>

      {/* Drop Zone Indicator - Reduced size */}
      <div className="absolute inset-0 z-0 rounded-full bg-white opacity-5 animate-pulse pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px]" />
    </div>
  );
};

// CSS for marquee
const style = document.createElement('style');
style.innerHTML = `
@keyframes marquee {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
.animate-marquee {
  animation: marquee 5s linear infinite;
}
`;
document.head.appendChild(style);
