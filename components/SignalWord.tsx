import React, { useState } from 'react';
import { motion, useDragControls, Variants } from 'framer-motion';
import { SignalWord as SignalWordType } from '../types';

interface Props {
  word: SignalWordType;
  onDragEnd: (id: string, x: number, y: number, r: number) => void;
}

const glitchVariants: Variants = {
  dragging: {
    textShadow: [
      "2px 0px 0px #ff0000, -2px 0px 0px #0000ff",
      "-2px 0px 0px #ff0000, 2px 0px 0px #0000ff",
      "0px 2px 0px #ff0000, 0px -2px 0px #0000ff"
    ],
    x: [0, -1, 1, -1, 0],
    transition: {
      repeat: Infinity,
      duration: 0.2
    }
  },
  idle: {
    textShadow: "none",
    x: 0
  }
};

export const SignalWordItem: React.FC<Props> = ({ word, onDragEnd }) => {
  const controls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      drag
      dragControls={controls}
      dragMomentum={false}
      dragElastic={0.1} // Tighter control
      initial={{ x: word.x, y: word.y, rotate: word.rotation, scale: 0, opacity: 0 }}
      animate={{ 
        scale: isDragging ? 1.15 : 1, 
        opacity: 1,
        rotate: isDragging ? 0 : word.rotation, // Straighten when dragging for readability
        zIndex: isDragging ? 100 : 1
      }}
      whileHover={{ scale: 1.05, cursor: 'grab', zIndex: 50 }}
      whileDrag={{ cursor: 'grabbing', zIndex: 100 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        const element = event.target as HTMLElement;
        const rect = element.getBoundingClientRect();
        onDragEnd(word.id, rect.x + rect.width / 2, rect.y + rect.height / 2, 0);
      }}
      className={`
        absolute px-4 py-2 
        border-2 border-black 
        font-bold text-lg select-none
        flex items-center justify-center
        transition-colors duration-200
        bg-purple-300 text-purple-900
        ${isDragging ? 'shadow-[10px_10px_0px_rgba(0,0,0,0.4)] border-white' : 'shadow-[4px_4px_0px_rgba(0,0,0,1)]'}
      `}
      style={{
        left: 0,
        top: 0,
      }}
    >
      {/* Ghost/Trail Effect when dragging */}
      {isDragging && (
        <motion.span
            className="absolute whitespace-nowrap opacity-40 pointer-events-none z-0"
            initial={{ x: 0, y: 0 }}
            animate={{ x: -6, y: -6 }}
            style={{ color: '#164e63' }}
        >
            {word.text}
        </motion.span>
      )}

      <motion.span 
        className="font-mono relative z-10"
        variants={glitchVariants}
        animate={isDragging ? "dragging" : "idle"}
      >
        {word.text}
      </motion.span>
    </motion.div>
  );
};