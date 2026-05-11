"use client";
import { motion } from 'framer-motion';
import { useState } from 'react';

export type BerateContext = {
  amount: number;
  reason: 'subscribe' | 'iou-payoff' | 'ad-free' | 'top-up';
  onCancel: () => void;
  // onAccept: legacy — used by non-payment callers (e.g. account deletion) for 2-level behavior
  onAccept?: () => void;
  // onGiveUp: used by the payment flow 4-level escalation
  onGiveUp?: () => void;
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
  level3: {
    title: 'WE ARE BEGGING YOU.',
    body: [
      "You've now clicked 'charge me' twice.",
      'Our servers are literally shaking.',
      '_The payment processor called. It was just crying._',
    ],
    primary: 'Okay fine. I will stop.',
    secondary: 'Charge me a third time.',
  },
  level4: {
    title: 'Ok. I give up.',
    body: [
      'We **cannot** actually charge you.',
      'Multiple payment processors were consulted.',
      'They all said no. One filed a restraining order.',
      '**The IOU is right there. It is free. It is easy. Just use it.**',
    ],
    primary: 'Fine. Take me to the IOU →',
    secondary: null,
  },
};

function renderLine(line: string) {
  return line
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/_(.+?)_/g, '<i>$1</i>');
}

export function BeratePopup({ amount, onCancel, onAccept, onGiveUp }: BerateContext) {
  const [level, setLevel] = useState<1 | 2 | 3 | 4>(1);
  const copy = COPY[`level${level}` as keyof typeof COPY];
  // Legacy 2-level mode when onAccept is provided (non-payment callers)
  const legacyMode = !!onAccept;

  function handleSecondary() {
    if (legacyMode && level === 2) {
      onAccept!();
    } else if (level < 4) {
      setLevel((l) => (l + 1) as 2 | 3 | 4);
    }
  }

  function handlePrimary() {
    if (level === 4) {
      onGiveUp?.();
    } else {
      onCancel();
    }
  }

  const maxLevel = legacyMode ? 2 : 4;
  const showSecondary = copy.secondary !== null && level < maxLevel + 1;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
      <motion.div
        key={level}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className="bg-paper border-4 border-alarm rounded-xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="text-5xl">{level === 4 ? '🏳️' : '⚠️'}</div>
        <h2 className="mt-3 text-3xl font-bold text-alarm">{copy.title}</h2>
        <div className="mt-3 space-y-2 text-ink">
          {copy.body.map((line, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: renderLine(line) }} />
          ))}
        </div>
        {level < 4 && (
          <p className="mt-3 text-sm text-ink-soft">
            You were about to be charged <b>${amount.toFixed(2)}</b>.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            className="w-full py-3 bg-money text-white rounded font-semibold"
            onClick={handlePrimary}
          >
            {copy.primary}
          </button>
          {showSecondary && copy.secondary && (
            <button
              className="w-full py-2 text-sm text-ink-soft underline"
              onClick={handleSecondary}
            >
              {copy.secondary}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default BeratePopup;
