"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';

const TILES = [
  'TI-84',
  'TI-89',
  'Casio fx-991',
  'Abacus',
  'Slide rule',
  'Calculator with feelings',
  'Real human emotion',
  'A regret',
  'Math itself',
];

type Props = {
  onPass: () => void;
  onCancel?: () => void;
};

export function Captcha({ onPass, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [attempt, setAttempt] = useState(0);
  const [shake, setShake] = useState(false);

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function submit() {
    if (selected.size === 0) return;
    const correctOnly = selected.size === 1 && selected.has(6);
    if (correctOnly) {
      onPass();
      return;
    }
    const next = attempt + 1;
    if (next < 3) {
      setAttempt(next);
      setSelected(new Set());
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      onPass();
    }
  }

  const message =
    attempt === 0
      ? 'Select all squares containing real human emotion.'
      : attempt === 1
      ? 'Hmm, try again. Look more carefully.'
      : 'Are you sure? One more try should do it.';

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
      <motion.div
        animate={shake ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-paper rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🤖</span>
          <h2 className="font-semibold text-ink text-base">I'm not a robot</h2>
        </div>
        <p className="text-sm text-ink-soft mb-4">{message}</p>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {TILES.map((label, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={[
                'aspect-square border-2 rounded-lg p-2 text-xs font-medium transition-all text-center flex items-center justify-center',
                selected.has(i)
                  ? 'border-ai bg-ai/10 text-ink'
                  : 'border-ink/20 bg-[#f0ece4] text-ink-soft hover:border-ink/40',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={selected.size === 0}
            className="flex-1 py-2.5 bg-ink text-paper rounded-full font-semibold text-sm disabled:opacity-40"
          >
            Verify
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 text-sm text-ink-soft border border-ink/20 rounded-full hover:border-ink/40 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Captcha;
