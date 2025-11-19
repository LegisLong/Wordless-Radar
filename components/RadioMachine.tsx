import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RuleSet } from '../types';

interface RadioMachineProps {
  onDrop: (item: any) => void;
  feedback: 'idle' | 'success' | 'failure' | 'partial_failure';
  timeLeft: number;
  currentLevel: number;
  rules: RuleSet;
  score: number;
}

export const RadioMachine: React.FC<RadioMachineProps> = ({ feedback, timeLeft, currentLevel, rules, score }) => {
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

  // Format time mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="relative flex flex-col items-center justify-center w-80 h-80">
      
      {/* Level / Rules Sticky Note */}
      <motion.div 
        initial={{ x: -50, opacity: 0, rotate: -5 }}
        animate={{ x: 0, opacity: 1, rotate: -5 }}
        key={currentLevel} // Re-animate on level change
        className="absolute -left-48 top-10 w-48 bg-yellow-100 text-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] transform -rotate-6 z-30 font-mono text-sm border border-gray-400"
      >
        <div className="border-b-2 border-red-500/50 mb-2 pb-1 font-bold text-red-800">
            MISSION: LEVEL {currentLevel}
        </div>
        <ul className="list-disc pl-4 space-y-1 text-xs font-bold text-gray-800">
            <li>{rules.description}</li>
            {rules.excludeChar && <li className="text-red-600">AVOID: "{rules.excludeChar.toUpperCase()}"</li>}
            <li className="text-blue-800">SCORE: {score}</li>
        </ul>
        <div className="absolute -top-3 left-1/2 w-4 h-4 rounded-full bg-red-500/50 shadow-inner" />
      </motion.div>

      {/* Antenna */}
      <motion.div 
        className="absolute -top-12 w-2 h-16 bg-gray-400 border-2 border-black"
        animate={{ 
          rotate: isSuccess ? [0, -10, 10, 0] : 0,
          height: isSuccess ? [64, 80, 64] : 64 
        }}
      />
      <div className={`absolute -top-16 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-black ${timeLeft < 10 ? 'bg-red-600 animate-ping' : 'bg-red-500'}`} />

      {/* Dish/Receiver */}
      <motion.div 
        className={`w-56 h-40 rounded-b-full border-4 border-black relative overflow-hidden mb-[-10px] z-10 transition-colors duration-300 ${
          isSuccess ? 'bg-green-500' : isFailure ? 'bg-red-500' : isPartial ? 'bg-yellow-500' : 'bg-gray-300'
        }`}
        animate={{
            rotate: isSuccess ? 360 : 0
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-black" />
        <div className="absolute top-4 left-0 w-full h-1 bg-black opacity-20" />
        <div className="absolute top-8 left-0 w-full h-1 bg-black opacity-20" />
        <div className="absolute top-12 left-0 w-full h-1 bg-black opacity-20" />
      </motion.div>

      {/* Body */}
      <motion.div 
        className="w-64 h-48 bg-blue-700 border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] flex flex-col items-center p-4 relative z-20"
        animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        {/* Main Screen */}
        <div className="w-full h-14 bg-green-900 border-2 border-black mb-3 flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,_#000_1px)] bg-[length:100%_2px] opacity-20 pointer-events-none" />
            <div className={`font-mono text-green-400 text-xs whitespace-nowrap ${isSuccess || isFailure ? '' : 'animate-marquee'}`}>
               {isSuccess ? "SIGNAL VERIFIED" : isFailure ? "ERROR: INVALID DATA" : isPartial ? "RULE VIOLATION" : "AWAITING INPUT... ... ..."}
            </div>
        </div>

        {/* Timer Screen */}
        <div className="w-full flex justify-between items-end px-1 mb-2">
             <div className="flex flex-col">
                <span className="text-[8px] text-white font-bold pixel-font mb-1">TIMER</span>
                <div className="bg-black border border-gray-600 px-2 py-1 rounded text-red-500 font-mono text-xl tracking-widest shadow-inner">
                    {timeString}
                </div>
             </div>
             
             <div className="flex gap-2">
                 <div className={`w-3 h-3 rounded-full border border-black ${timeLeft % 2 === 0 ? 'bg-yellow-400' : 'bg-yellow-600'}`} />
                 <div className={`w-3 h-3 rounded-full border border-black ${timeLeft % 2 !== 0 ? 'bg-yellow-400' : 'bg-yellow-600'}`} />
             </div>
        </div>

        {/* Knobs */}
        <div className="flex justify-between w-full px-4 mt-auto">
            <div className="w-12 h-12 rounded-full border-2 border-black bg-gray-700 flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                <motion.div 
                    className="w-2 h-6 bg-black" 
                    animate={{ rotate: isSuccess ? 90 : -45 }}
                />
            </div>
             <div className="flex flex-col gap-2 justify-end">
                <div className="w-20 h-3 bg-black opacity-50 rounded-full" />
                <div className="w-20 h-3 bg-black opacity-50 rounded-full" />
             </div>
        </div>
        
      </motion.div>

      {/* Drop Zone Indicator */}
      <div className="absolute inset-0 z-0 rounded-full bg-white opacity-5 animate-pulse pointer-events-none" style={{ scale: 1.6 }} />
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