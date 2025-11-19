
import React, { useState } from 'react';
import { motion, useDragControls, Variants } from 'framer-motion';
import { SignalWord as SignalWordType } from '../types';
import { audioService } from '../services/audioService';

interface Props {
  word: SignalWordType;
  onDragEnd: (id: string, x: number, y: number, r: number) => void;
}

const glitchVariants: Variants = {
  dragging: {
    textShadow: [
      "2px 0px 0px #00ffea, -2px 0px 0px #ff00ea",
      "-2px 0px 0px #00ffea, 2px 0px 0px #ff00ea",
      "0px 2px 0px #00ffea, 0px -2px 0px #ff00ea"
    ],
    x: [0, -1, 1, -1, 0],
    transition: {
      repeat: Infinity,
      duration: 0.2
    }
  },
  idle: {
    textShadow: "0 0 2px rgba(34, 211, 238, 0.5)",
    x: 0
  }
};

export const SignalWordItem: React.FC<Props> = ({ word, onDragEnd }) => {
  const controls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
    audioService.playDragStart();
  };

  return (
    <motion.div
      drag
      dragControls={controls}
      dragMomentum={false}
      dragElastic={0.1}
      initial={{ x: word.x, y: word.y, rotate: word.rotation, scale: 0, opacity: 0 }}
      animate={{ 
        scale: isDragging ? 1.15 : 1, 
        opacity: 1,
        rotate: isDragging ? 0 : word.rotation,
        zIndex: isDragging ? 100 : 1
      }}
      whileHover={{ scale: 1.05, cursor: 'grab', zIndex: 50 }}
      whileDrag={{ cursor: 'grabbing', zIndex: 100 }}
      onDragStart={handleDragStart}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        audioService.playDragEnd();
        const element = event.target as HTMLElement;
        const rect = element.getBoundingClientRect();
        onDragEnd(word.id, rect.x + rect.width / 2, rect.y + rect.height / 2, 0);
      }}
      className={`
        absolute px-3 py-1.5
        font-bold text-base select-none
        flex items-center justify-center
        transition-all duration-200
        border backdrop-blur-sm
        ${isDragging ? 'border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.8)] bg-black/90' : 'border-cyan-600 shadow-[0_0_6px_rgba(6,182,212,0.4)] bg-black/70'}
      `}
      style={{
        left: 0,
        top: 0,
        color: '#22d3ee', // Cyan-400
        fontFamily: '"VT323", monospace',
        // Retro scanline effect
        backgroundImage: 'repeating-linear-gradient(transparent 0px, transparent 2px, rgba(34, 211, 238, 0.1) 3px)',
      }}
    >
      {/* Corner accents for tech look */}
      <div className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute -bottom-[1px] -left-[1px] w-1.5 h-1.5 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute -bottom-[1px] -right-[1px] w-1.5 h-1.5 border-b-2 border-r-2 border-cyan-400" />

      {/* Ghost/Trail Effect when dragging */}
      {isDragging && (
        <motion.span
            className="absolute whitespace-nowrap opacity-50 pointer-events-none z-0 blur-[1px]"
            initial={{ x: 0, y: 0 }}
            animate={{ x: -4, y: -4 }}
            style={{ color: '#0891b2' }}
        >
            {word.text}
        </motion.span>
      )}

      <motion.span 
        className="relative z-10 tracking-wider"
        variants={glitchVariants}
        animate={isDragging ? "dragging" : "idle"}
      >
        {word.text.toUpperCase()}
      </motion.span>
    </motion.div>
  );
};