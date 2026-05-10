"use client";
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/state';

type Phase = 'apology' | 'playing' | 'watch-more';

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
  const { addCredits, incrementVideoAdsDismissed, advance, videoAdsDismissed } = useStore();

  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [canSkip, setCanSkip] = useState(false);
  const [phase, setPhase] = useState<Phase>(adFree ? 'apology' : 'playing');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ad = FAKE_ADS[round % FAKE_ADS.length];
  const skipDuration = 15 + round * 3;

  // Reset state each time the modal opens
  useEffect(() => {
    if (!open) return;
    const initialPhase: Phase = adFree ? 'apology' : 'playing';
    setRound(0);
    setPhase(initialPhase);
    setTimeLeft(adFree ? 2 : 15); // round 0 always starts at 15s
    setCanSkip(false);
  }, [open, adFree]);

  // Apology countdown (2s) before video plays if adFree
  useEffect(() => {
    if (!open || phase !== 'apology') return;
    const t = setTimeout(() => {
      setTimeLeft(skipDuration);
      setCanSkip(false);
      setPhase('playing');
    }, 2000);
    return () => clearTimeout(t);
  }, [open, phase, skipDuration]);

  // Skip counter — ticks every 1.2s (not 1.0s — the slow joke)
  useEffect(() => {
    if (!open || phase !== 'playing') return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setCanSkip(true);
          return 0;
        }
        return t - 1;
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
    setPhase('watch-more');
  }

  function handleWatchFull() {
    addCredits(1);
    setPhase('watch-more');
  }

  function handleWatchMore() {
    const nextRound = round + 1;
    setRound(nextRound);
    const nextDuration = 15 + nextRound * 3;
    setTimeLeft(nextDuration);
    setCanSkip(false);
    setPhase('playing');
  }

  function handleMaybeLater() {
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
            {phase !== 'watch-more' && (
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
                      ? `0:${String(timeLeft).padStart(2, '0')} remaining`
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
                        Skip in {timeLeft}s
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            {phase === 'playing' && (
              <div className="flex justify-center">
                <button
                  className="text-white/70 text-sm hover:text-white transition-colors underline underline-offset-2"
                  onClick={handleWatchFull}
                >
                  Watch fully → +1 credit
                </button>
              </div>
            )}

            {/* Watch more prompt */}
            {phase === 'watch-more' && (
              <motion.div
                className="bg-paper rounded-2xl p-6 shadow-2xl text-center"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              >
                <p className="text-2xl mb-2">🎬</p>
                <h2 className="font-semibold text-ink text-base mb-1">
                  Watch 2 more for +3 credits
                </h2>
                <p className="text-ink-soft text-xs mb-5 italic">
                  Each ad supports our mission of helping you do math.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    className="w-full bg-ink text-paper rounded-full py-3 font-semibold text-sm hover:bg-ink/80 transition-colors"
                    onClick={handleWatchMore}
                  >
                    Watch
                  </button>
                  <button
                    className="w-full text-ink-soft text-sm py-2 hover:text-ink transition-colors"
                    onClick={handleMaybeLater}
                  >
                    Maybe later
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VideoAdModal;
