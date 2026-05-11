'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Props = {
  open: boolean;
  expiresAt: number;
  onSkip: () => void;
  onWait: () => void;
  onExpire: () => void;
};

export function CooldownModal({ open, expiresAt, onSkip, onWait, onExpire }: Props) {
  const [remaining, setRemaining] = useState(47);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    expiredRef.current = false;

    const tick = () => {
      const secs = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [open, expiresAt, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-paper rounded-2xl p-6 w-full max-w-sm mx-4 mb-8 sm:mb-0 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <h2 className="font-sans text-lg font-semibold text-ink">Slow down!</h2>
            <p className="text-ink-soft text-sm mt-1 mb-5">
              You can press = again in{' '}
              <span className="font-mono font-bold text-alarm tabular-nums">{timeStr}</span>
            </p>
            <div className="flex flex-col gap-2">
              <button
                className="w-full bg-alarm text-paper rounded-full py-3 font-sans font-semibold text-sm hover:bg-alarm/90 transition-colors"
                onClick={onSkip}
              >
                Skip cooldown — 10 credits
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
