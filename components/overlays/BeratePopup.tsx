"use client";
import { motion } from 'framer-motion';
import { useState } from 'react';

export type BerateContext = {
  amount: number;
  reason: 'subscribe' | 'iou-payoff' | 'ad-free' | 'top-up';
  onAccept: () => void;
  onCancel: () => void;
};

const COPY = {
  level1: {
    title: 'WAIT. STOP.',
    body: [
      'You were about to pay real money for a **calculator**.',
      'Every phone, every laptop, every microwave has one.',
      "Your spouse's calculator works. Math works.",
      '**We are not charging you. You\'re welcome.**',
    ],
    primary: "I know. I'm sorry.",
    secondary: 'Charge me anyway',
  },
  level2: {
    title: 'ARE YOU SERIOUS.',
    body: [
      'We told you. The calculator on your phone works fine.',
      'Pressing this button again is a choice.',
      '_A choice we cannot legally stop you from making._',
    ],
    primary: "OK, you're right. Stop.",
    secondary: "I don't care. Charge me.",
  },
};

function renderLine(line: string) {
  return line
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/_(.+?)_/g, '<i>$1</i>');
}

export function BeratePopup({ amount, onAccept, onCancel }: BerateContext) {
  const [level, setLevel] = useState<1 | 2>(1);
  const copy = level === 1 ? COPY.level1 : COPY.level2;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
      <motion.div
        key={level}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className="bg-paper border-4 border-alarm rounded-xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="text-5xl">⚠️</div>
        <h2 className="mt-3 text-3xl font-bold text-alarm">{copy.title}</h2>
        <div className="mt-3 space-y-2 text-ink">
          {copy.body.map((line, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: renderLine(line) }} />
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          You were about to be charged <b>${amount.toFixed(2)}</b>.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            className="w-full py-3 bg-money text-white rounded font-semibold"
            onClick={onCancel}
          >
            {copy.primary}
          </button>
          <button
            className="w-full py-2 text-sm text-ink-soft underline"
            onClick={() => (level === 1 ? setLevel(2) : onAccept())}
          >
            {copy.secondary}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default BeratePopup;
