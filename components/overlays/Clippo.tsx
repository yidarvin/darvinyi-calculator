"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useAnimation } from 'framer-motion';
import { useStore } from '@/lib/state';

const HINTS = [
  "It looks like you're trying to add two numbers. Want help?",
  "Did you mean to subtract instead?",
  "I notice you've been calculating a lot. Have you considered an LLM?",
  "Hot tip: pressing = costs credits! Want a tip?",
  "Have you tried our Enterprise plan?",
  "I'm trained on 47 trillion math problems. Just saying.",
];

const HOME = () => ({
  x: typeof window !== 'undefined' ? window.innerWidth - 120 : 200,
  y: typeof window !== 'undefined' ? window.innerHeight - 200 : 400,
});

export function Clippo() {
  const signupCompleted = useStore((s) => s.flags.signupCompleted);
  const [hint, setHint] = useState<string | null>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const controls = useAnimation();
  const dragStartPos = useRef({ x: 0, y: 0 });
  const x = useMotionValue(HOME().x);
  const y = useMotionValue(HOME().y);

  const goHome = useCallback(() => {
    const h = HOME();
    controls.start({ x: h.x, y: h.y, transition: { type: 'spring', stiffness: 200, damping: 22 } });
    x.set(h.x);
    y.set(h.y);
  }, [controls, x, y]);

  // Hint rotation
  useEffect(() => {
    if (!signupCompleted) return;
    const id = setInterval(() => {
      const msg = HINTS[Math.floor(Math.random() * HINTS.length)];
      setHint(msg);
      setTimeout(() => setHint(null), 6000);
    }, 30_000);
    return () => clearInterval(id);
  }, [signupCompleted]);

  // Googly eyes follow cursor
  useEffect(() => {
    if (!signupCompleted) return;
    function onMouseMove(e: MouseEvent) {
      const cx = x.get() + 48;
      const cy = y.get() + 48;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const max = 3;
      setEyeOffset({
        x: dist > 0 ? (dx / dist) * Math.min(max, dist * 0.05) : 0,
        y: dist > 0 ? (dy / dist) * Math.min(max, dist * 0.05) : 0,
      });
    }
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [signupCompleted, x, y]);

  if (!signupCompleted) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      animate={controls}
      style={{ x, y, position: 'fixed', zIndex: 50 }}
      className="w-24 h-24 grid place-items-center cursor-grab active:cursor-grabbing select-none"
      onDragStart={() => {
        dragStartPos.current = { x: x.get(), y: y.get() };
      }}
      onDragEnd={() => {
        setTimeout(goHome, 5000);
      }}
    >
      {/* Paperclip body */}
      <div className="relative w-16 h-16 text-5xl flex items-center justify-center">
        <span>📎</span>
        {/* Googly eyes */}
        <div className="absolute top-1 left-4 flex gap-1 pointer-events-none">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-white border border-ink/30 flex items-center justify-center"
            >
              <div
                className="w-2 h-2 rounded-full bg-ink"
                style={{
                  transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {hint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute right-full mr-2 bottom-2 w-56 bg-paper border-2 border-ink rounded-lg p-2 text-xs shadow-lg"
        >
          {hint}
        </motion.div>
      )}
    </motion.div>
  );
}

export default Clippo;
