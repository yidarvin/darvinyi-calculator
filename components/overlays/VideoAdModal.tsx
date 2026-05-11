"use client";
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/state';

type Phase = 'apology' | 'playing';

const FAKE_ADS = [
  { emoji: '🚗', brand: 'SUV CO.',        color: 'from-blue-400 via-sky-300 to-cyan-400'    },
  { emoji: '💊', brand: 'HEALTH PLUS™',   color: 'from-green-400 via-emerald-300 to-teal-400' },
  { emoji: '🏦', brand: 'MONEYBANK INC.', color: 'from-yellow-400 via-amber-300 to-orange-400' },
  { emoji: '🛋️', brand: 'COUCHCO.',       color: 'from-purple-400 via-violet-300 to-pink-400' },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function VideoAdModal({ open, onClose }: Props) {
  const adFree = useStore((s) => s.flags.adFree);
  const { incrementVideoAdsDismissed, advance, videoAdsDismissed } = useStore();

  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canSkip, setCanSkip] = useState(false);
  const [phase, setPhase] = useState<Phase>(adFree ? 'apology' : 'playing');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ad = FAKE_ADS[round % FAKE_ADS.length];
  const AD_DURATION = 120;
  const SKIP_AFTER = 15;

  // Reset state each time the modal opens
  useEffect(() => {
    if (!open) return;
    const initialPhase: Phase = adFree ? 'apology' : 'playing';
    setRound(0);
    setPhase(initialPhase);
    setTimeLeft(adFree ? 2 : AD_DURATION);
    setCanSkip(false);
  }, [open, adFree]);

  // Apology countdown (2s) before video plays if adFree
  useEffect(() => {
    if (!open || phase !== 'apology') return;
    const t = setTimeout(() => {
      setTimeLeft(AD_DURATION);
      setCanSkip(false);
      setPhase('playing');
    }, 2000);
    return () => clearTimeout(t);
  }, [open, phase]);

  // Skip counter — ticks every 1.2s (not 1.0s — the slow joke)
  useEffect(() => {
    if (!open || phase !== 'playing') return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        const next = t <= 1 ? 0 : t - 1;
        if (AD_DURATION - next >= SKIP_AFTER) setCanSkip(true);
        if (next === 0) clearInterval(intervalRef.current!);
        return next;
      });
    }, 1200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, phase, round]);

  function handleDismiss() {
    const newDismissed = videoAdsDismissed + 1;
    incrementVideoAdsDismissed();
    if (newDismissed >= 2) {
      advance('ai');
    }
    onClose();
  }

  function handleSkip() {
    handleDismiss();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-full max-w-2xl mx-4 flex flex-col gap-4">

            {/* Apology bubble */}
            {phase === 'apology' && (
              <motion.div
                className="text-center bg-paper rounded-xl py-4 px-6 shadow-xl"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-ink-soft italic text-sm">
                  We apologize for these partner messages.
                </p>
              </motion.div>
            )}

            {/* Video placeholder */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden">
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${ad.color}`}
                animate={{ scale: [1, 1.06, 1], x: [0, 8, 0], y: [0, -4, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-5xl mb-2">{ad.emoji}</span>
                <p className="font-bold text-2xl tracking-widest">{ad.brand}</p>
                <p className="text-white/70 text-sm mt-1">
                  {phase === 'playing' && timeLeft > 0
                    ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')} remaining`
                    : 'Thank you for watching'}
                </p>
              </div>

              {/* Skip counter top-right */}
              {phase === 'playing' && (
                <div className="absolute top-3 right-3">
                  {canSkip ? (
                    <button
                      className="bg-white/90 text-ink text-xs font-medium px-3 py-1.5 rounded-full hover:bg-white transition-colors cursor-pointer"
                      onClick={handleSkip}
                    >
                      Skip ad ⤳
                    </button>
                  ) : (
                    <span className="bg-black/50 text-white/80 text-xs px-3 py-1.5 rounded-full font-mono">
                      Skip in {timeLeft - (AD_DURATION - SKIP_AFTER)}s
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VideoAdModal;
