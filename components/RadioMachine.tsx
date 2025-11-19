
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranslationDictionary } from '../types';

interface RadioMachineProps {
  onDrop: (item: any) => void;
  feedback: 'idle' | 'success' | 'failure' | 'partial_failure';
  timeLeft: number;
  t: TranslationDictionary;
}

export const RadioMachine: React.FC<RadioMachineProps> = ({ feedback, timeLeft, t }) => {
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
  
  const fontClass = "font-['VT323',monospace]";

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

      {/* Machine Construction Stack */}
      <div className="flex flex-col items-center relative z-10">
        
        {/* Antenna - Thinner & Sharper - Taller */}
        <div className="flex flex-col items-center -mb-3 z-0 relative translate-y-1">
            <div className={`w-4 h-3 rounded-full border border-black relative z-10 ${timeLeft < 10 ? 'bg-red-600 animate-ping' : 'bg-red-500'}`} />
            <motion.div 
                className="w-1 bg-gray-400 border-x border-black"
                style={{ height: 50 }}
                animate={{ 
                height: isSuccess ? [50, 70, 50] : 50 
                }}
                transition={{ duration: 0.2 }}
            />
        </div>

        {/* Dish/Receiver - Bigger Style (w-64 h-32) */}
        <motion.div 
            className={`w-64 h-32 rounded-b-full border-4 border-gray-800 relative overflow-hidden z-10 shadow-lg
            ${isSuccess ? 'bg-green-500' : isFailure ? 'bg-red-500' : isPartial ? 'bg-yellow-500' : 'bg-slate-400'}
            `}
            animate={{
                rotate: isSuccess ? [0, 40, -20, 0] : 0,
                scale: isSuccess ? [1, 1.05, 1] : 1
            }}
            transition={{ duration: 0.35 }}
        >
            {/* Internal Rings */}
            <div className="absolute inset-0 rounded-b-full border-t-0 border-4 border-black/10 scale-75 origin-top"></div>
            <div className="absolute inset-0 rounded-b-full border-t-0 border-4 border-black/10 scale-50 origin-top"></div>
            <div className="absolute inset-0 rounded-b-full border-t-0 border-4 border-black/10 scale-25 origin-top"></div>
            
            {/* Gloss */}
            <div className="absolute top-0 left-4 w-32 h-10 bg-white/20 rounded-full blur-md"></div>
        </motion.div>

        {/* Body - Bigger (w-64) */}
        <motion.div 
            className="w-64 h-auto bg-slate-700 border-4 border-gray-800 rounded-xl shadow-[0px_8px_0px_0px_rgba(0,0,0,0.3)] flex flex-col p-4 relative z-20 -mt-2"
            animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.3 }}
        >
            {/* Screws */}
            <div className="absolute top-2 left-2 w-1 h-1 bg-gray-900 rounded-full opacity-50"></div>
            <div className="absolute top-2 right-2 w-1 h-1 bg-gray-900 rounded-full opacity-50"></div>
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-gray-900 rounded-full opacity-50"></div>
            <div className="absolute bottom-2 right-2 w-1 h-1 bg-gray-900 rounded-full opacity-50"></div>

            {/* Main Screen */}
            <div className="w-full h-12 bg-black border-2 border-gray-600 rounded-sm mb-2 flex items-center justify-center overflow-hidden relative shadow-inner">
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[length:100%_2px] pointer-events-none" />
                <div className={`text-green-400 text-lg md:text-xl whitespace-nowrap ${fontClass} ${isSuccess || isFailure ? '' : 'animate-marquee'}`}>
                {isSuccess ? t.signalVerified : isFailure ? t.errorInvalid : isPartial ? t.ruleViolation : t.awaitingInput}
                </div>
            </div>

            {/* Info Panel (Timer + Status) */}
            <div className="flex justify-between items-center bg-gray-800/50 p-2 rounded border border-gray-600/50 mb-3">
                <div className="flex flex-col">
                    <span className="text-lg text-gray-400 uppercase tracking-wider">System Clock</span>
                    <div className={`text-red-500 text-3xl leading-none tracking-widest ${fontClass}`}>
                        {timeString}
                    </div>
                </div>
                
                {/* LED Status Lights */}
                <div className="flex gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_5px_currentColor] transition-colors ${timeLeft % 2 === 0 ? 'bg-yellow-400 text-yellow-400' : 'bg-yellow-900 text-yellow-900'}`} />
                    <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_5px_currentColor] transition-colors ${timeLeft % 2 !== 0 ? 'bg-green-400 text-green-400' : 'bg-green-900 text-green-900'}`} />
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-between items-end px-2">
                {/* Dial */}
                <div className="relative w-12 h-12 bg-gray-600 rounded-full border-2 border-gray-900 shadow-md flex items-center justify-center">
                    {/* Dial Tick Marks */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                         <div key={deg} className="absolute w-0.5 h-1.5 bg-gray-800 top-0.5 left-1/2 -translate-x-1/2 origin-[50%_22px]" style={{ transform: `translateX(-50%) rotate(${deg}deg)` }} />
                    ))}
                    <motion.div 
                        className="w-1.5 h-5 bg-black rounded-full origin-bottom absolute top-1" 
                        animate={{ rotate: isSuccess ? 180 : -45 }}
                    />
                </div>

                {/* Speaker Grille */}
                <div className="flex flex-col gap-1 items-end">
                     <div className="w-16 h-0.5 bg-black/60 rounded-full"></div>
                     <div className="w-16 h-0.5 bg-black/60 rounded-full"></div>
                     <div className="w-16 h-0.5 bg-black/60 rounded-full"></div>
                     <span className="text-[10px] text-gray-500 mt-0.5">MODEL-X4</span>
                </div>
            </div>
            
        </motion.div>
      </div>

      {/* Drop Zone Indicator - Big Background Ring */}
      <div className="absolute inset-0 z-0 rounded-full bg-white opacity-5 animate-pulse pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px]" />
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
