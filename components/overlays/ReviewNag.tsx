"use client";
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { on, off, emit } from '@/lib/events';

type Props = { onClose: () => void };

export function ReviewNag({ onClose }: Props) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [phase, setPhase] = useState<'rate' | 'confirm' | 'thanks'>('rate');

  function submit() {
    if (stars === 0) return;
    if (stars < 5) {
      setPhase('confirm');
    } else {
      setPhase('thanks');
      setTimeout(onClose, 2000);
    }
  }

  function sendToLegal() {
    emit('legal.review.sent', { stars });
    onClose();
  }

  function chooseFiveStars() {
    setStars(5);
    setPhase('thanks');
    setTimeout(onClose, 2000);
  }

  const display = hovered || stars;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className="bg-paper rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
      >
        <AnimatePresence mode="wait">
          {phase === 'rate' && (
            <motion.div key="rate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-semibold text-ink mb-1">Enjoying Calculator 2026?</h2>
              <p className="text-sm text-ink-soft mb-5">Your feedback helps us keep the lights on.</p>
              <div className="flex justify-center gap-1 mb-6" role="group" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setStars(n)}
                    className="text-3xl transition-transform active:scale-90"
                    aria-label={`${n} star`}
                  >
                    {n <= display ? '★' : '☆'}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  disabled={stars === 0}
                  onClick={submit}
                  className="w-full py-3 bg-ink text-paper rounded-full font-semibold text-sm disabled:opacity-40"
                >
                  Submit
                </button>
                <button onClick={onClose} className="text-sm text-ink-soft underline">
                  Maybe later
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-4xl mb-3">⚖️</div>
              <h2 className="text-lg font-semibold text-ink mb-2">Are you sure?</h2>
              <p className="text-sm text-ink-soft mb-5">
                Less than 5 stars means your review will be sent to our{' '}
                <strong className="text-alarm">legal team</strong> for review.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={sendToLegal}
                  className="w-full py-3 bg-alarm text-white rounded-full font-semibold text-sm"
                >
                  Send to legal
                </button>
                <button
                  onClick={chooseFiveStars}
                  className="w-full py-3 bg-money text-white rounded-full font-semibold text-sm"
                >
                  Actually, 5 stars ★★★★★
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'thanks' && (
            <motion.div key="thanks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-lg font-semibold text-ink">Thanks!</h2>
              <p className="text-sm text-ink-soft mt-1">Your 5-star review means the world to us.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Mounts as a listener — queue the overlay every 5th calc, max once per day
export function ReviewNagController() {
  const calcCountRef = useRef(0);

  useEffect(() => {
    function handler() {
      calcCountRef.current += 1;
      if (calcCountRef.current % 5 !== 0) return;

      const last = localStorage.getItem('lastReviewNag');
      const today = new Date().toDateString();
      if (last === today) return;

      localStorage.setItem('lastReviewNag', today);
      emit('overlay.open', { key: 'review', props: {} });
    }

    on('calc.success', handler);
    return () => off('calc.success', handler);
  }, []);

  return null;
}

export default ReviewNag;
